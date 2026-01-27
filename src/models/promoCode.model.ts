import mongoose, { Schema, Model } from "mongoose";
import type { IPromoCode } from "../types/index.js";

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
    },
  },
  {
    timestamps: true,
  }
);

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ active: 1, validFrom: 1, validUntil: 1 });
promoCodeSchema.index({ restaurantId: 1 });

export const PromoCode: Model<IPromoCode> = mongoose.model<IPromoCode>("PromoCode", promoCodeSchema);
