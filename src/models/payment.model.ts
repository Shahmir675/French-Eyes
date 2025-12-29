import mongoose, { Schema, Model } from "mongoose";
import type { IPayment } from "../types/index.js";

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal"],
      required: true,
    },
    providerPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    providerOrderId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "EUR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
    },
    clientSecret: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
    refundedAmount: {
      type: Number,
      min: 0,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ provider: 1, status: 1 });
paymentSchema.index(
  { orderId: 1, provider: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "processing"] },
    },
  }
);

export const Payment: Model<IPayment> = mongoose.model<IPayment>("Payment", paymentSchema);
