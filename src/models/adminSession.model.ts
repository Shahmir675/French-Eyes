import mongoose, { Schema, Model } from "mongoose";
import type { IAdminSession } from "../types/index.js";

const adminSessionSchema = new Schema<IAdminSession>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

adminSessionSchema.index({ adminId: 1 });
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminSession: Model<IAdminSession> = mongoose.model<IAdminSession>(
  "AdminSession",
  adminSessionSchema
);
