import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../utils/response.js";
import type {
  RegisterInput,
  LoginInput,
  SocialAuthInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
} from "../validators/auth.validator.js";

export class AuthController {
  static async register(
    req: Request<unknown, unknown, RegisterInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const result = await AuthService.register(req.body, userAgent);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async login(
    req: Request<unknown, unknown, LoginInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const result = await AuthService.login(req.body, userAgent);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async socialAuth(
    req: Request<unknown, unknown, SocialAuthInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const result = await AuthService.socialAuth(req.body, userAgent);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(
    req: Request<unknown, unknown, ForgotPasswordInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await AuthService.forgotPassword(req.body);
      sendSuccess(res, {
        message:
          "If an account with this email exists, you will receive a password reset email",
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(
    req: Request<unknown, unknown, ResetPasswordInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await AuthService.resetPassword(req.body);
      sendSuccess(res, { message: "Password has been reset successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(
    req: Request<unknown, unknown, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const result = await AuthService.refreshTokens(
        req.body.refreshToken,
        userAgent
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: Request<unknown, unknown, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await AuthService.logout(req.body.refreshToken);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}
