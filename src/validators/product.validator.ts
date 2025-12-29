import { z } from "zod";

export const categoryIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID"),
});

export const productIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
});

export const productQuerySchema = z.object({
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID").optional(),
  search: z.string().trim().optional(),
  available: z
    .enum(["true", "false"], { message: "Available must be 'true' or 'false'" })
    .transform((val) => val === "true")
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Page must be positive")
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .optional()
    .default("20"),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").trim(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Page must be positive")
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .optional()
    .default("20"),
});

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Page must be positive")
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .optional()
    .default("20"),
});

export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
