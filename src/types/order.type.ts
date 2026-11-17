export type PaymentMethod = "cash" | "card" | "transfer" | "payway";
export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface IOrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentStatus: string;
  paywayTranId?: string;
  paywayApv?: string;
  amountPaid: number;
  change: number;
  paidAt?: Date;
  user?: string;
  cashier?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
