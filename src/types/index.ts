import { Request } from "express";
import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  authProvider: "email" | "google" | "facebook";
  providerId?: string;
  loyaltyPoints: number;
  language: "de" | "en" | "fr";
  status: "active" | "inactive";
  gdprConsent: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  createdAt: Date;
}

export interface IAddress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
  deliveryInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export type AuthProvider = "email" | "google" | "facebook";
export type Language = "de" | "en" | "fr";
export type UserStatus = "active" | "inactive";
