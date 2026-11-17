import { IOrder, IOrderItem } from "@/types/order.type";
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrderItemDocument
  extends Omit<IOrderItem, "product">, Document {
  product: Types.ObjectId;
}

export interface IOrderDocument
  extends Omit<IOrder, "_id" | "items" | "cashier" | "user">, Document {
  items: IOrderItemDocument[];
  cashier?: Types.ObjectId;
  user?: Types.ObjectId;
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
    currency: { type: String, default: "USD" },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer", "payway"],
      default: "cash",
    },
    // Existing POS orders are completed sales; new gateway orders start pending.
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "paid",
    },
    paymentStatus: { type: String, default: "" },
    // No default: POS orders omit this field so the sparse index stays unique.
    paywayTranId: { type: String },
    paywayApv: { type: String, default: "" },
    amountPaid: { type: Number, default: 0, min: 0 },
    change: { type: Number, default: 0, min: 0 },
    paidAt: { type: Date, default: null },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    cashier: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

OrderSchema.index({ paywayTranId: 1 }, { sparse: true });

const Order: Model<IOrderDocument> =
  mongoose.models.Order ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
