"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";

type CancelState = "cancelling" | "done" | "error";

function CancelContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order") ?? "";
  const tran = searchParams.get("tran") ?? "";
  const started = useRef(false);
  const [state, setState] = useState<CancelState>("cancelling");

  const cancelOrder = useCallback(async () => {
    if (!order || !tran) {
      setState("error");
      return;
    }

    setState("cancelling");

    // A failed request must not silently leave the reserved stock deducted.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await fetch("/api/payments/payway/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order, tranId: tran }),
        });
        if (!res.ok) throw new Error(`Cancel failed: ${res.status}`);
        setState("done");
        return;
      } catch {
        if (attempt < 2) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, 800 * (attempt + 1))
          );
        }
      }
    }

    setState("error");
  }, [order, tran]);

  useEffect(() => {
    if (!order || !tran || started.current) return;
    started.current = true;

    void cancelOrder();

    try {
      sessionStorage.removeItem("payway-pending-order");
    } catch {
      // Ignore storage errors.
    }
  }, [order, tran, cancelOrder]);

  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold">Payment cancelled</h1>
      <p className="mt-3 text-sm text-foreground/60">
        No payment was taken. Your cart is still available if you&apos;d like to
        try again.
      </p>
      {order && (
        <p className="mt-4 text-sm">
          Order number: <span className="font-semibold">{order}</span>
        </p>
      )}
      {state === "cancelling" && (
        <p className="mt-4 text-xs text-foreground/50">
          Releasing your reserved items…
        </p>
      )}
      {state === "done" && (
        <p className="mt-4 text-xs text-emerald-600">
          Stock has been restored.
        </p>
      )}
      {state === "error" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-red-500">
            We couldn&apos;t confirm the cancellation. Please retry so the
            reserved stock is released.
          </p>
          <Button type="button" onClick={() => void cancelOrder()}>
            Retry cancellation
          </Button>
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/checkout"
          className="inline-flex border border-foreground px-6 py-3 text-sm font-medium hover:bg-foreground hover:text-background"
        >
          Back to checkout
        </Link>
        <Link href="/" className="text-sm underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-20 text-center">
          <p className="text-sm text-foreground/60">Loading…</p>
        </main>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
