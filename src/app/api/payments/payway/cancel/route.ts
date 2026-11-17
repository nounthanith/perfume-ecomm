import { NextResponse } from "next/server";
import {
  findPaywayOrder,
  markPaymentFailed,
  reconcilePaywayPaymentDetailed,
} from "@/lib/payway-order";

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

  // The customer can reach the cancel page after paying (slow callback, back
  // button, etc.). Ask PayWay first so a real payment is never cancelled.
  const { order: reconciled } = await reconcilePaywayPaymentDetailed(order);

  const updated =
    reconciled.status === "pending"
      ? await markPaymentFailed(reconciled, "cancelled", "CANCELLED")
      : reconciled;

  return NextResponse.json({ status: updated.status });
}
