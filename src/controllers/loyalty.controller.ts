import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import { LoyaltyService } from "../services/loyalty.service.js";
import { sendSuccess } from "../utils/response.js";
import type {
  PaginationQuery,
  RedeemRewardInput,
} from "../validators/loyalty.validator.js";

export class LoyaltyController {
  static async getPoints(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const balance = await LoyaltyService.getPointsBalance(userId);
      sendSuccess(res, balance);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { page, limit } = req.query as unknown as PaginationQuery;
      const result = await LoyaltyService.getTransactionHistory(
        userId,
        page,
        limit
      );
      sendSuccess(res, result.transactions, 200, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRewards(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rewards = await LoyaltyService.getAvailableRewards();
      sendSuccess(res, rewards);
    } catch (error) {
      next(error);
    }
  }

  static async redeemReward(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { rewardId } = req.body as RedeemRewardInput;
      const result = await LoyaltyService.redeemReward(userId, rewardId);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAllBonuses(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bonuses = await LoyaltyService.getAllBonuses();
      sendSuccess(res, bonuses);
    } catch (error) {
      next(error);
    }
  }

  static async getActiveBonuses(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bonuses = await LoyaltyService.getActiveBonuses();
      sendSuccess(res, bonuses);
    } catch (error) {
      next(error);
    }
  }
}
