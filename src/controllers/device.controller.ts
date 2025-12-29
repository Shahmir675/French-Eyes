import type { Response, NextFunction } from "express";
import { DeviceService } from "../services/device.service.js";
import { wsManager } from "../services/websocket.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedAdminRequest } from "../types/index.js";
import type {
  RegisterDeviceInput,
  UpdateDeviceSettingsInput,
} from "../validators/device.validator.js";

export class DeviceController {
  static async register(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = req.body as RegisterDeviceInput;
      const device = await DeviceService.registerDevice(
        req.admin!.adminId,
        input
      );
      sendSuccess(res, device, 201);
    } catch (error) {
      next(error);
    }
  }

  static async list(
    _req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const devices = await DeviceService.listDevices();
      sendSuccess(res, devices);
    } catch (error) {
      next(error);
    }
  }

  static async getById(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deviceId = req.params["id"] as string;
      const device = await DeviceService.getDeviceById(deviceId);
      sendSuccess(res, device);
    } catch (error) {
      next(error);
    }
  }

  static async unregister(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deviceId = req.params["id"] as string;
      await DeviceService.unregisterDevice(deviceId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deviceId = req.params["id"] as string;
      const input = req.body as UpdateDeviceSettingsInput;
      const device = await DeviceService.updateDeviceSettings(deviceId, input);
      sendSuccess(res, device);
    } catch (error) {
      next(error);
    }
  }

  static async sendTestPrint(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deviceId = req.params["id"] as string;
      const result = await DeviceService.sendTestPrint(deviceId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async regenerateToken(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deviceId = req.params["id"] as string;
      const result = await DeviceService.regenerateToken(deviceId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deviceId = req.params["id"] as string;
      const { status } = req.body as { status: "active" | "inactive" | "offline" };
      const device = await DeviceService.updateDeviceStatus(deviceId, status);
      sendSuccess(res, device);
    } catch (error) {
      next(error);
    }
  }

  static async getConnectedDevices(
    _req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const connectedDevices = wsManager.getConnectedDevices();
      sendSuccess(res, { devices: connectedDevices, count: connectedDevices.length });
    } catch (error) {
      next(error);
    }
  }

  static async broadcastOrder(
    req: AuthenticatedAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const orderId = req.params["orderId"] as string;
      const payload = await DeviceService.formatOrderForPrint(orderId);
      wsManager.broadcastToAllDevices(payload);
      sendSuccess(res, { success: true, broadcastedTo: wsManager.getConnectedDevices().length });
    } catch (error) {
      next(error);
    }
  }
}
