import { NextResponse } from "next/server";
import { requireRole, forbidden } from "@/lib/guard";
import { releaseStalePaywayReservations } from "@/lib/payway-order";

export const dynamic = "force-dynamic";

/**
 * Admin/cron endpoint that releases stock held by abandoned PayWay sessions.
 * Accepts either an admin session or `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";

  if (!(cronSecret && authHeader === `Bearer ${cronSecret}`)) {
    const session = await requireRole("admin");
    if (!session) return forbidden();
  }

  const released = await releaseStalePaywayReservations(undefined, 50);
  return NextResponse.json({ released });
}
