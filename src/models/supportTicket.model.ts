import mongoose, { Schema, Model } from "mongoose";
import type { ISupportTicket } from "../types/index.js";

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: ["order", "delivery", "payment", "other"],
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ category: 1, status: 1 });

supportTicketSchema.statics["generateTicketNumber"] = async function (): Promise<string> {
  const date = new Date();
  const prefix = `FE-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const lastTicket = await this.findOne({ ticketNumber: new RegExp(`^${prefix}`) })
    .sort({ ticketNumber: -1 })
    .lean();

  let sequence = 1;
  if (lastTicket) {
    const lastSequence = parseInt((lastTicket as LeanTicketNumber).ticketNumber.slice(-4), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
};

interface LeanTicketNumber {
  ticketNumber: string;
}

export interface SupportTicketModel extends Model<ISupportTicket> {
  generateTicketNumber(): Promise<string>;
}

export const SupportTicket = mongoose.model<ISupportTicket, SupportTicketModel>(
  "SupportTicket",
  supportTicketSchema
);
