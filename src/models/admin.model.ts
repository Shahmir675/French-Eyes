import mongoose, { Schema, Model } from "mongoose";
import type { IAdmin } from "../types/index.js";

const adminSchema = new Schema<IAdmin>(
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
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager"],
      default: "admin",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    permissions: {
      type: [String],
      default: [],
    },
    lastLoginAt: {
      type: Date,
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

adminSchema.index({ status: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);
