"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

type PaymentState = "checking" | "paid" | "pending" | "failed";

function SuccessContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order") ?? "";
  const tran = searchParams.get("tran") ?? "";
  const { clearCart } = useCart();

  const [state, setState] = useState<PaymentState>("checking");
  const [orderNumber, setOrderNumber] = useState(order);

  useEffect(() => {
    if (!order || !tran) {
      setState("failed");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/payments/payway/status?order=${encodeURIComponent(
            order
          )}&tranId=${encodeURIComponent(tran)}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setState("failed");
          return;
        }

        setOrderNumber(data.orderNumber || order);

        if (data.status === "paid") {
          setState("paid");

          // Only clear a cart that belongs to this completed checkout.
          try {
            const raw = sessionStorage.getItem("payway-pending-order");
            const pending = raw ? JSON.parse(raw) : null;
            if (pending?.orderNumber === data.orderNumber) {
              clearCart();
              sessionStorage.removeItem("payway-pending-order");
            }
          } catch {
            // Ignore storage errors — the payment itself is still confirmed.
          }
          return;
        }

        if (data.status === "failed" || data.status === "cancelled") {
          setState("failed");
          return;
        }
      } catch {
        // Network hiccup — keep polling.
      }

      attempts += 1;
      if (attempts >= 20) {
        setState("pending");
        return;
      }
      timer = window.setTimeout(poll, 2000);
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [order, tran, clearCart]);

  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-20 text-center sm:px-6">
      {state === "checking" && (
        <>
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <h1 className="text-2xl font-semibold">
            Confirming your payment…
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            We&apos;re checking the transaction with ABA PayWay. This can take a
            few seconds.
          </p>
        </>
      )}

      {state === "paid" && (
        <>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-emerald-500 text-2xl text-emerald-500">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Payment successful</h1>
          <p className="mt-3 text-sm text-foreground/60">
            Thank you for your order. Your payment has been verified.
          </p>
          {orderNumber && (
            <p className="mt-4 text-sm">
              Order number: <span className="font-semibold">{orderNumber}</span>
            </p>
          )}
          <Link
            href="/"
            className="mt-8 inline-flex border border-foreground px-6 py-3 text-sm font-medium hover:bg-foreground hover:text-background"
          >
            Continue shopping
          </Link>
        </>
      )}

      {state === "pending" && (
        <>
          <h1 className="text-2xl font-semibold">Payment not confirmed yet</h1>
          <p className="mt-3 text-sm text-foreground/60">
            We haven&apos;t received a confirmed result from PayWay. If you
            completed the payment, please check again in a moment.
          </p>
          {orderNumber && (
            <p className="mt-4 text-sm">
              Order number: <span className="font-semibold">{orderNumber}</span>
            </p>
          )}
          <Button
            type="button"
            className="mt-8"
            onClick={() => window.location.reload()}
          >
            Check again
          </Button>
        </>
      )}

      {state === "failed" && (
        <>
          <h1 className="text-2xl font-semibold">
            We couldn&apos;t confirm this payment
          </h1>
          <p className="mt-3 text-sm text-foreground/60">
            The payment was cancelled, declined, or the confirmation link is
            invalid. Your cart has been kept so you can try again.
          </p>
          <Link
            href="/checkout"
            className="mt-8 inline-flex border border-foreground px-6 py-3 text-sm font-medium hover:bg-foreground hover:text-background"
          >
            Back to checkout
          </Link>
        </>
      )}
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-20 text-center">
          <p className="text-sm text-foreground/60">Loading…</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
