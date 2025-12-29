import { Response, NextFunction } from "express";
import { OrderService } from "../services/order.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  CreateOrderInput,
  GetOrdersQuery,
  CancelOrderInput,
  ReviewOrderInput,
} from "../validators/order.validator.js";

export class OrderController {
  static async createOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as CreateOrderInput;
      const result = await OrderService.createOrder(userId, input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const query = req.query as unknown as GetOrdersQuery;
      const result = await OrderService.getOrders(userId, query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orderId = req.params["id"] as string;
      const result = await OrderService.getOrderById(userId, orderId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async trackOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orderId = req.params["id"] as string;
      const result = await OrderService.trackOrder(userId, orderId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orderId = req.params["id"] as string;
      const input = req.body as CancelOrderInput;
      const result = await OrderService.cancelOrder(userId, orderId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async reviewOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orderId = req.params["id"] as string;
      const input = req.body as ReviewOrderInput;
      const result = await OrderService.reviewOrder(userId, orderId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async reorder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const orderId = req.params["id"] as string;
      const result = await OrderService.reorder(userId, orderId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
