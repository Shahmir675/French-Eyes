import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createStripeIntentSchema,
  confirmStripePaymentSchema,
  createPayPalOrderSchema,
  capturePayPalPaymentSchema,
} from "../validators/payment.validator.js";

const router = Router();

router.post(
  "/stripe/intent",
  authenticate,
  validate(createStripeIntentSchema),
  PaymentController.createStripeIntent
);

router.post(
  "/stripe/confirm",
  authenticate,
  validate(confirmStripePaymentSchema),
  PaymentController.confirmStripePayment
);

router.post(
  "/paypal/create",
  authenticate,
  validate(createPayPalOrderSchema),
  PaymentController.createPayPalOrder
);

router.post(
  "/paypal/capture",
  authenticate,
  validate(capturePayPalPaymentSchema),
  PaymentController.capturePayPalPayment
);

router.post("/paypal/webhook", PaymentController.handlePayPalWebhook);

export default router;
