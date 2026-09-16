export type PaymentMethod = "cash" | "card" | "transfer";

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
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  cashier: string;
  createdAt?: Date;
  updatedAt?: Date;
}