import mongoose, { Schema, Model } from "mongoose";
import type { ILoyaltyReward } from "../types/index.js";

const loyaltyRewardSchema = new Schema<ILoyaltyReward>(
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
    pointsCost: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ["discount", "free_item", "bonus"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
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
  },
  {
    timestamps: true,
  }
);

loyaltyRewardSchema.index({ active: 1, pointsCost: 1 });
loyaltyRewardSchema.index({ type: 1, active: 1 });

export const LoyaltyReward: Model<ILoyaltyReward> =
  mongoose.model<ILoyaltyReward>("LoyaltyReward", loyaltyRewardSchema);
