import mongoose, { Schema, Model } from "mongoose";
import type { IRestaurantReview } from "../types/index.js";

const restaurantReviewSchema = new Schema<IRestaurantReview>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

restaurantReviewSchema.index({ restaurantId: 1, createdAt: -1 });
restaurantReviewSchema.index({ userId: 1 });
restaurantReviewSchema.index({ restaurantId: 1, userId: 1 }, { unique: true });

export const RestaurantReview: Model<IRestaurantReview> = mongoose.model<IRestaurantReview>("RestaurantReview", restaurantReviewSchema);
