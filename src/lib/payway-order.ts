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
  nextStatus: Extract<OrderStatus, "failed" | "cancelled">,
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

/** Checks PayWay's API and applies the result; safe to call repeatedly. */
export async function reconcilePaywayPayment(
  order: IOrderDocument
): Promise<IOrderDocument> {
  if (order.status !== "pending" || !order.paywayTranId) return order;

  const result = await checkTransaction(order.paywayTranId);
  if (!result.ok) return order;

  if (result.approved) {
    const paidAmount = result.amount ?? 0;
    if (Math.abs(paidAmount - order.total) > 0.01) {
      console.error(
        `PayWay amount mismatch for ${order.orderNumber}: expected ${order.total}, got ${paidAmount}`
      );
      return order;
    }
    return confirmPaid(order, result);
  }

  if ([3, 4, 7].includes(result.paymentStatusCode ?? -1)) {
    return markPaymentFailed(order, "failed", result.paymentStatus);
  }

  return order;
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
