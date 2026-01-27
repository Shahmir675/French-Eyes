import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().trim().min(10, "Comment must be at least 10 characters").max(500, "Comment cannot exceed 500 characters"),
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID").optional(),
});

export const getReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  sortBy: z.enum(["createdAt", "rating"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const reviewRestaurantParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid restaurant ID"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;
export type ReviewRestaurantParam = z.infer<typeof reviewRestaurantParamSchema>;
