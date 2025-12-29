import { z } from "zod";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const driverLoginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const driverForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().min(5).max(20).trim().optional(),
});

export const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["picked_up", "out_for_delivery", "delivered"], {
    errorMap: () => ({ message: "Invalid status for driver update" }),
  }),
  notes: z.string().max(500).trim().optional(),
});

export const orderIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid order ID format"),
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
});

export const tipsQuerySchema = z.object({
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
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3).max(200).trim(),
  orderId: z.string().regex(objectIdRegex, "Invalid order ID format").optional(),
  message: z.string().min(10).max(5000).trim(),
});

export type DriverLoginInput = z.infer<typeof driverLoginSchema>;
export type DriverForgotPasswordInput = z.infer<typeof driverForgotPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type TipsQuery = z.infer<typeof tipsQuerySchema>;
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
