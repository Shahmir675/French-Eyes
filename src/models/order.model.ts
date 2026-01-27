import mongoose, { Schema, Model } from "mongoose";
import type { IOrder } from "../types/index.js";

const selectedAddOnSchema = new Schema(
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
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
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
    selectedAddOns: {
      type: [selectedAddOnSchema],
      default: [],
    },
    specialInstructions: {
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
    title: { type: String, required: true },
    street: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    completeAddress: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const statusTimelineSchema = new Schema(
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
        "cancelled",
      ],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const driverDetailsSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
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
    response: {
      type: String,
      trim: true,
    },
    respondedAt: {
      type: Date,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    visible: {
      type: Boolean,
      default: true,
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
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    restaurantName: {
      type: String,
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
    discount: {
      type: Number,
      default: 0,
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
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    address: orderAddressSchema,
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "apple_pay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    promoCode: {
      type: String,
    },
    statusTimeline: {
      type: [statusTimelineSchema],
      default: [],
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    driverDetails: driverDetailsSchema,
    notes: {
      type: String,
      trim: true,
    },
    review: reviewSchema,
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ driverId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);
