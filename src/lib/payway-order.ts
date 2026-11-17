import { connectDB } from "@/lib/db";
import { checkTransaction, type PaywayTransactionStatus } from "@/lib/payway";
import Order, { type IOrderDocument } from "@/models/Order";
import Product from "@/models/Product";
import type { OrderStatus } from "@/types/order.type";

/**
 * Payment state transitions are shared by the PayWay callback and the
 * client-side status poller. Both paths must be idempotent because either one
 * can be the first to observe the result.
 */

export interface ReconcileOutcome {
  order: IOrderDocument;
  /**
   * True only when PayWay actually answered check-transaction. A callback must
   * not fall back to its own payload when PayWay explicitly said "PENDING".
   */
  checked: boolean;
  result?: PaywayTransactionStatus;
}

export async function confirmPaid(
  order: IOrderDocument,
  result?: PaywayTransactionStatus
): Promise<IOrderDocument> {
  if (order.status !== "pending") return order;

  order.status = "paid";
  order.paymentStatus = result?.paymentStatus || "APPROVED";
  order.paywayApv = result?.apv || "";
  order.amountPaid = result?.amount ?? order.total;
  order.change = 0;
  order.paidAt = new Date();
  await order.save();
  return order;
}

export async function markPaymentFailed(
  order: IOrderDocument,
  nextStatus: Extract<OrderStatus, "failed" | "cancelled" | "refunded">,
  paymentStatus = ""
): Promise<IOrderDocument> {
  if (order.status !== "pending") return order;

  // Stock was reserved when the order was created — release it now.
  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } }
    );
  }

  order.status = nextStatus;
  order.paymentStatus = paymentStatus;
  await order.save();
  return order;
}

/**
 * Checks PayWay's API and applies the result; safe to call repeatedly.
 * `checked` tells the caller whether the authoritative API answered, which is
 * needed to decide if an unverified callback payload may be used as fallback.
 */
export async function reconcilePaywayPaymentDetailed(
  order: IOrderDocument
): Promise<ReconcileOutcome> {
  if (order.status !== "pending" || !order.paywayTranId) {
    return { order, checked: false };
  }

  const result = await checkTransaction(order.paywayTranId);
  if (!result.ok) {
    console.warn(
      `PayWay check unavailable for ${order.orderNumber}: code=${String(result.code)} ${result.message}`
    );
    return { order, checked: false, result };
  }

  const paymentStatus = (result.paymentStatus || "").toUpperCase();
  const code = result.paymentStatusCode;

  // PayWay uses 0 for APPROVED *and* PRE-AUTH. Only a completed APPROVED
  // payment may become a paid order; PRE-AUTH/PENDING must stay pending.
  const approved =
    paymentStatus === "APPROVED" ||
    (code === 0 && (paymentStatus === "" || paymentStatus === "UNKNOWN"));

  if (approved) {
    const paidAmount = result.amount ?? 0;
    if (paidAmount <= 0 || Math.abs(paidAmount - order.total) > 0.01) {
      console.error(
        `PayWay amount mismatch for ${order.orderNumber}: expected ${order.total}, got ${paidAmount}`
      );
      return {
        order: await markPaymentFailed(order, "failed", "AMOUNT_MISMATCH"),
        checked: true,
        result,
      };
    }
    return {
      order: await confirmPaid(order, { ...result, paymentStatus: "APPROVED" }),
      checked: true,
      result,
    };
  }

  const failedByCode = [3, 4, 7].includes(code ?? -1);
  const failedByStatus = ["DECLINED", "CANCELLED", "REFUNDED"].includes(
    paymentStatus
  );

  if (failedByCode || failedByStatus) {
    let nextStatus: Extract<OrderStatus, "failed" | "cancelled" | "refunded"> =
      "failed";
    if (paymentStatus === "CANCELLED" || code === 7) nextStatus = "cancelled";
    if (paymentStatus === "REFUNDED" || code === 4) nextStatus = "refunded";

    return {
      order: await markPaymentFailed(
        order,
        nextStatus,
        result.paymentStatus || "UNSUCCESSFUL"
      ),
      checked: true,
      result,
    };
  }

  // PENDING / PRE-AUTH / anything ambiguous stays pending.
  return { order, checked: true, result };
}

/** Backwards-compatible wrapper for callers that only need the order. */
export async function reconcilePaywayPayment(
  order: IOrderDocument
): Promise<IOrderDocument> {
  return (await reconcilePaywayPaymentDetailed(order)).order;
}

export async function findPaywayOrder(
  orderNumber: string,
  tranId: string
): Promise<IOrderDocument | null> {
  await connectDB();
  return Order.findOne({
    orderNumber,
    paywayTranId: tranId,
    paymentMethod: "payway",
  });
}
