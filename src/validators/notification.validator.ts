import { z } from "zod";

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  read: z.coerce.boolean().optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID"),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
