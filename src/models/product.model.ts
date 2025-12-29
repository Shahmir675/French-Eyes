import mongoose, { Schema, Model } from "mongoose";
import type { IProduct } from "../types/index.js";

const localizedStringSchema = new Schema(
  {
    en: { type: String, required: true, trim: true },
    de: { type: String, required: true, trim: true },
    fr: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const optionChoiceSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    priceModifier: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const productOptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false },
    choices: { type: [optionChoiceSchema], default: [] },
  },
  { _id: false }
);

const productExtraSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: localizedStringSchema,
      required: true,
    },
    description: {
      type: localizedStringSchema,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    options: {
      type: [productOptionSchema],
      default: [],
    },
    extras: {
      type: [productExtraSchema],
      default: [],
    },
    allergens: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: Number,
      default: 15,
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

productSchema.index({ categoryId: 1 });
productSchema.index({ available: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ sortOrder: 1 });
productSchema.index(
  { "name.en": "text", "name.de": "text", "name.fr": "text", "description.en": "text", "description.de": "text", "description.fr": "text" },
  { name: "product_text_search" }
);

export const Product: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);
