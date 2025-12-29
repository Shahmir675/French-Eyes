import mongoose, { Schema, Model } from "mongoose";
import type { ICategory } from "../types/index.js";

const localizedStringSchema = new Schema(
  {
    en: { type: String, required: true, trim: true },
    de: { type: String, required: true, trim: true },
    fr: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: localizedStringSchema,
      required: true,
    },
    description: {
      type: localizedStringSchema,
      required: true,
    },
    image: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ sortOrder: 1 });
categorySchema.index({ active: 1 });

export const Category: Model<ICategory> = mongoose.model<ICategory>("Category", categorySchema);
