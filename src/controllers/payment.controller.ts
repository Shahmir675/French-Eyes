import { Response, NextFunction, Request } from "express";
import { PaymentService } from "../services/payment.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  CreateStripeIntentInput,
  ConfirmStripePaymentInput,
  CreatePayPalOrderInput,
  CapturePayPalPaymentInput,
} from "../validators/payment.validator.js";

export class PaymentController {
  static async createStripeIntent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as CreateStripeIntentInput;
      const result = await PaymentService.createStripeIntent(userId, input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async confirmStripePayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as ConfirmStripePaymentInput;
      const result = await PaymentService.confirmStripePayment(userId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async handleStripeWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        res.status(400).json({ error: "Missing stripe-signature header" });
        return;
      }
      const result = await PaymentService.handleStripeWebhook(req.body, signature);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createPayPalOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as CreatePayPalOrderInput;
      const result = await PaymentService.createPayPalOrder(userId, input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async capturePayPalPayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as CapturePayPalPaymentInput;
      const result = await PaymentService.capturePayPalPayment(userId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async handlePayPalWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") {
          headers[key.toLowerCase()] = value;
        }
      }
      const payload = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const result = await PaymentService.handlePayPalWebhook(payload, headers);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
