import mongoose, { Schema, Model } from "mongoose";
import type { ICart } from "../types/index.js";

const selectedAddOnSchema = new Schema(
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
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    price: {
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
    selectedAddOns: {
      type: [selectedAddOnSchema],
      default: [],
    },
    specialInstructions: {
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
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
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
