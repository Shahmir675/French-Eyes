import { Response, NextFunction } from "express";
import { CartService } from "../services/cart.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  AddCartItemInput,
  UpdateCartItemInput,
  ApplyPromoInput,
  CalculateCartInput,
} from "../validators/cart.validator.js";

export class CartController {
  static async getCart(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await CartService.getCart(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async addItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as AddCartItemInput;
      const result = await CartService.addItem(userId, input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const itemId = req.params["id"] as string;
      const input = req.body as UpdateCartItemInput;
      const result = await CartService.updateItem(userId, itemId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const itemId = req.params["id"] as string;
      const result = await CartService.removeItem(userId, itemId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await CartService.clearCart(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async calculate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as CalculateCartInput;
      const result = await CartService.calculate(userId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getBonusEligibility(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await CartService.getBonusEligibility(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async applyPromo(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as ApplyPromoInput;
      const result = await CartService.applyPromo(userId, input.code);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async removePromo(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await CartService.removePromo(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
