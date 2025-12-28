import { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { Session } from "../models/session.model.js";
import { TokenService } from "./token.service.js";
import { EmailService } from "./email.service.js";
import { AppError } from "../utils/errors.js";
import type { IUser, IAddress } from "../types/index.js";
import type {
  UpdateProfileInput,
  CreateAddressInput,
  UpdateAddressInput,
} from "../validators/user.validator.js";

export class UserService {
  static async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string;
    authProvider: string;
    loyaltyPoints: number;
    language: string;
    status: string;
    createdAt: Date;
  }> {
    const user = await User.findById(userId);

    if (!user) {
      throw AppError.userNotFound();
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      authProvider: user.authProvider,
      loyaltyPoints: user.loyaltyPoints,
      language: user.language,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string;
    language: string;
  }> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: input },
      { new: true }
    );

    if (!user) {
      throw AppError.userNotFound();
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      language: user.language,
    };
  }

  static async deleteAccount(userId: string): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw AppError.userNotFound();
    }

    await Promise.all([
      User.deleteOne({ _id: userId }),
      Address.deleteMany({ userId }),
      Session.deleteMany({ userId }),
    ]);

    await EmailService.sendAccountDeletionConfirmation(user.email);
  }

  static async exportUserData(userId: string): Promise<{
    user: Partial<IUser>;
    addresses: Array<Partial<IAddress>>;
    exportedAt: Date;
  }> {
    const user = await User.findById(userId);

    if (!user) {
      throw AppError.userNotFound();
    }

    const addresses = await Address.find({ userId });

    return {
      user: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        language: user.language,
        loyaltyPoints: user.loyaltyPoints,
        createdAt: user.createdAt,
      },
      addresses: addresses.map((addr) => {
        const data: Partial<IAddress> = {
          label: addr.label,
          street: addr.street,
          city: addr.city,
          zipCode: addr.zipCode,
          country: addr.country,
          isDefault: addr.isDefault,
          createdAt: addr.createdAt,
        };
        if (addr.deliveryInstructions) {
          data.deliveryInstructions = addr.deliveryInstructions;
        }
        return data;
      }),
      exportedAt: new Date(),
    };
  }

  static async getAddresses(userId: string): Promise<
    Array<{
      id: string;
      label: string;
      street: string;
      city: string;
      zipCode: string;
      country: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
      deliveryInstructions?: string;
    }>
  > {
    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    return addresses.map((addr) => {
      const base: {
        id: string;
        label: string;
        street: string;
        city: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
        coordinates?: { lat: number; lng: number };
        deliveryInstructions?: string;
      } = {
        id: addr._id.toString(),
        label: addr.label,
        street: addr.street,
        city: addr.city,
        zipCode: addr.zipCode,
        country: addr.country,
        isDefault: addr.isDefault,
      };
      if (addr.coordinates) {
        base.coordinates = addr.coordinates;
      }
      if (addr.deliveryInstructions) {
        base.deliveryInstructions = addr.deliveryInstructions;
      }
      return base;
    });
  }

  static async createAddress(
    userId: string,
    input: CreateAddressInput
  ): Promise<{
    id: string;
    label: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
    deliveryInstructions?: string;
  }> {
    if (input.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const address = await Address.create({
      userId: new Types.ObjectId(userId),
      ...input,
    });

    const result: {
      id: string;
      label: string;
      street: string;
      city: string;
      zipCode: string;
      country: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
      deliveryInstructions?: string;
    } = {
      id: address._id.toString(),
      label: address.label,
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    };
    if (address.coordinates) {
      result.coordinates = address.coordinates;
    }
    if (address.deliveryInstructions) {
      result.deliveryInstructions = address.deliveryInstructions;
    }
    return result;
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ): Promise<{
    id: string;
    label: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
    deliveryInstructions?: string;
  }> {
    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { $set: input },
      { new: true }
    );

    if (!address) {
      throw AppError.addressNotFound();
    }

    const result: {
      id: string;
      label: string;
      street: string;
      city: string;
      zipCode: string;
      country: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
      deliveryInstructions?: string;
    } = {
      id: address._id.toString(),
      label: address.label,
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    };
    if (address.coordinates) {
      result.coordinates = address.coordinates;
    }
    if (address.deliveryInstructions) {
      result.deliveryInstructions = address.deliveryInstructions;
    }
    return result;
  }

  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    const result = await Address.deleteOne({ _id: addressId, userId });

    if (result.deletedCount === 0) {
      throw AppError.addressNotFound();
    }
  }

  static async setDefaultAddress(
    userId: string,
    addressId: string
  ): Promise<{
    id: string;
    label: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
    deliveryInstructions?: string;
  }> {
    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      throw AppError.addressNotFound();
    }

    await Address.updateMany({ userId }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    const result: {
      id: string;
      label: string;
      street: string;
      city: string;
      zipCode: string;
      country: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
      deliveryInstructions?: string;
    } = {
      id: address._id.toString(),
      label: address.label,
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    };
    if (address.coordinates) {
      result.coordinates = address.coordinates;
    }
    if (address.deliveryInstructions) {
      result.deliveryInstructions = address.deliveryInstructions;
    }
    return result;
  }
}
