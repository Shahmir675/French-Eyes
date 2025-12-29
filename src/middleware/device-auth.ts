import type { Response, NextFunction } from "express";
import { DeviceService } from "../services/device.service.js";
import { AppError } from "../utils/errors.js";
import type { AuthenticatedDeviceRequest } from "../types/index.js";

export async function authenticateDevice(
  req: AuthenticatedDeviceRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("No device token provided");
    }

    const token = authHeader.substring(7);
    const device = await DeviceService.verifyDeviceToken(token);

    req.device = {
      deviceId: device.deviceId,
      name: device.name,
      type: device.type,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function extractDeviceToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
