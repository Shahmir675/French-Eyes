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
    fullName: string;
    phoneNumber: string;
    profilePicture?: string;
    authProvider: string;
    loyaltyPoints: number;
    language: string;
    status: string;
    emailVerified: boolean;
    notificationsEnabled: boolean;
    createdAt: Date;
  }> {
    const user = await User.findById(userId);

    if (!user) {
      throw AppError.userNotFound();
    }

    const result: {
      id: string;
      email: string;
      fullName: string;
      phoneNumber: string;
      profilePicture?: string;
      authProvider: string;
      loyaltyPoints: number;
      language: string;
      status: string;
      emailVerified: boolean;
      notificationsEnabled: boolean;
      createdAt: Date;
    } = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      authProvider: user.authProvider,
      loyaltyPoints: user.loyaltyPoints,
      language: user.language,
      status: user.status,
      emailVerified: user.emailVerified,
      notificationsEnabled: user.notificationsEnabled,
      createdAt: user.createdAt,
    };

    if (user.profilePicture) {
      result.profilePicture = user.profilePicture;
    }

    return result;
  }

  static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<{
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    profilePicture?: string;
    language: string;
    notificationsEnabled: boolean;
  }> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: input },
      { new: true }
    );

    if (!user) {
      throw AppError.userNotFound();
    }

    const result: {
      id: string;
      email: string;
      fullName: string;
      phoneNumber: string;
      profilePicture?: string;
      language: string;
      notificationsEnabled: boolean;
    } = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      language: user.language,
      notificationsEnabled: user.notificationsEnabled,
    };

    if (user.profilePicture) {
      result.profilePicture = user.profilePicture;
    }

    return result;
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
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        language: user.language,
        loyaltyPoints: user.loyaltyPoints,
        createdAt: user.createdAt,
      },
      addresses: addresses.map((addr) => ({
        title: addr.title,
        street: addr.street,
        state: addr.state,
        zipCode: addr.zipCode,
        completeAddress: addr.completeAddress,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
      })),
      exportedAt: new Date(),
    };
  }

  static async getAddresses(userId: string): Promise<
    Array<{
      id: string;
      title: string;
      street: string;
      state: string;
      zipCode: string;
      completeAddress: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
    }>
  > {
    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    return addresses.map((addr) => {
      const base: {
        id: string;
        title: string;
        street: string;
        state: string;
        zipCode: string;
        completeAddress: string;
        isDefault: boolean;
        coordinates?: { lat: number; lng: number };
      } = {
        id: addr._id.toString(),
        title: addr.title,
        street: addr.street,
        state: addr.state,
        zipCode: addr.zipCode,
        completeAddress: addr.completeAddress,
        isDefault: addr.isDefault,
      };
      if (addr.coordinates) {
        base.coordinates = addr.coordinates;
      }
      return base;
    });
  }

  static async createAddress(
    userId: string,
    input: CreateAddressInput
  ): Promise<{
    id: string;
    title: string;
    street: string;
    state: string;
    zipCode: string;
    completeAddress: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
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
      title: string;
      street: string;
      state: string;
      zipCode: string;
      completeAddress: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
    } = {
      id: address._id.toString(),
      title: address.title,
      street: address.street,
      state: address.state,
      zipCode: address.zipCode,
      completeAddress: address.completeAddress,
      isDefault: address.isDefault,
    };
    if (address.coordinates) {
      result.coordinates = address.coordinates;
    }
    return result;
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ): Promise<{
    id: string;
    title: string;
    street: string;
    state: string;
    zipCode: string;
    completeAddress: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
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
      title: string;
      street: string;
      state: string;
      zipCode: string;
      completeAddress: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
    } = {
      id: address._id.toString(),
      title: address.title,
      street: address.street,
      state: address.state,
      zipCode: address.zipCode,
      completeAddress: address.completeAddress,
      isDefault: address.isDefault,
    };
    if (address.coordinates) {
      result.coordinates = address.coordinates;
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
    title: string;
    street: string;
    state: string;
    zipCode: string;
    completeAddress: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
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
      title: string;
      street: string;
      state: string;
      zipCode: string;
      completeAddress: string;
      coordinates?: { lat: number; lng: number };
      isDefault: boolean;
    } = {
      id: address._id.toString(),
      title: address.title,
      street: address.street,
      state: address.state,
      zipCode: address.zipCode,
      completeAddress: address.completeAddress,
      isDefault: address.isDefault,
    };
    if (address.coordinates) {
      result.coordinates = address.coordinates;
    }
    return result;
  }
}
