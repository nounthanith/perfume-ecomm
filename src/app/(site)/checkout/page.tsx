"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import PaywayRedirectForm from "@/components/payway/PaywayRedirectForm";
import { getCartItemStock, useCart } from "@/context/CartContext";

interface PaymentSetup {
  orderNumber: string;
  tranId: string;
  amount: number;
  action: string;
  fields: Record<string, string>;
}

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const { data: session } = useSession();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentSetup | null>(null);

  // Use the session as a fallback without copying it into state in an effect.
  const customerName = form.customerName || session?.user?.name || "";
  const customerEmail = form.customerEmail || session?.user?.email || "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const overStock = items.find((item) => {
      const stock = getCartItemStock(item);
      return stock !== null && item.quantity > stock;
    });
    if (overStock) {
      setError(
        `"${overStock.name}" only has ${getCartItemStock(overStock)} left in stock. Please update your cart.`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/payments/payway/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone: form.customerPhone,
          customerEmail,
          items: items.map((item) => ({
            product: item._id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to start payment. Please try again.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem(
        "payway-pending-order",
        JSON.stringify({
          orderNumber: data.orderNumber,
          tranId: data.tranId,
        })
      );
      setPayment(data as PaymentSetup);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (payment) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-12 sm:px-6">
        <PaywayRedirectForm action={payment.action} fields={payment.fields} />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Add a product before proceeding to checkout.
        </p>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Back to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Pay securely with ABA PayWay (cards, ABA Pay and KHQR).
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border border-foreground/10 p-6">
            <h2 className="mb-5 text-lg font-semibold">Contact details</h2>
            <div className="space-y-4">
              <Input
                label="Full name"
                name="customerName"
                value={customerName}
                onChange={handleChange}
                placeholder="Your name"
                autoComplete="name"
                required
              />
              <Input
                label="Phone number"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder="012 345 678"
                autoComplete="tel"
                required
              />
              <Input
                label="Email (optional)"
                name="customerEmail"
                type="email"
                value={customerEmail}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </section>

          {error && (
            <div className="border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Pay ${totalPrice.toFixed(2)} with ABA PayWay
          </Button>
          <p className="text-xs text-foreground/50">
            You will be redirected to PayWay&apos;s secure checkout page. Your
            order is only confirmed after payment is verified.
          </p>
        </form>

        <aside className="h-fit border border-foreground/10 p-6">
          <h2 className="mb-5 text-lg font-semibold">
            Order summary ({items.length})
          </h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item._id} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 bg-foreground/5">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-foreground/50">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-4">
            <span className="text-sm">Total (USD)</span>
            <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
