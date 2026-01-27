import { z } from "zod";

export const getRestaurantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  search: z.string().trim().optional(),
  cuisineType: z.string().trim().optional(),
  isOpen: z.coerce.boolean().optional(),
  sortBy: z.enum(["rating", "deliveryTime", "deliveryFee"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const getNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(50).optional().default(10),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export const restaurantIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid restaurant ID"),
});

export const searchRestaurantsQuerySchema = z.object({
  query: z.string().trim().min(1, "Search query is required"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export type GetRestaurantsQuery = z.infer<typeof getRestaurantsQuerySchema>;
export type GetNearbyQuery = z.infer<typeof getNearbyQuerySchema>;
export type RestaurantIdParam = z.infer<typeof restaurantIdParamSchema>;
export type SearchRestaurantsQuery = z.infer<typeof searchRestaurantsQuerySchema>;
