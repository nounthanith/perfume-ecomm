import { Types } from "mongoose";
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

/** A pending PayWay order older than this is treated as abandoned. */
export const PAYWAY_RESERVATION_TTL_MINUTES = 30;

export interface ReconcileOutcome {
  order: IOrderDocument;
  /**
   * True only when PayWay actually answered check-transaction. A callback must
   * not fall back to its own payload when PayWay explicitly said "PENDING".
   */
  checked: boolean;
  result?: PaywayTransactionStatus;
}

/** Returns the freshest copy of an order, falling back to the one we were given. */
async function refreshOrder(order: IOrderDocument): Promise<IOrderDocument> {
  return (await Order.findById(order._id)) ?? order;
}

/** Restores reserved stock, retrying transient database failures. */
export async function releaseReservedStock(
  items: Array<{ product: Types.ObjectId | string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
        break;
      } catch (error) {
        if (attempt === 2) {
          console.error(`Failed to release stock for ${String(item.product)}:`, error);
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * (attempt + 1))
          );
        }
      }
    }
  }
}

export async function confirmPaid(
  order: IOrderDocument,
  result?: PaywayTransactionStatus
): Promise<IOrderDocument> {
  // Claim the transition atomically. Without this, a callback and the status
  // poller can both act on the same stale "pending" document.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: "pending" },
    {
      $set: {
        status: "paid",
        paymentStatus: result?.paymentStatus || "APPROVED",
        paywayApv: result?.apv || "",
        amountPaid: result?.amount ?? order.total,
        change: 0,
        paidAt: new Date(),
      },
    },
    { new: true }
  );

  return claimed ?? refreshOrder(order);
}

export async function markPaymentFailed(
  order: IOrderDocument,
  nextStatus: Extract<OrderStatus, "failed" | "cancelled" | "refunded">,
  paymentStatus = ""
): Promise<IOrderDocument> {
  // Claim the transition before touching stock. A second request that also
  // loaded this order as "pending" will see no match and cannot restore stock
  // a second time.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: "pending" },
    { $set: { status: nextStatus, paymentStatus } },
    { new: true }
  );

  if (!claimed) return refreshOrder(order);

  // Stock was reserved when the order was created — release it now.
  await releaseReservedStock(claimed.items);

  return claimed;
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

/**
 * Releases stock reserved by payments that were never completed. Called when a
 * new checkout starts and by the admin/cron cleanup endpoint, so abandoned
 * PayWay sessions cannot hold inventory forever.
 *
 * Each stale order is reconciled with PayWay first: an order whose payment
 * actually succeeded must never be cancelled just because its callback was
 * lost.
 */
export async function releaseStalePaywayReservations(
  ttlMinutes = PAYWAY_RESERVATION_TTL_MINUTES,
  limit = 3
): Promise<number> {
  await connectDB();

  const cutoff = new Date(Date.now() - ttlMinutes * 60_000);
  const staleOrders = await Order.find({
    status: "pending",
    paymentMethod: "payway",
    createdAt: { $lt: cutoff },
  })
    .sort({ createdAt: 1 })
    .limit(limit);

  let released = 0;
  for (const stale of staleOrders) {
    try {
      const outcome = await reconcilePaywayPaymentDetailed(stale);
      // Only release when PayWay answered (still pending/paid already handled)
      // or explicitly says the transaction does not exist. If the API is down,
      // keep the reservation rather than risk cancelling a real payment.
      const safeToRelease =
        outcome.order.status === "pending" &&
        (outcome.checked || outcome.result?.code === 6);
      if (safeToRelease) {
        await markPaymentFailed(outcome.order, "failed", "EXPIRED");
        released += 1;
      }
    } catch (error) {
      console.error(
        `Failed to release stale reservation for ${stale.orderNumber}:`,
        error
      );
    }
  }

  return released;
}
