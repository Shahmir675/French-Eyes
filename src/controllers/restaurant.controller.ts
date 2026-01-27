import { Request, Response, NextFunction } from "express";
import { RestaurantService } from "../services/restaurant.service.js";
import { sendSuccess } from "../utils/response.js";
import type {
  GetRestaurantsQuery,
  GetNearbyQuery,
  RestaurantIdParam,
  SearchRestaurantsQuery,
} from "../validators/restaurant.validator.js";

export class RestaurantController {
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as GetRestaurantsQuery;
      const result = await RestaurantService.getAll(query);
      sendSuccess(res, result.restaurants, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as RestaurantIdParam;
      const restaurant = await RestaurantService.getById(params.id);
      sendSuccess(res, restaurant);
    } catch (error) {
      next(error);
    }
  }

  static async getMenu(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as RestaurantIdParam;
      const result = await RestaurantService.getMenu(params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async search(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as SearchRestaurantsQuery;
      const result = await RestaurantService.search(query);
      sendSuccess(res, result.restaurants, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getNearby(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as GetNearbyQuery;
      const result = await RestaurantService.getNearby(query);
      sendSuccess(res, result.restaurants, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}
