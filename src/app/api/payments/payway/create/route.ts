import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  createPurchaseRequest,
  generateTranId,
  PaywayConfigError,
  PAYWAY_CURRENCY,
  type PurchaseItem,
} from "@/lib/payway";
import Order, { type IOrderDocument } from "@/models/Order";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

interface OrderItemInput {
  product?: unknown;
  quantity?: unknown;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `GF-${date}-${randomInt(1000, 10000)}`;
}

export async function POST(req: Request) {
  try {
    // Checkout is open to guests; logged-in customers are linked to the order.
    const session = await auth();
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const rawItems: OrderItemInput[] = Array.isArray(body.items)
      ? (body.items as OrderItemInput[])
      : [];

    if (rawItems.length === 0 || rawItems.length > 20) {
      return NextResponse.json(
        { error: "Order must contain between 1 and 20 items" },
        { status: 400 }
      );
    }

    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerPhone =
      typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
    const customerEmail =
      typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";

    if (customerName.length < 2 || customerName.length > 100) {
      return NextResponse.json(
        { error: "Please enter your name" },
        { status: 400 }
      );
    }
    if (!/^[0-9+\-\s()]{6,20}$/.test(customerPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 }
      );
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const parsedItems = rawItems.map((item) => ({
      product: typeof item.product === "string" ? item.product : "",
      quantity: Math.floor(Number(item.quantity) || 0),
    }));

    if (
      parsedItems.some(
        (item) => !isValidObjectId(item.product) || item.quantity < 1 || item.quantity > 99
      )
    ) {
      return NextResponse.json({ error: "Invalid order item" }, { status: 400 });
    }

    await connectDB();

    const products = await Product.find({
      _id: { $in: parsedItems.map((item) => item.product) },
    }).lean();

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    const lineItems: Array<PurchaseItem & { product: string }> = [];
    for (const item of parsedItems) {
      const product = productMap.get(item.product);
      if (!product) {
        return NextResponse.json(
          { error: "A selected product no longer exists" },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
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
        quantity: item.quantity,
      });
    }

    const subtotal = round2(
      lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than zero" },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();
    const tranId = generateTranId();

    // Build (and sign) the PayWay form before reserving any stock.
    const purchase = createPurchaseRequest({
      tranId,
      orderNumber,
      amount: subtotal,
      items: lineItems,
      customerName,
      customerPhone,
      customerEmail,
    });

    const reserved: typeof lineItems = [];
    for (const item of lineItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        // Release the stock reserved for earlier items before bailing out.
        for (const previous of reserved) {
          await Product.updateOne(
            { _id: previous.product },
            { $inc: { stock: previous.quantity } }
          );
        }
        return NextResponse.json(
          { error: `"${item.name}" is no longer available` },
          { status: 409 }
        );
      }
      reserved.push(item);
    }

    const order: IOrderDocument = await Order.create({
      orderNumber,
      items: lineItems.map((item) => ({
        product: new Types.ObjectId(item.product),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      total: subtotal,
      currency: PAYWAY_CURRENCY,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod: "payway",
      status: "pending",
      amountPaid: 0,
      change: 0,
      paywayTranId: tranId,
      ...(session?.user?.id
        ? { user: new Types.ObjectId(session.user.id) }
        : {}),
    });

    return NextResponse.json(
      {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tranId,
        amount: subtotal,
        action: purchase.action,
        fields: purchase.fields,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create PayWay payment error:", error);
    if (error instanceof PaywayConfigError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
