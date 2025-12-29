import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createOrderSchema = z
  .object({
    type: z.enum(["delivery", "pickup"]),
    addressId: z
      .string()
      .regex(objectIdRegex, "Invalid address ID")
      .optional(),
    pickupTime: z
      .string()
      .datetime({ message: "Invalid pickup time format" })
      .optional(),
    paymentMethod: z.enum(["cash", "stripe", "paypal"]),
    paymentIntentId: z.string().min(1).optional(),
    tip: z.number().min(0, "Tip cannot be negative").default(0),
    notes: z
      .string()
      .trim()
      .max(500, "Notes cannot exceed 500 characters")
      .optional(),
    selectedBonusId: z
      .string()
      .regex(objectIdRegex, "Invalid bonus ID")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === "delivery" && !data.addressId) {
        return false;
      }
      return true;
    },
    {
      message: "Address is required for delivery orders",
      path: ["addressId"],
    }
  )
  .refine(
    (data) => {
      if (
        (data.paymentMethod === "stripe" || data.paymentMethod === "paypal") &&
        !data.paymentIntentId
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Payment intent ID is required for online payments",
      path: ["paymentIntentId"],
    }
  );

export const orderIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid order ID"),
});

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "picked_up",
      "out_for_delivery",
      "delivered",
      "completed",
      "cancelled",
    ])
    .optional(),
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Reason cannot exceed 500 characters")
    .optional(),
});

export const reviewOrderSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ReviewOrderInput = z.infer<typeof reviewOrderSchema>;
