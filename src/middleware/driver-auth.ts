import type { Response, NextFunction } from "express";
import { DriverAuthService } from "../services/driver-auth.service.js";
import { Driver } from "../models/driver.model.js";
import { AppError } from "../utils/errors.js";
import type { AuthenticatedDriverRequest } from "../types/index.js";

export async function authenticateDriver(
  req: AuthenticatedDriverRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("No token provided");
    }

    const token = authHeader.substring(7);
    const payload = await DriverAuthService.verifyAccessToken(token);

    const driver = await Driver.findById(payload.driverId).select("status");

    if (!driver) {
      throw AppError.driverNotFound();
    }

    if (driver.status === "inactive") {
      throw AppError.driverInactive();
    }

    req.driver = {
      driverId: payload.driverId,
      email: payload.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}
