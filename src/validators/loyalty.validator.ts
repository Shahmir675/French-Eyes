import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100).default(20)),
});

export const redeemRewardSchema = z.object({
  rewardId: z.string().regex(objectIdRegex, "Invalid reward ID format"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
