import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const selectedOptionSchema = z.object({
  name: z.string().min(1, "Option name is required").trim(),
  choice: z.string().min(1, "Option choice is required").trim(),
});

const selectedExtraSchema = z.object({
  name: z.string().min(1, "Extra name is required").trim(),
});

export const addCartItemSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  selectedOptions: z.array(selectedOptionSchema).optional().default([]),
  selectedExtras: z.array(selectedExtraSchema).optional().default([]),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
  selectedOptions: z.array(selectedOptionSchema).optional(),
  selectedExtras: z.array(selectedExtraSchema).optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const cartItemIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid cart item ID"),
});

export const applyPromoSchema = z.object({
  code: z.string().min(1, "Promo code is required").trim().toUpperCase(),
});

export const calculateCartSchema = z.object({
  tip: z.number().min(0, "Tip cannot be negative").optional().default(0),
  addressId: z.string().regex(objectIdRegex, "Invalid address ID").optional(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;
export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;
export type CalculateCartInput = z.infer<typeof calculateCartSchema>;
