"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  /** Stock captured when the item was added; used to cap cart quantity. */
  stock?: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const STORAGE_KEY = "perfume-cart";
const EMPTY_ITEMS: CartItem[] = [];

const CartContext = createContext<CartContextValue | undefined>(undefined);

function normalizeStock(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

/** Returns the stock cap for a cart item, or null when stock is unknown. */
export function getCartItemStock(item: Pick<CartItem, "stock">): number | null {
  return normalizeStock(item.stock);
}

function clampQuantity(quantity: unknown, stock: number | null): number {
  const parsed =
    typeof quantity === "number" && Number.isFinite(quantity)
      ? Math.max(0, Math.floor(quantity))
      : 0;
  return stock === null ? parsed : Math.min(parsed, stock);
}

function sanitizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw): CartItem[] => {
    if (!raw || typeof raw !== "object") return [];

    const item = raw as Partial<CartItem>;
    if (typeof item._id !== "string" || !item._id) return [];

    const stock = normalizeStock(item.stock);
    const quantity = clampQuantity(item.quantity, stock);
    if (quantity <= 0) return [];

    return [
      {
        _id: item._id,
        name: typeof item.name === "string" ? item.name : "",
        price:
          typeof item.price === "number" && Number.isFinite(item.price)
            ? item.price
            : 0,
        ...(typeof item.image === "string" ? { image: item.image } : {}),
        quantity,
        ...(stock !== null ? { stock } : {}),
      },
    ];
  });
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeCart(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

// localStorage is an external store. useSyncExternalStore keeps SSR output
// stable (empty cart) while letting the client load the saved cart after mount.
let snapshot: CartItem[] | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CartItem[] {
  if (snapshot === null) snapshot = readStoredCart();
  return snapshot;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_ITEMS;
}

function commit(next: CartItem[]) {
  if (next === snapshot) return;
  snapshot = next;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  }

  listeners.forEach((listener) => listener());
}

function updateCart(updater: (prev: CartItem[]) => CartItem[]) {
  commit(updater(getSnapshot()));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const stockSynced = useRef(false);

  // Cached carts may be older than the current stock. Refresh once after
  // hydration so quantities are capped to what the server currently has.
  useEffect(() => {
    if (stockSynced.current) return;
    stockSynced.current = true;

    const currentItems = getSnapshot();
    if (currentItems.length === 0) return;

    const controller = new AbortController();
    const ids = [...new Set(currentItems.map((item) => item._id))];

    (async () => {
      try {
        const res = await fetch(
          `/api/products?ids=${encodeURIComponent(ids.join(","))}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;

        const data = (await res.json()) as {
          products?: Array<Record<string, unknown>>;
        };
        const products = Array.isArray(data.products) ? data.products : [];
        const byId = new Map(
          products.map((product) => [String(product._id), product])
        );

        updateCart((prev) =>
          prev.flatMap((item) => {
            const product = byId.get(item._id);
            const stock = normalizeStock(product?.stock);
            if (!product || stock === null) return [item];

            const quantity = clampQuantity(item.quantity, stock);
            if (quantity <= 0) return [];

            const images = product.images;
            const image =
              Array.isArray(images) && typeof images[0] === "string"
                ? images[0]
                : item.image;

            return [
              {
                ...item,
                name:
                  typeof product.name === "string" && product.name
                    ? product.name
                    : item.name,
                price:
                  typeof product.price === "number" &&
                  Number.isFinite(product.price)
                    ? product.price
                    : item.price,
                image,
                stock,
                quantity,
              },
            ];
          })
        );
      } catch {
        // Keep the cached cart if stock cannot be refreshed.
      }
    })();

    return () => controller.abort();
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1) => {
      const requested = clampQuantity(qty, normalizeStock(item.stock));
      if (requested <= 0) return;

      updateCart((prev) => {
        const existing = prev.find((i) => i._id === item._id);
        const stock =
          normalizeStock(item.stock) ?? normalizeStock(existing?.stock);
        const current = existing?.quantity ?? 0;
        const next = clampQuantity(current + requested, stock);

        if (next <= 0) return prev.filter((i) => i._id !== item._id);
        if (existing && next === current) return prev;

        const nextItem: CartItem = {
          _id: item._id,
          name: item.name,
          price: item.price,
          ...(item.image ? { image: item.image } : {}),
          quantity: next,
          ...(stock !== null ? { stock } : {}),
        };

        return existing
          ? prev.map((i) => (i._id === item._id ? nextItem : i))
          : [...prev, nextItem];
      });
      setIsOpen(true);
    },
    []
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    updateCart((prev) =>
      prev.flatMap((item) => {
        if (item._id !== id) return [item];

        const next = clampQuantity(quantity, normalizeStock(item.stock));
        return next > 0 ? [{ ...item, quantity: next }] : [];
      })
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    updateCart((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const clearCart = useCallback(() => updateCart(() => []), []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
