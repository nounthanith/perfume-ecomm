import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { forbidden, requireRole } from "@/lib/guard";
import Order from "@/models/Order";
import {
  BUCKET_FORMATS,
  MAX_RANGE_DAYS,
  buildBuckets,
  isBucketUnit,
  isRangePreset,
} from "@/lib/sales-range";
import type { SalesReport } from "@/types/sales.type";

export const dynamic = "force-dynamic";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const MAX_TOP_PRODUCTS = 8;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(req: NextRequest) {
  const session = await requireRole("admin", "cashier");
  if (!session) return forbidden();

  const { searchParams } = req.nextUrl;

  const preset = searchParams.get("preset");
  if (!isRangePreset(preset)) {
    return badRequest("preset must be one of: today, yesterday, week, month, year");
  }

  const unit = searchParams.get("unit");
  if (!isBucketUnit(unit)) {
    return badRequest("unit must be one of: hour, day, month");
  }

  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  if (!from || !to) {
    return badRequest("from and to must be valid ISO dates");
  }
  if (from >= to) {
    return badRequest("from must be earlier than to");
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY) {
    return badRequest(`range cannot exceed ${MAX_RANGE_DAYS} days`);
  }

  // Minutes to add to UTC to reach shop-local time (client sends -getTimezoneOffset()).
  const rawTz = Number(searchParams.get("tz"));
  const tzOffsetMinutes = Number.isFinite(rawTz)
    ? Math.min(840, Math.max(-840, Math.round(rawTz)))
    : 0;

  const match = { createdAt: { $gte: from, $lt: to } };
  const bucketExpr = {
    $dateToString: {
      format: BUCKET_FORMATS[unit],
      date: { $add: ["$createdAt", tzOffsetMinutes * MINUTE] },
      timezone: "UTC",
    },
  };

  try {
    await connectDB();

    const [summaryRows, seriesRows, topRows] = await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
            units: { $sum: { $sum: "$items.quantity" } },
          },
        },
      ]),
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: bucketExpr,
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            units: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: MAX_TOP_PRODUCTS },
      ]),
    ]);

    const summary = summaryRows[0] ?? { revenue: 0, orders: 0, units: 0 };
    const revenue = round2(summary.revenue ?? 0);
    const orders = summary.orders ?? 0;

    const byKey = new Map(
      seriesRows.map((row) => [String(row._id), row] as const)
    );

    const report: SalesReport = {
      range: {
        preset,
        from: from.toISOString(),
        to: to.toISOString(),
        unit,
      },
      summary: {
        revenue,
        orders,
        units: summary.units ?? 0,
        avgOrderValue: orders > 0 ? round2(revenue / orders) : 0,
      },
      series: buildBuckets(from, to, unit, tzOffsetMinutes).map((bucket) => {
        const row = byKey.get(bucket.key);
        return {
          key: bucket.key,
          label: bucket.label,
          title: bucket.title,
          revenue: round2(row?.revenue ?? 0),
          orders: row?.orders ?? 0,
        };
      }),
      topProducts: topRows.map((row) => ({
        id: String(row._id),
        name: String(row.name ?? "Unknown"),
        units: row.units ?? 0,
        revenue: round2(row.revenue ?? 0),
      })),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/orders/stats failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}