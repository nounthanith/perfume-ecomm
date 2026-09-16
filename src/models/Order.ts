import { IOrder, IOrderItem } from "@/types/order.type";
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrderItemDocument
  extends Omit<IOrderItem, "product">, Document {
  product: Types.ObjectId;
}

export interface IOrderDocument
  extends Omit<IOrder, "_id" | "items" | "cashier">, Document {
  items: IOrderItemDocument[];
  cashier: Types.ObjectId;
}

const OrderItemSchema = new Schema<IOrderItemDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer"],
      default: "cash",
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    change: { type: Number, default: 0, min: 0 },
    cashier: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Order: Model<IOrderDocument> =
  mongoose.models.Order ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;