import { Response, NextFunction } from "express";
import { TokenService } from "../services/token.service.js";
import { AppError } from "../utils/errors.js";
import type { AuthenticatedRequest } from "../types/index.js";

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw AppError.unauthorized("No token provided");
    }

    const token = authHeader.slice(7);
    const payload = await TokenService.verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(AppError.unauthorized("Invalid token"));
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  TokenService.verifyAccessToken(token)
    .then((payload) => {
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
      next();
    })
    .catch(() => {
      next();
    });
}
