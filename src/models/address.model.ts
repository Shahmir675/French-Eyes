import mongoose, { Schema, Model } from "mongoose";
import type { IAddress } from "../types/index.js";

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "DE",
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });

export const Address: Model<IAddress> = mongoose.model<IAddress>(
  "Address",
  addressSchema
);
