import { NextResponse } from "next/server";
import { findPaywayOrder, markPaymentFailed } from "@/lib/payway-order";

export const dynamic = "force-dynamic";

/** Marks an abandoned payment as cancelled and releases reserved stock. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    order?: unknown;
    tranId?: unknown;
  } | null;

  if (
    !body ||
    typeof body.order !== "string" ||
    typeof body.tranId !== "string"
  ) {
    return NextResponse.json(
      { error: "order and tranId are required" },
      { status: 400 }
    );
  }

  const order = await findPaywayOrder(body.order, body.tranId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updated = await markPaymentFailed(order, "cancelled", "CANCELLED");
  return NextResponse.json({ status: updated.status });
}
