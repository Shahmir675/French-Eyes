import mongoose, { Schema, Model } from "mongoose";
import type { IRestaurant } from "../types/index.js";

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    priceRange: {
      type: String,
      required: true,
    },
    deliveryTime: {
      type: String,
      required: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    cuisineTypes: {
      type: [String],
      default: [],
    },
    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
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

restaurantSchema.index({ active: 1 });
restaurantSchema.index({ isOpen: 1 });
restaurantSchema.index({ cuisineTypes: 1 });
restaurantSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });
restaurantSchema.index({ name: "text" });

export const Restaurant: Model<IRestaurant> = mongoose.model<IRestaurant>("Restaurant", restaurantSchema);
