import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireRole, forbidden } from "@/lib/guard";
import { paginateAll } from "@/lib/crud";
import type { PaymentMethod } from "@/types/order.type";

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "transfer"];

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GF-${date}-${random}`;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

interface OrderItemInput {
  product?: string;
  quantity?: unknown;
}

type DateFilter = { value: Record<string, unknown>; error?: undefined } | { value?: undefined; error: string };

/** Builds an inclusive-exclusive createdAt window from optional ISO dates. */
function dateFilter(from: string | null, to: string | null): DateFilter {
  if (!from && !to) return { value: {} };

  const parse = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const start = from ? parse(from) : null;
  const end = to ? parse(to) : null;

  if (from && !start) return { error: "from must be a valid ISO date" };
  if (to && !end) return { error: "to must be a valid ISO date" };
  if (start && end && start >= end) {
    return { error: "from must be earlier than to" };
  }

  return { value: { createdAt: { $gte: start ?? undefined, $lt: end ?? undefined } } };
}

export async function GET(req: NextRequest) {
  const session = await requireRole("admin", "cashier");
  if (!session) return forbidden();

  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page");

  const filter = dateFilter(searchParams.get("from"), searchParams.get("to"));
  if ("error" in filter) {
    return NextResponse.json({ error: filter.error }, { status: 400 });
  }

  await connectDB();

  if (page) {
    const result = await paginateAll(Order, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(searchParams.get("limit") ?? "10", 10),
      filter: filter.value,
      populate: [{ path: "cashier", select: "name email" }],
    });
    return NextResponse.json({
      orders: result.items,
      pagination: result.pagination,
    });
  }

  const orders = await Order.find(filter.value)
    .populate("cashier", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin", "cashier");
  if (!session) return forbidden();

  try {
    const body = await req.json();
    const items: OrderItemInput[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const customerName =
      typeof body.customerName === "string"
        ? body.customerName.trim().slice(0, 100)
        : "";
    const customerPhone =
      typeof body.customerPhone === "string"
        ? body.customerPhone.trim().slice(0, 30)
        : "";
    const paymentMethod: PaymentMethod = VALID_PAYMENT_METHODS.includes(
      body.paymentMethod
    )
      ? body.paymentMethod
      : "cash";
    const discount = Math.max(0, Number(body.discount) || 0);
    const taxRate = Math.min(100, Math.max(0, Number(body.taxRate) || 0));

    await connectDB();

    const productIds = items
      .map((item) => item.product)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    const lineItems: Array<{
      product: string;
      name: string;
      price: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const quantity = Math.floor(Number(item.quantity) || 0);

      if (!item.product || quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid order item" },
          { status: 400 }
        );
      }

      const product = productMap.get(item.product);
      if (!product) {
        return NextResponse.json(
          { error: "A selected product no longer exists" },
          { status: 400 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }

      lineItems.push({
        product: String(product._id),
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const subtotal = round2(
      lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
    const discounted = Math.max(0, subtotal - discount);
    const taxAmount = round2(discounted * (taxRate / 100));
    const total = round2(discounted + taxAmount);

    if (total <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than zero" },
        { status: 400 }
      );
    }

    if (paymentMethod === "cash") {
      const amountPaid = Number(body.amountPaid) || 0;
      if (amountPaid < total) {
        return NextResponse.json(
          { error: "Amount paid is less than the order total" },
          { status: 400 }
        );
      }
    }

    // Atomically decrement stock to prevent overselling under load
    for (const item of lineItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        return NextResponse.json(
          {
            error: `"${item.name}" is no longer available in sufficient quantity`,
          },
          { status: 409 }
        );
      }
    }

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      items: lineItems,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      total,
      customerName,
      customerPhone,
      paymentMethod,
      amountPaid: Number(body.amountPaid) || total,
      change:
        paymentMethod === "cash"
          ? Math.max(0, (Number(body.amountPaid) || 0) - total)
          : 0,
      cashier: session.user.id,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}