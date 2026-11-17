import { NextResponse } from "next/server";
import { confirmPaid, markPaymentFailed, reconcilePaywayPayment } from "@/lib/payway-order";
import { verifyCallbackSignature } from "@/lib/payway";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

type CallbackBody = {
  tran_id?: string;
  status?: string | number;
  return_params?: string;
  payment_amount?: number | string;
  original_amount?: number | string;
  total_amount?: number | string;
  apv?: string;
  payment_type?: string;
  bank_ref?: string;
};

/**
 * Server-to-server notification from PayWay. This route is public by design —
 * authenticity is checked with the callback HMAC header and, more importantly,
 * by asking PayWay itself for the transaction status before changing an order.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CallbackBody | null;
  if (!body?.tran_id) {
    return NextResponse.json({ error: "Missing tran_id" }, { status: 400 });
  }

  const signature = req.headers.get("x-payway-hmac-sha512") ?? "";
  const hasSignature = signature.length > 0;
  const signatureValid = hasSignature
    ? verifyCallbackSignature(body, signature)
    : false;

  if (hasSignature && !signatureValid) {
    console.warn("Rejected PayWay callback with invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (!hasSignature) {
    console.warn(
      "PayWay callback received without a signature header; relying on check-transaction API"
    );
  }

  await connectDB();
  const order = await Order.findOne({
    paywayTranId: body.tran_id,
    paymentMethod: "payway",
  });

  if (!order) {
    console.warn(`PayWay callback for unknown transaction ${body.tran_id}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (body.return_params && body.return_params !== order.orderNumber) {
    console.warn(
      `PayWay callback return_params mismatch for ${body.tran_id}: ${body.return_params}`
    );
    return NextResponse.json({ error: "Invalid return params" }, { status: 400 });
  }

  const updated = await reconcilePaywayPayment(order);

  // Fallback for environments where the callback arrives but the
  // check-transaction API is temporarily unreachable. A valid HMAC makes the
  // callback payload trustworthy enough to use.
  if (updated.status === "pending" && signatureValid) {
    const paidAmount = Number(
      body.payment_amount ?? body.total_amount ?? body.original_amount ?? 0
    );
    const amountMatches = Math.abs(paidAmount - updated.total) <= 0.01;

    if (String(body.status) === "0" && amountMatches) {
      await confirmPaid(updated);
    } else if (String(body.status) === "200" || String(body.status) === "201") {
      await markPaymentFailed(
        updated,
        String(body.status) === "200" ? "cancelled" : "failed"
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
