import { Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../utils/response.js";
import { AppError } from "../utils/errors.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  UpdateProfileInput,
  CreateAddressInput,
  UpdateAddressInput,
  AddressIdParam,
} from "../validators/user.validator.js";

export class UserController {
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const result = await UserService.getProfile(req.user.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(
    req: AuthenticatedRequest & { body: UpdateProfileInput },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const result = await UserService.updateProfile(req.user.userId, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      await UserService.deleteAccount(req.user.userId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async exportData(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const result = await UserService.exportUserData(req.user.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getAddresses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const result = await UserService.getAddresses(req.user.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createAddress(
    req: AuthenticatedRequest & { body: CreateAddressInput },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const result = await UserService.createAddress(req.user.userId, req.body);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateAddress(
    req: AuthenticatedRequest & { params: AddressIdParam; body: UpdateAddressInput },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const result = await UserService.updateAddress(
        req.user.userId,
        req.params.id,
        req.body
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAddress(
    req: AuthenticatedRequest & { params: AddressIdParam },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      await UserService.deleteAddress(req.user.userId, req.params.id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async setDefaultAddress(
    req: AuthenticatedRequest & { params: AddressIdParam },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const result = await UserService.setDefaultAddress(
        req.user.userId,
        req.params.id
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
