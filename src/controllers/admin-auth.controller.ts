import type { Request, Response, NextFunction } from "express";
import { AdminAuthService } from "../services/admin-auth.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedAdminRequest } from "../types/index.js";
import type { AdminLoginInput, AdminRefreshTokenInput } from "../validators/admin.validator.js";

export class AdminAuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as AdminLoginInput;
      const userAgent = req.headers["user-agent"];
      const result = await AdminAuthService.login(input.email, input.password, userAgent);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as AdminRefreshTokenInput;
      await AdminAuthService.logout(refreshToken);
      sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as AdminRefreshTokenInput;
      const userAgent = req.headers["user-agent"];
      const result = await AdminAuthService.refreshTokens(refreshToken, userAgent);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const result = await AdminAuthService.getMe(adminId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
