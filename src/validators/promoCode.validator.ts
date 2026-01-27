import { z } from "zod";

export const applyPromoSchema = z.object({
  code: z.string().trim().min(1, "Promo code is required").toUpperCase(),
});

export const validatePromoSchema = z.object({
  code: z.string().trim().min(1, "Promo code is required").toUpperCase(),
  cartTotal: z.number().positive("Cart total must be positive"),
  restaurantId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid restaurant ID").optional(),
});

export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;
export type ValidatePromoInput = z.infer<typeof validatePromoSchema>;
