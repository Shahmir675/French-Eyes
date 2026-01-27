import { Response, NextFunction } from "express";
import { NotificationDbService } from "../services/notification-db.service.js";
import { sendSuccess, sendNoContent } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  GetNotificationsQuery,
  NotificationIdParam,
} from "../validators/notification.validator.js";

export class NotificationController {
  static async getAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const query = req.query as unknown as GetNotificationsQuery;
      const result = await NotificationDbService.getAll(userId, query);
      sendSuccess(res, result.notifications, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(
    req: AuthenticatedRequest & { params: NotificationIdParam },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const notification = await NotificationDbService.markAsRead(userId, req.params.id);
      sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      await NotificationDbService.markAllAsRead(userId);
      sendSuccess(res, { message: "All notifications marked as read" });
    } catch (error) {
      next(error);
    }
  }

  static async delete(
    req: AuthenticatedRequest & { params: NotificationIdParam },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      await NotificationDbService.delete(userId, req.params.id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await NotificationDbService.getUnreadCount(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
