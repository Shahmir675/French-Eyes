import mongoose, { Schema, Model } from "mongoose";
import type { IDeliveryZone } from "../types/index.js";

const coordinatesSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const zoneSchema = new Schema<IDeliveryZone>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["zip", "radius"],
      required: true,
    },
    zipCodes: {
      type: [String],
      default: [],
    },
    center: coordinatesSchema,
    radiusKm: {
      type: Number,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumOrder: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedTime: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

zoneSchema.index({ active: 1 });
zoneSchema.index({ zipCodes: 1 });
zoneSchema.index({ "center.lat": 1, "center.lng": 1 });

export const DeliveryZone: Model<IDeliveryZone> = mongoose.model<IDeliveryZone>(
  "DeliveryZone",
  zoneSchema
);
