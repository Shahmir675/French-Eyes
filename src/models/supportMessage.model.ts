import mongoose, { Schema, Model } from "mongoose";
import type { ISupportMessage } from "../types/index.js";

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["user", "support"],
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "sender",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

supportMessageSchema.index({ ticketId: 1, createdAt: 1 });

export const SupportMessage: Model<ISupportMessage> = mongoose.model<ISupportMessage>(
  "SupportMessage",
  supportMessageSchema
);
