import mongoose, { Schema, Model } from "mongoose";
import crypto from "crypto";
import type { IDevice } from "../types/index.js";

const deviceSchema = new Schema<IDevice>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["thermal_printer", "pos_terminal", "display"],
      required: true,
    },
    simNumber: {
      type: String,
      trim: true,
    },
    audioEnabled: {
      type: Boolean,
      default: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "offline"],
      default: "active",
    },
    lastSeenAt: {
      type: Date,
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ name: 1 }, { unique: true });
deviceSchema.index({ status: 1 });
deviceSchema.index({ type: 1 });

interface IDeviceModel extends Model<IDevice> {
  generateToken(): string;
}

const DeviceModel = mongoose.model<IDevice, IDeviceModel>("Device", deviceSchema);

(DeviceModel as IDeviceModel).generateToken = function (): string {
  return crypto.randomBytes(48).toString("hex");
};

export const Device = DeviceModel as IDeviceModel;
