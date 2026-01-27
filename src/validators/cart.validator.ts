import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const selectedAddOnSchema = z.object({
  name: z.string().min(1, "Add-on name is required").trim(),
});

export const addCartItemSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid product ID"),
  restaurantId: z.string().regex(objectIdRegex, "Invalid restaurant ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  selectedAddOns: z.array(selectedAddOnSchema).optional().default([]),
  specialInstructions: z.string().trim().max(500, "Instructions cannot exceed 500 characters").optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
  selectedAddOns: z.array(selectedAddOnSchema).optional(),
  specialInstructions: z.string().trim().max(500, "Instructions cannot exceed 500 characters").optional(),
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
