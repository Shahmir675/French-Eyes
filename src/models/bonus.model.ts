import mongoose, { Schema, Model } from "mongoose";
import type { IBonusItem } from "../types/index.js";

const bonusItemSchema = new Schema<IBonusItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    minOrderAmount: {
      type: Number,
      required: true,
      default: 20.01,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
    },
    validUntil: {
      type: Date,
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

bonusItemSchema.index({ active: 1, sortOrder: 1 });
bonusItemSchema.index({ active: 1, validFrom: 1, validUntil: 1 });

export const BonusItem: Model<IBonusItem> =
  mongoose.model<IBonusItem>("BonusItem", bonusItemSchema);
