import type { Response, NextFunction } from "express";
import type { AuthenticatedDriverRequest } from "../types/index.js";
import { DriverService } from "../services/driver.service.js";
import { sendSuccess } from "../utils/response.js";
import type {
  UpdateProfileInput,
  UpdateLocationInput,
  UpdateOrderStatusInput,
  PaginationQuery,
  TipsQuery,
  CreateSupportTicketInput,
} from "../validators/driver.validator.js";

export class DriverController {
  static async getProfile(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const profile = await DriverService.getProfile(driverId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const input = req.body as UpdateProfileInput;
      const profile = await DriverService.updateProfile(driverId, {
        name: input.name,
        phone: input.phone,
      });
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateLocation(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const input = req.body as UpdateLocationInput;
      await DriverService.updateLocation(driverId, input);
      sendSuccess(res, { message: "Location updated" });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const { page, limit } = req.query as unknown as PaginationQuery;
      const type = req.query["type"] as string | undefined;

      let result;
      if (type === "available") {
        result = await DriverService.getAvailableOrders(driverId, page, limit);
      } else {
        result = await DriverService.getAssignedOrders(driverId, page, limit);
      }

      sendSuccess(res, result.orders, 200, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const orderId = req.params["id"] as string;
      const order = await DriverService.getOrderById(driverId, orderId);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async acceptOrder(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const orderId = req.params["id"] as string;
      const order = await DriverService.acceptOrder(driverId, orderId);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const orderId = req.params["id"] as string;
      const { status, notes } = req.body as UpdateOrderStatusInput;
      const order = await DriverService.updateOrderStatus(
        driverId,
        orderId,
        status,
        notes
      );
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const { page, limit } = req.query as unknown as PaginationQuery;
      const result = await DriverService.getDeliveryHistory(driverId, page, limit);
      sendSuccess(res, result.orders, 200, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTips(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const { page, limit, startDate, endDate } = req.query as unknown as TipsQuery;
      const result = await DriverService.getTips(
        driverId,
        page,
        limit,
        startDate,
        endDate
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const stats = await DriverService.getStats(driverId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async createSupportTicket(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.driver!.driverId;
      const { subject, message, orderId } = req.body as CreateSupportTicketInput;
      const result = await DriverService.createSupportTicket(
        driverId,
        subject,
        message,
        orderId
      );
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
}
