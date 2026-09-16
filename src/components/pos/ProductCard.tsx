import Image from "next/image";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PosProduct } from "./types";

interface ProductCardProps {
  product: PosProduct;
  stockLeft: number;
  onAdd: (product: PosProduct) => void;
}

export default function ProductCard({
  product,
  stockLeft,
  onAdd,
}: ProductCardProps) {
  const unavailable = stockLeft <= 0;
  const out = product.stock <= 0;
  const low = !out && product.stock <= 5;

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => onAdd(product)}
      className={`group relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border bg-background p-3 text-left shadow-[0_1px_2px_rgba(13,27,42,0.04)] transition-all duration-150 active:scale-[0.98] sm:flex-col sm:items-stretch sm:gap-0 sm:p-0 ${
        unavailable
          ? "cursor-not-allowed border-foreground/5 opacity-50"
          : "border-foreground/10 active:bg-foreground/[0.04] sm:hover:-translate-y-0.5 sm:hover:border-foreground/25 sm:hover:shadow-lg sm:hover:shadow-foreground/5"
      }`}
    >
      {/* Image */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-foreground/[0.04] sm:h-auto sm:w-full sm:aspect-square sm:rounded-none">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 56px, 20vw"
            className="object-cover transition-transform duration-300 sm:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-medium uppercase text-foreground/30 sm:text-[10px]">
            No image
          </div>
        )}

        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full border border-foreground/15 bg-background px-2 py-0.5 text-[9px] font-semibold uppercase text-foreground/60 sm:px-3 sm:py-1 sm:text-[10px]">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col sm:w-full sm:flex-1 sm:p-3 sm:pb-3.5">
        <p className="truncate text-sm font-semibold leading-snug text-foreground sm:line-clamp-2 sm:text-[15px]">
          {product.name}
        </p>

        <div className="mt-1.5 flex items-baseline gap-2 sm:mt-1.5">
          <span className="text-[15px] font-bold tabular-nums tracking-tight text-foreground sm:text-lg">
            {formatCurrency(product.price)}
          </span>
          {!unavailable && (low || out) && (
            <span
              className={`shrink-0 text-[11px] font-semibold sm:hidden ${out ? "text-red-600" : "text-amber-600"}`}
            >
              {out ? "Sold out" : `${product.stock} left`}
            </span>
          )}
        </div>

        {/* Desktop stock pill */}
        <span
          className={`mt-1 hidden w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:mt-auto sm:flex sm:px-2.5 ${
            out
              ? "bg-red-500/10 text-red-600"
              : low
                ? "bg-amber-500/15 text-amber-600"
                : "bg-foreground/5 text-foreground/50"
          }`}
        >
          {out ? "Out of stock" : low ? `${product.stock} left` : "In stock"}
        </span>
      </div>

      {/* Add button */}
      {!unavailable && (
        <>
          {/* Mobile inline */}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow sm:hidden">
            <Plus className="h-4 w-4" />
          </span>
          {/* Desktop hover overlay */}
          <span className="pointer-events-none absolute right-2.5 top-2.5 hidden h-8 w-8 items-center justify-center rounded-full bg-foreground/90 text-background opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100 sm:flex">
            <Plus className="h-4 w-4" />
          </span>
        </>
      )}
    </button>
  );
}