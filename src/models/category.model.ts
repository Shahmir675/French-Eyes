import mongoose, { Schema, Model } from "mongoose";
import type { ICategory } from "../types/index.js";

const categorySchema = new Schema<ICategory>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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

categorySchema.index({ restaurantId: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ active: 1 });
categorySchema.index({ restaurantId: 1, active: 1, sortOrder: 1 });

export const Category: Model<ICategory> = mongoose.model<ICategory>("Category", categorySchema);
