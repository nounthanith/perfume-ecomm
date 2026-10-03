import { ISetting } from "@/types/setting.type";
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettingDocument extends Omit<ISetting, "_id">, Document {}

export const SETTING_KEY = "shop";

const SettingSchema = new Schema<ISettingDocument>(
  {
    key: { type: String, required: true, unique: true, default: SETTING_KEY },
    shopStatus: { type: Boolean, default: true },
    message: { type: String, default: "", maxlength: 200, trim: true },
  },
  { timestamps: true }
);

const Setting: Model<ISettingDocument> =
  mongoose.models.Setting ||
  mongoose.model<ISettingDocument>("Setting", SettingSchema);

export default Setting;