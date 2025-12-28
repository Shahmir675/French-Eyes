import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  phone: z
    .string()
    .min(6, "Phone number must be at least 6 characters")
    .trim(),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the privacy policy" }),
  }),
  language: z.enum(["de", "en", "fr"]).optional().default("de"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const socialAuthSchema = z.object({
  provider: z.enum(["google", "facebook"]),
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  phone: z.string().min(6, "Phone number must be at least 6 characters").trim().optional(),
  gdprConsent: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SocialAuthInput = z.infer<typeof socialAuthSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
