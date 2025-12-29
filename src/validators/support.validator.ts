import { z } from "zod";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be at most 200 characters")
    .trim(),
  category: z.enum(["order", "delivery", "payment", "other"], {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  orderId: z
    .string()
    .regex(objectIdRegex, "Invalid order ID format")
    .optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be at most 5000 characters")
    .trim(),
});

export const addMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be at most 5000 characters")
    .trim(),
});

export const ticketIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid ticket ID format"),
});

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
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
