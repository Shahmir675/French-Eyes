import mongoose, { Schema, Model } from "mongoose";
import type { IUser } from "../types/index.js";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: function (this: IUser) {
        return this.authProvider === "email";
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "facebook"],
      default: "email",
    },
    providerId: {
      type: String,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      enum: ["de", "en", "fr"],
      default: "de",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    gdprConsent: {
      type: Boolean,
      required: true,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ authProvider: 1, providerId: 1 });
userSchema.index({ status: 1 });

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
