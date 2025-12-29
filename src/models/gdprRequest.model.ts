import mongoose, { Schema, Model } from "mongoose";
import type { IGDPRRequest } from "../types/index.js";

const gdprRequestSchema = new Schema<IGDPRRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["export", "deletion"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    processedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

gdprRequestSchema.index({ userId: 1 });
gdprRequestSchema.index({ status: 1 });
gdprRequestSchema.index({ createdAt: -1 });

export const GDPRRequest: Model<IGDPRRequest> = mongoose.model<IGDPRRequest>(
  "GDPRRequest",
  gdprRequestSchema
);
