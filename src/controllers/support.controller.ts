import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import { SupportService } from "../services/support.service.js";
import { sendSuccess } from "../utils/response.js";
import type {
  CreateTicketInput,
  AddMessageInput,
  PaginationQuery,
} from "../validators/support.validator.js";
import type { SupportTicketStatus } from "../types/index.js";

export class SupportController {
  static async createTicket(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const body = req.body as CreateTicketInput;
      const ticket = await SupportService.createTicket(userId, {
        subject: body.subject,
        category: body.category,
        orderId: body.orderId,
        message: body.message,
      });
      sendSuccess(res, ticket, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getTickets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { page, limit, status } = req.query as unknown as PaginationQuery;
      const result = await SupportService.getUserTickets(
        userId,
        page,
        limit,
        status as SupportTicketStatus | undefined
      );
      sendSuccess(res, result.tickets, 200, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const id = req.params["id"] as string;
      const ticket = await SupportService.getTicketById(userId, id);
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  static async addMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const id = req.params["id"] as string;
      const { message } = req.body as AddMessageInput;
      const newMessage = await SupportService.addMessage(userId, id, message);
      sendSuccess(res, newMessage, 201);
    } catch (error) {
      next(error);
    }
  }
}
