import { Request, Response, NextFunction } from "express";
import { RestaurantReviewService } from "../services/restaurantReview.service.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  CreateReviewInput,
  GetReviewsQuery,
  ReviewRestaurantParam,
} from "../validators/restaurantReview.validator.js";

export class RestaurantReviewController {
  static async create(
    req: AuthenticatedRequest & {
      params: ReviewRestaurantParam;
      body: CreateReviewInput;
    },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const review = await RestaurantReviewService.create(
        userId,
        req.params.id,
        req.body
      );
      sendCreated(res, review);
    } catch (error) {
      next(error);
    }
  }

  static async getByRestaurant(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as ReviewRestaurantParam;
      const query = req.query as unknown as GetReviewsQuery;
      const result = await RestaurantReviewService.getByRestaurant(params.id, query);
      sendSuccess(res, result.reviews, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}
