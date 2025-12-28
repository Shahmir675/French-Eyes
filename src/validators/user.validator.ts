import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  phone: z.string().min(6, "Phone number must be at least 6 characters").trim().optional(),
  language: z.enum(["de", "en", "fr"]).optional(),
});

export const createAddressSchema = z.object({
  label: z.string().min(1, "Label is required").trim(),
  street: z.string().min(1, "Street is required").trim(),
  city: z.string().min(1, "City is required").trim(),
  zipCode: z.string().min(1, "Zip code is required").trim(),
  country: z.string().trim().optional().default("DE"),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  isDefault: z.boolean().optional().default(false),
  deliveryInstructions: z.string().trim().optional(),
});

export const updateAddressSchema = z.object({
  label: z.string().min(1, "Label is required").trim().optional(),
  street: z.string().min(1, "Street is required").trim().optional(),
  city: z.string().min(1, "City is required").trim().optional(),
  zipCode: z.string().min(1, "Zip code is required").trim().optional(),
  country: z.string().trim().optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  deliveryInstructions: z.string().trim().optional(),
});

export const addressIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid address ID"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdParam = z.infer<typeof addressIdParamSchema>;
