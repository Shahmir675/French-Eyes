import { Request, Response, NextFunction } from "express";
import { PromoCodeService } from "../services/promoCode.service.js";
import { sendSuccess } from "../utils/response.js";
import type { ValidatePromoInput } from "../validators/promoCode.validator.js";

export class PromoCodeController {
  static async validate(
    req: Request<unknown, unknown, ValidatePromoInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, cartTotal, restaurantId } = req.body;
      const result = await PromoCodeService.validate(code, cartTotal, restaurantId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
