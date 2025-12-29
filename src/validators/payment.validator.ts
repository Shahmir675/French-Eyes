import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createStripeIntentSchema = z.object({
  orderId: z.string().regex(objectIdRegex, "Invalid order ID format"),
  currency: z.string().length(3).toUpperCase().default("EUR"),
});

export const confirmStripePaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});

export const createPayPalOrderSchema = z.object({
  orderId: z.string().regex(objectIdRegex, "Invalid order ID format"),
  currency: z.string().length(3).toUpperCase().default("EUR"),
});

export const capturePayPalPaymentSchema = z.object({
  paypalOrderId: z.string().min(1, "PayPal order ID is required"),
});

export type CreateStripeIntentInput = z.infer<typeof createStripeIntentSchema>;
export type ConfirmStripePaymentInput = z.infer<typeof confirmStripePaymentSchema>;
export type CreatePayPalOrderInput = z.infer<typeof createPayPalOrderSchema>;
export type CapturePayPalPaymentInput = z.infer<typeof capturePayPalPaymentSchema>;
