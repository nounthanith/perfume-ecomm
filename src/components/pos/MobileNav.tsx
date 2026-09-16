import { LayoutGrid, ShoppingCart } from "lucide-react";
import type { MobileView } from "./types";

interface MobileNavProps {
  view: MobileView;
  cartCount: number;
  onChange: (view: MobileView) => void;
}

export default function MobileNav({
  view,
  cartCount,
  onChange,
}: MobileNavProps) {
  return (
    <nav
      className="shrink-0 border-t border-foreground/10 bg-background/90 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("products")}
          className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors active:scale-95 ${
            view === "products" ? "text-foreground" : "text-foreground/50"
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          Products
        </button>
        <button
          type="button"
          onClick={() => onChange("cart")}
          className={`relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors active:scale-95 ${
            view === "cart" ? "text-foreground" : "text-foreground/50"
          }`}
        >
          <span className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-bold leading-none text-background">
                {cartCount}
              </span>
            )}
          </span>
          Cart
        </button>
      </div>
    </nav>
  );
}