import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  type: z.enum(["registration", "password_reset"]).optional().default("registration"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  code: z
    .string()
    .length(5, "OTP must be 5 digits")
    .regex(/^\d{5}$/, "OTP must contain only digits"),
});

export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
