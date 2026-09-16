import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { CartItem } from "./types";

interface CartItemRowProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export default function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemRowProps) {
  const { product, quantity } = item;
  const lineTotal = product.price * quantity;
  const maxed = quantity >= product.stock;

  return (
    <li className="space-y-2.5 py-3.5">
      {/* Top row */}
      <div className="flex items-center gap-3">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl border border-foreground/10 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 text-[10px] font-medium uppercase text-foreground/40">
            N/A
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {product.name}
          </p>
          <p className="mt-0.5 text-xs text-foreground/50">
            {formatCurrency(product.price)} / unit
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/35 transition-colors hover:bg-red-500/10 hover:text-red-500 active:bg-red-500/15"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <span className="min-w-14 text-right text-[15px] font-bold tabular-nums text-foreground">
            {formatCurrency(lineTotal)}
          </span>
        </div>
      </div>

      {/* Stepper row */}
      <div className="flex items-center justify-between pl-[60px]">
        <span
          className={`text-xs ${maxed ? "text-amber-600" : "text-foreground/50"}`}
        >
          {maxed ? "Max stock reached" : `${product.stock - quantity} left in stock`}
        </span>
        <div className="flex items-center gap-2 rounded-full border border-foreground/15 bg-background p-1 shadow-[0_1px_2px_rgba(13,27,42,0.04)]">
          <button
            type="button"
            onClick={onDecrease}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 active:bg-foreground/15 sm:h-7 sm:w-7"
            aria-label={`Decrease ${product.name}`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-7 text-center text-[15px] font-bold tabular-nums text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            disabled={maxed}
            onClick={onIncrease}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 active:bg-foreground/15 disabled:cursor-not-allowed disabled:opacity-35 sm:h-7 sm:w-7"
            aria-label={`Increase ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}