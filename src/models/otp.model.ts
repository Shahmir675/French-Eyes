import mongoose, { Schema, Model } from "mongoose";
import type { IOtp } from "../types/index.js";

const otpSchema = new Schema<IOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["registration", "password_reset"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp: Model<IOtp> = mongoose.model<IOtp>("Otp", otpSchema);
