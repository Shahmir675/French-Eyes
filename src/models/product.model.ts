import mongoose, { Schema, Model } from "mongoose";
import type { IProduct } from "../types/index.js";

const addOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    calories: {
      type: Number,
    },
    servingSize: {
      type: String,
    },
    cookingTime: {
      type: Number,
      default: 15,
    },
    addOns: {
      type: [addOnSchema],
      default: [],
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
    available: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ restaurantId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ available: 1 });
productSchema.index({ sortOrder: 1 });
productSchema.index({ restaurantId: 1, categoryId: 1 });
productSchema.index({ name: "text", description: "text" }, { name: "product_text_search" });

export const Product: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);
