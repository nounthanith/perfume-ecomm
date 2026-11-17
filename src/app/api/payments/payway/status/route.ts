import { NextResponse } from "next/server";
import { findPaywayOrder, reconcilePaywayPayment } from "@/lib/payway-order";

export const dynamic = "force-dynamic";

/** Used by the success page to poll until the callback has been processed. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("order") ?? "";
  const tranId = searchParams.get("tranId") ?? "";

  if (!orderNumber || !tranId) {
    return NextResponse.json(
      { error: "order and tranId are required" },
      { status: 400 }
    );
  }

  const order = await findPaywayOrder(orderNumber, tranId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Reconcile while pending so the browser is a reliable confirmation path
  // even when PayWay cannot reach a localhost callback URL.
  const current = await reconcilePaywayPayment(order);

  return NextResponse.json({
    orderNumber: current.orderNumber,
    status: current.status,
    paymentStatus: current.paymentStatus,
    total: current.total,
    amountPaid: current.amountPaid,
  });
}
