"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, Eye, EyeOff, PackageX, Search, ShoppingCart, UserRound } from "lucide-react";
import Button from "@/components/ui/button";
import CartItemRow from "@/components/pos/CartItemRow";
import CategoryChips from "@/components/pos/CategoryChips";
import MobileNav from "@/components/pos/MobileNav";
import PaymentMethods from "@/components/pos/PaymentMethods";
import ProductCard from "@/components/pos/ProductCard";
import ReceiptDialog from "@/components/pos/ReceiptDialog";
import { useFetch } from "@/hooks/useFetch";
import { formatCurrency } from "@/lib/format";
import type { IOrder, PaymentMethod } from "@/types/order.type";
import type {
  CartItem,
  CategoryOption,
  MobileView,
  PosProduct,
} from "@/components/pos/types";

interface ProductsResult {
  products: PosProduct[];
}

interface CategoriesResult {
  categories: CategoryOption[];
}

interface OrderResponse {
  order: IOrder;
}

interface CategoryGroup {
  name: string;
  products: PosProduct[];
}

const PAGE_SIZE = 12;

export default function PosPage() {
  const {
    data: productData,
    refetch: refetchProducts,
    loading: productsLoading,
  } = useFetch<ProductsResult>("/api/products", { cache: false });

  const { data: categoryData, loading: categoriesLoading } =
    useFetch<CategoriesResult>("/api/categories");

  const categories = categoryData?.categories ?? [];

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hideUnavailable, setHideUnavailable] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountInput, setDiscountInput] = useState("0");
  const [taxInput, setTaxInput] = useState("0");
  const [amountPaidInput, setAmountPaidInput] = useState("");

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [receipt, setReceipt] = useState<IOrder | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("products");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = productData?.products ?? [];
    const stockRank = (stock: number) => (stock > 5 ? 0 : stock > 0 ? 1 : 2);
    return list
      .filter((product) => {
        if (activeCategory) {
          const slug =
            typeof product.category === "object" ? product.category.slug : "";
          if (slug !== activeCategory) return false;
        }
        if (term && !product.name.toLowerCase().includes(term)) return false;
        if (hideUnavailable && product.stock <= 0) return false;
        return true;
      })
      .sort(
        (a, b) =>
          stockRank(a.stock) - stockRank(b.stock) || a.name.localeCompare(b.name)
      );
  }, [productData, search, activeCategory, hideUnavailable]);

  const filterKey = `${search.trim()}|${activeCategory}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const groupedResults = useMemo(() => {
    const groups: CategoryGroup[] = [];
    const map = new Map<string, CategoryGroup>();
    for (const product of visibleProducts) {
      const name =
        typeof product.category === "object" && product.category.name
          ? product.category.name
          : "Other";
      let group = map.get(name);
      if (!group) {
        group = { name, products: [] };
        map.set(name, group);
        groups.push(group);
      }
      group.products.push(product);
    }
    return groups;
  }, [visibleProducts]);

  const groupedView = activeCategory === null && !search.trim();

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const discount = Math.max(0, Number(discountInput) || 0);
  const taxRate = Math.min(100, Math.max(0, Number(taxInput) || 0));
  const discounted = Math.max(0, subtotal - discount);
  const taxAmount = discounted * (taxRate / 100);
  const total = Math.max(0, discounted + taxAmount);
  const amountPaid = Number(amountPaidInput) || 0;
  const change = Math.max(0, amountPaid - total);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const stockLeft = (product: PosProduct) => {
    const inCart = cart.find((item) => item.product._id === product._id);
    return product.stock - (inCart?.quantity ?? 0);
  };

  const addToCart = (product: PosProduct) => {
    if (stockLeft(product) <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product._id !== productId) return item;
          const next = item.quantity + delta;
          if (next <= 0) return null;
          return {
            ...item,
            quantity: Math.min(next, item.product.stock),
          };
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountInput("0");
    setTaxInput("0");
    setAmountPaidInput("");
    setCustomerName("");
    setCustomerPhone("");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setCheckoutError("");
    setCheckingOut(true);

    try {
      if (paymentMethod === "cash" && amountPaid < total) {
        setCheckoutError("Amount paid is less than the order total");
        setCheckingOut(false);
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product: item.product._id,
            quantity: item.quantity,
          })),
          customerName,
          customerPhone,
          paymentMethod,
          discount: Math.round(discount * 100) / 100,
          taxRate,
          amountPaid: paymentMethod === "cash" ? amountPaid : total,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || "Failed to complete the order");
        return;
      }

      const order: IOrder = (data as OrderResponse).order;
      setReceipt(order);
      clearCart();
      setMobileView("products");
      await refetchProducts();
    } catch {
      setCheckoutError("Something went wrong. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const canPay = cart.length > 0 && total > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* ===================== Catalog ===================== */}
      <section
        className={`${mobileView === "products" ? "flex" : "hidden"} min-h-0 flex-1 flex-col lg:flex`}
      >
        {/* Toolbar */}
        <div className="shrink-0 space-y-3 border-b border-foreground/10 bg-foreground/[0.02] p-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search perfumes & fragrances..."
                className="h-11 w-full rounded-full border border-foreground/10 bg-background pl-10 pr-4 text-sm text-foreground shadow-sm transition-colors placeholder:text-foreground/40 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 border-foreground/15"
              onClick={() => setSearch("")}
            >
              Clear
            </Button>
          </div>

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <CategoryChips
                categories={categories}
                loading={categoriesLoading}
                active={activeCategory}
                onSelect={setActiveCategory}
              />
            </div>
            <button
              type="button"
              onClick={() => setHideUnavailable((v) => !v)}
              title={
                hideUnavailable ? "Show sold out items" : "Hide sold out items"
              }
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-95 ${hideUnavailable
                ? "border-foreground/15 bg-foreground text-background shadow-sm"
                : "border-foreground/10 bg-background text-foreground/60 hover:border-foreground/25 hover:text-foreground"
                }`}
            >
              {hideUnavailable ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Products */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          {productsLoading ? (
            <div className="grid grid-cols-1 auto-rows-fr gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-foreground/10"
                >
                  <div className="aspect-square animate-pulse bg-foreground/10" />
                  <div className="space-y-2 p-3">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-foreground/10" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-foreground/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
                <PackageX className="h-6 w-6 text-foreground/30" />
              </div>
              <p className="font-medium text-foreground">No products found</p>
              <p className="text-sm text-foreground/50">
                Try a different search or category.
              </p>
            </div>
          ) : groupedView ? (
            <>
              <div className="mb-6 flex items-baseline gap-2">
                <h3 className="text-base font-bold text-foreground">
                  All products
                </h3>
                <span className="text-xs text-foreground/40">
                  {filteredProducts.length} items
                </span>
                <div className="h-px min-w-4 flex-1 bg-foreground/10" />
              </div>
              {groupedResults.map((group) => (
                <section key={group.name} className="mb-8 last:mb-0">
                  <div className="mb-3 flex items-center gap-2.5">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-foreground/60">
                      {group.name}
                    </h4>
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold text-foreground/45">
                      {group.products.length}
                    </span>
                    <div className="h-px min-w-4 flex-1 bg-foreground/10" />
                  </div>
                  <div className="grid grid-cols-1 auto-rows-fr gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {group.products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        stockLeft={stockLeft(product)}
                        onAdd={addToCart}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : (
            <div className="grid grid-cols-1 auto-rows-fr gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  stockLeft={stockLeft(product)}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}

          {!productsLoading && filteredProducts.length > 0 && (
            visibleCount < filteredProducts.length ? (
              <div className="flex flex-col items-center gap-2 pb-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full max-w-xs rounded-xl"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  Load more ({filteredProducts.length - visibleCount} left)
                </Button>
                <p className="text-xs text-foreground/40">
                  Showing {visibleCount} of {filteredProducts.length} products
                </p>
              </div>
            ) : (
              <p className="pt-6 text-center text-xs text-foreground/40">
                Showing all {filteredProducts.length} products
              </p>
            )
          )}
        </div>
      </section>

      {/* ===================== Cart ===================== */}
      <section
        className={`${mobileView === "cart" ? "flex" : "hidden"} min-h-0 flex-1 flex-col overflow-y-auto border-t border-foreground/10 bg-foreground/[0.02] lg:flex-none lg:w-[400px] lg:overflow-hidden lg:border-l lg:border-t-0 lg:flex`}
      >
        {/* Cart header */}
        <div className="flex shrink-0 items-center justify-between border-b border-foreground/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-5 w-5 text-foreground/70" />
            <h2 className="text-sm font-semibold text-foreground">
              Current Sale
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {cartCount > 0 ? (
              <>
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full border border-foreground/10 px-3 py-1 text-xs font-medium text-foreground/60 transition-colors hover:border-red-500/30 hover:text-red-500"
                >
                  Clear all
                </button>
                <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">
                  {cartCount} items
                </span>
              </>
            ) : (
              <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-0.5 text-xs text-foreground/50">
                Empty
              </span>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="px-4 py-2 lg:min-h-0 lg:flex-1 lg:max-h-[44vh] lg:overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02]">
                <ShoppingCart className="h-6 w-6 text-foreground/25" />
              </div>
              <div>
                <p className="font-medium text-foreground">Cart is empty</p>
                <p className="mt-0.5 text-sm text-foreground/50">
                  Tap a product to start a sale.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 lg:hidden"
                onClick={() => setMobileView("products")}
              >
                Browse products
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-foreground/[0.05]">
              {cart.map((item) => (
                <CartItemRow
                  key={item.product._id}
                  item={item}
                  onIncrease={() => changeQuantity(item.product._id, 1)}
                  onDecrease={() => changeQuantity(item.product._id, -1)}
                  onRemove={() => removeItem(item.product._id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Checkout panel */}
        <div className="shrink-0 space-y-4 border-t border-foreground/10 bg-background px-5 pb-5 pt-4">
          {/* Customer */}
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/45">
              Customer
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 transition-colors focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/15">
              <UserRound className="h-4 w-4 shrink-0 text-foreground/40" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name (optional)"
                className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Money controls */}
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/45">
              Discount & tax
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 transition-colors focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/15">
                <label
                  htmlFor="discount"
                  className="block pt-1.5 text-[10px] font-medium uppercase tracking-wide text-foreground/45"
                >
                  Discount $
                </label>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="h-8 w-full bg-transparent pb-1 text-sm font-semibold text-foreground focus:outline-none"
                />
              </div>
              <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 transition-colors focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/15">
                <label
                  htmlFor="tax"
                  className="block pt-1.5 text-[10px] font-medium uppercase tracking-wide text-foreground/45"
                >
                  Tax %
                </label>
                <input
                  id="tax"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxInput}
                  onChange={(e) => setTaxInput(e.target.value)}
                  className="h-8 w-full bg-transparent pb-1 text-sm font-semibold text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/45">
              Payment method
            </p>
            <PaymentMethods
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          {/* Cash received */}
          {paymentMethod === "cash" && (
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="amountPaid"
                  className="text-xs font-semibold text-foreground/60"
                >
                  Cash received
                </label>
                <span className="text-xs text-foreground/40">
                  Total due {formatCurrency(total)}
                </span>
              </div>
              <div className="relative mt-2">
                <input
                  id="amountPaid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  placeholder={formatCurrency(total)}
                  className="h-12 w-full rounded-xl border border-foreground/15 bg-background pl-11 pr-4 text-lg font-bold tabular-nums text-foreground transition-colors placeholder:font-normal placeholder:text-foreground/40 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15"
                />
                <CircleDollarSign className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
              </div>
              {amountPaid > 0 && (
                <p className="mt-2 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3.5 py-2 text-sm text-emerald-700">
                  <span className="font-medium">Change</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatCurrency(change)}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/45">
              Summary
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-foreground/60">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    −{formatCurrency(discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-foreground/60">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-end justify-between border-t border-foreground/10 pt-2">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {checkoutError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-600">
              {checkoutError}
            </div>
          )}

          <Button
            type="button"
            size="lg"
            className="h-12 w-full rounded-xl text-base"
            loading={checkingOut}
            disabled={!canPay}
            onClick={handleCheckout}
          >
            {checkingOut ? "Processing..." : `Charge ${formatCurrency(total)}`}
          </Button>
        </div>
      </section>

      {/* ===================== Mobile bottom nav ===================== */}
      <MobileNav
        view={mobileView}
        cartCount={cartCount}
        onChange={setMobileView}
      />

      {/* ===================== Receipt ===================== */}
      <ReceiptDialog
        open={!!receipt}
        order={receipt}
        onClose={() => setReceipt(null)}
      />
    </div>
  );
}