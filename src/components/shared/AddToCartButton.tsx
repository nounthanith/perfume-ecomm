"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
}

export default function AddToCartButton({
  productId,
  name,
  price,
  image,
  stock,
}: AddToCartButtonProps) {
  const { items, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = items.find((item) => item._id === productId)?.quantity ?? 0;
  const remaining = Math.max(0, Math.floor(stock) - inCart);
  const available = remaining > 0;
  const selected = Math.min(quantity, Math.max(1, remaining));

  const changeQuantity = (delta: number) => {
    setQuantity(
      Math.min(Math.max(selected + delta, 1), Math.max(1, remaining))
    );
  };

  const handleAdd = () => {
    if (!available) return;
    addToCart({ _id: productId, name, price, image, stock }, selected);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground/70">
          Quantity
        </span>
        <div className="flex items-center border border-foreground/10">
          <button
            type="button"
            onClick={() => changeQuantity(-1)}
            disabled={selected <= 1 || !available}
            aria-label="Decrease quantity"
            className="px-3 py-2 text-lg leading-none text-foreground/70 transition-colors hover:bg-foreground/5 disabled:opacity-40"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-semibold">
            {selected}
          </span>
          <button
            type="button"
            onClick={() => changeQuantity(1)}
            disabled={selected >= remaining || !available}
            aria-label="Increase quantity"
            className="px-3 py-2 text-lg leading-none text-foreground/70 transition-colors hover:bg-foreground/5 disabled:opacity-40"
          >
            +
          </button>
        </div>
        {available && (
          <span className="text-xs text-gray-500">max {remaining} more</span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          size="lg"
          className="sm:px-10"
          disabled={!available}
          onClick={handleAdd}
        >
          {!available
            ? stock <= 0
              ? "Sold Out"
              : "Max in Cart"
            : added
              ? "Added to Cart ✓"
              : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
