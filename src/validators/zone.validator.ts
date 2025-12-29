import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const coordinatesSchema = z.object({
  lat: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

export const validateAddressSchema = z
  .object({
    address: z.string().trim().min(1, "Address is required").optional(),
    zipCode: z
      .string()
      .trim()
      .min(1, "ZIP code is required")
      .max(20, "ZIP code is too long")
      .optional(),
    coordinates: coordinatesSchema.optional(),
  })
  .refine(
    (data) => data.address || data.zipCode || data.coordinates,
    {
      message: "At least one of address, zipCode, or coordinates must be provided",
    }
  );

export const zoneIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid zone ID"),
});

export const checkDeliverableSchema = z
  .object({
    zipCode: z
      .string()
      .trim()
      .min(1, "ZIP code is required")
      .max(20, "ZIP code is too long")
      .optional(),
    address: z.string().trim().min(1, "Address is required").optional(),
    lat: z
      .coerce
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .optional(),
    lng: z
      .coerce
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .optional(),
  })
  .refine(
    (data) => data.zipCode || data.address || (data.lat !== undefined && data.lng !== undefined),
    {
      message: "At least one of zipCode, address, or coordinates (lat & lng) must be provided",
    }
  );

export const getSlotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  type: z.enum(["delivery", "pickup"]).optional(),
  zoneId: z.string().regex(objectIdRegex, "Invalid zone ID").optional(),
});

export type ValidateAddressInput = z.infer<typeof validateAddressSchema>;
export type CheckDeliverableQuery = z.infer<typeof checkDeliverableSchema>;
export type GetSlotsQuery = z.infer<typeof getSlotsQuerySchema>;
