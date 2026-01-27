import mongoose, { Schema, Model } from "mongoose";
import type { IAddress } from "../types/index.js";

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    completeAddress: {
      type: String,
      required: true,
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
