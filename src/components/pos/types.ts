export interface PosProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  category: { _id: string; name: string; slug: string } | string;
}

export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  product: PosProduct;
  quantity: number;
}

export type MobileView = "products" | "cart";