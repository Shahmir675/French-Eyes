import mongoose, { Schema, Model } from "mongoose";
import type { IDriver } from "../types/index.js";

const driverSchema = new Schema<IDriver>(
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    assignedZones: [
      {
        type: Schema.Types.ObjectId,
        ref: "DeliveryZone",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "busy"],
      default: "inactive",
    },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    totalTips: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
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

driverSchema.index({ status: 1 });
driverSchema.index({ assignedZones: 1 });
driverSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const Driver: Model<IDriver> = mongoose.model<IDriver>("Driver", driverSchema);
