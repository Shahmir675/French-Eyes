import mongoose, { Schema, Model } from "mongoose";
import type { ISettings } from "../types/index.js";

const settingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettings> = mongoose.model<ISettings>("Settings", settingsSchema);
