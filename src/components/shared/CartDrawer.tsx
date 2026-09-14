"use client";

import Image from "next/image";
import Button from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    openCart,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalPrice,
    totalItems,
  } = useCart();

  return (
    <>
      <button
        type="button"
        onClick={openCart}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-opacity hover:opacity-90"
        aria-label="Open cart"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {totalItems}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeCart}
            aria-hidden="true"
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background shadow-xl">
            <header className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
              <h2 className="text-lg font-semibold">
                Cart ({totalItems} item{totalItems === 1 ? "" : "s"})
              </h2>
              <button
                type="button"
                onClick={closeCart}
                className="text-2xl leading-none text-gray-500 hover:text-foreground"
                aria-label="Close cart"
              >
                ×
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.length === 0 ? (
                <p className="py-16 text-center text-gray-500">
                  Your cart is empty.
                </p>
              ) : (
                items.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item._id)}
                          className="text-sm text-gray-500 hover:text-red-500"
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-foreground/20">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item._id, item.quantity - 1)
                            }
                            className="px-2 py-1 text-gray-600 hover:text-foreground"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item._id, item.quantity + 1)
                            }
                            className="px-2 py-1 text-gray-600 hover:text-foreground"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <footer className="space-y-3 border-t border-foreground/10 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => window.alert("Checkout coming soon!")}
                  >
                    Checkout
                  </Button>
                </div>
              </footer>
            )}
          </aside>
        </>
      )}
    </>
  );
}