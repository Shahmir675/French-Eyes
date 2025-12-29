import mongoose, { Schema, Model } from "mongoose";
import type { ICart } from "../types/index.js";

const localizedStringSchema = new Schema(
  {
    en: { type: String, required: true, trim: true },
    de: { type: String, required: true, trim: true },
    fr: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const selectedOptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    choice: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const selectedExtraSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: localizedStringSchema,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    selectedOptions: {
      type: [selectedOptionSchema],
      default: [],
    },
    selectedExtras: {
      type: [selectedExtraSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    promoCode: {
      type: String,
      trim: true,
    },
    promoDiscount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Cart: Model<ICart> = mongoose.model<ICart>("Cart", cartSchema);
