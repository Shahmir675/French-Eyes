import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  phoneNumber: z.string().min(6, "Phone number must be at least 6 characters").trim().optional(),
  profilePicture: z.string().url("Invalid URL format").optional(),
  notificationsEnabled: z.boolean().optional(),
  language: z.enum(["de", "en", "fr"]).optional(),
});

export const createAddressSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  street: z.string().min(1, "Street is required").trim(),
  state: z.string().min(1, "State is required").trim(),
  zipCode: z.string().min(1, "Zip code is required").trim(),
  completeAddress: z.string().min(1, "Complete address is required").trim(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = z.object({
  title: z.string().min(1, "Title is required").trim().optional(),
  street: z.string().min(1, "Street is required").trim().optional(),
  state: z.string().min(1, "State is required").trim().optional(),
  zipCode: z.string().min(1, "Zip code is required").trim().optional(),
  completeAddress: z.string().min(1, "Complete address is required").trim().optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const addressIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid address ID"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdParam = z.infer<typeof addressIdParamSchema>;
