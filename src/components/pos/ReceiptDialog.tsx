import { Receipt } from "lucide-react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import type { IOrder, PaymentMethod } from "@/types/order.type";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Bank Transfer",
};

interface ReceiptDialogProps {
  open: boolean;
  order: IOrder | null;
  onClose: () => void;
}

export default function ReceiptDialog({
  open,
  order,
  onClose,
}: ReceiptDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Order complete" className="max-w-sm">
      {order && (
        <div className="text-sm">
          {/* Success banner */}
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700">
                Payment successful
              </p>
              <p className="text-xs text-emerald-700/70">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Items
            </p>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div
                  key={String(item.product)}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="min-w-0 truncate text-foreground">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-foreground/70">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-dashed border-foreground/15 pt-2 text-xs">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-foreground/60">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    −{formatCurrency(order.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-foreground/60">
                <span>Tax ({order.taxRate}%)</span>
                <span className="tabular-nums">
                  {formatCurrency(order.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-foreground/10 pt-1.5 text-sm font-bold text-foreground">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex justify-between text-foreground/60">
                <span>Paid</span>
                <span className="tabular-nums capitalize">
                  {PAYMENT_LABELS[order.paymentMethod]} ·{" "}
                  {formatCurrency(order.amountPaid)}
                </span>
              </div>
              {order.change > 0 && (
                <div className="flex justify-between text-foreground/60">
                  <span>Change</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.change)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => window.print()}
            >
              Print receipt
            </Button>
            <Button
              type="button"
              size="md"
              className="flex-1"
              onClick={onClose}
            >
              New sale
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}