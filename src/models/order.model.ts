import mongoose, { Schema, Model } from "mongoose";
import type { IOrder } from "../types/index.js";

const localizedStringSchema = new Schema(
  {
    en: { type: String, required: true },
    de: { type: String, required: true },
    fr: { type: String, required: true },
  },
  { _id: false }
);

const selectedOptionSchema = new Schema(
  {
    name: { type: String, required: true },
    choice: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const selectedExtraSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: localizedStringSchema,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedOptions: {
      type: [selectedOptionSchema],
      default: [],
    },
    selectedExtras: {
      type: [selectedExtraSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderAddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    deliveryInstructions: { type: String },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
      ],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const reviewSchema = new Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },
    type: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    tip: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    address: orderAddressSchema,
    zoneId: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryZone",
    },
    pickupTime: {
      type: Date,
    },
    prepTime: {
      type: Number,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "stripe", "paypal"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentIntentId: {
      type: String,
    },
    bonusId: {
      type: Schema.Types.ObjectId,
      ref: "BonusItem",
    },
    notes: {
      type: String,
      trim: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    review: reviewSchema,
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ driverId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);
