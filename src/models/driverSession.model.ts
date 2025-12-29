import mongoose, { Schema, Model } from "mongoose";
import type { IDriverSession } from "../types/index.js";

const driverSessionSchema = new Schema<IDriverSession>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

driverSessionSchema.index({ driverId: 1, createdAt: -1 });

export const DriverSession: Model<IDriverSession> = mongoose.model<IDriverSession>(
  "DriverSession",
  driverSessionSchema
);
