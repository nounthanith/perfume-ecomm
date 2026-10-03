"use client";

import { PackageX } from "lucide-react";
import type { TopProduct } from "@/types/sales.type";

interface TopProductsProps {
  data: TopProduct[];
  formatCurrency: (value: number) => string;
  emptyMessage?: string;
}

export default function TopProducts({
  data,
  formatCurrency,
  emptyMessage = "No products sold yet",
}: TopProductsProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/15 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
          <PackageX className="h-6 w-6 text-foreground/40" />
        </div>
        <p className="text-sm font-medium text-foreground/60">{emptyMessage}</p>
      </div>
    );
  }

  const max = Math.max(...data.map((product) => product.revenue), 0);

  return (
    <ol className="space-y-4">
      {data.map((product, index) => {
        const percent = max > 0 ? (product.revenue / max) * 100 : 0;

        return (
          <li key={product.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-foreground/40">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {product.name}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(product.revenue)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3 pl-6">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/5">
                <div
                  className="h-full rounded-full bg-foreground/70"
                  style={{ width: `${Math.max(percent, 2)}%` }}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-foreground/50">
                {product.units} {product.units === 1 ? "unit" : "units"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}