import { Request, Response, NextFunction } from "express";
import { ZoneService } from "../services/zone.service.js";
import { sendSuccess } from "../utils/response.js";
import type {
  ValidateAddressInput,
  CheckDeliverableQuery,
  GetSlotsQuery,
} from "../validators/zone.validator.js";

export class ZoneController {
  static async validateAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = req.body as ValidateAddressInput;
      const result = await ZoneService.validateAddress(input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getZoneFees(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const zoneId = req.params["id"] as string;
      const result = await ZoneService.getZoneFees(zoneId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getSlots(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as GetSlotsQuery;
      const result = await ZoneService.getSlots(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async checkDeliverable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as CheckDeliverableQuery;
      const result = await ZoneService.checkDeliverable(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getAllZones(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await ZoneService.getAllActiveZones();
      sendSuccess(res, { zones: result });
    } catch (error) {
      next(error);
    }
  }
}
