"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function CancelContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order") ?? "";
  const tran = searchParams.get("tran") ?? "";
  const notified = useRef(false);

  useEffect(() => {
    if (!order || !tran || notified.current) return;
    notified.current = true;

    void fetch("/api/payments/payway/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order, tranId: tran }),
    }).catch(() => {
      // The status poller still reconciles real payment results.
    });

    try {
      sessionStorage.removeItem("payway-pending-order");
    } catch {
      // Ignore storage errors.
    }
  }, [order, tran]);

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
