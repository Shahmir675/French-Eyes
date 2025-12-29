import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedDriverRequest } from "../types/index.js";
import { DriverAuthService } from "../services/driver-auth.service.js";
import { sendSuccess } from "../utils/response.js";
import type {
  DriverLoginInput,
  DriverForgotPasswordInput,
} from "../validators/driver.validator.js";

export class DriverAuthController {
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = req.body as DriverLoginInput;
      const userAgent = req.get("user-agent");
      const result = await DriverAuthService.login(input, userAgent);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: AuthenticatedDriverRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const refreshToken = req.body.refreshToken as string | undefined;

      if (refreshToken) {
        await DriverAuthService.logout(refreshToken);
      }

      sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = req.body as DriverForgotPasswordInput;
      await DriverAuthService.forgotPassword(input);
      sendSuccess(res, {
        message: "If an account exists, a password reset email has been sent",
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const userAgent = req.get("user-agent");
      const result = await DriverAuthService.refreshTokens(refreshToken, userAgent);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
