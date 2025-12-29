import mongoose, { Schema, Model } from "mongoose";
import type { ILoyaltyTransaction } from "../types/index.js";

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem", "expire", "adjust"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      ref: "LoyaltyReward",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

loyaltyTransactionSchema.index({ userId: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ type: 1, createdAt: -1 });
loyaltyTransactionSchema.index(
  { orderId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      orderId: { $exists: true },
      type: "earn",
    },
  }
);

export const LoyaltyTransaction: Model<ILoyaltyTransaction> =
  mongoose.model<ILoyaltyTransaction>("LoyaltyTransaction", loyaltyTransactionSchema);
