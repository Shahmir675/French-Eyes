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
  phoneNumber: z
    .string()
    .min(6, "Phone number must be at least 6 characters")
    .trim(),
  agreeToPrivacyPolicy: z.literal(true, {
    errorMap: () => ({ message: "You must accept the privacy policy" }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const socialAuthSchema = z.object({
  provider: z.enum(["google", "apple"]),
  token: z.string().min(1, "Token is required"),
  fullName: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  phoneNumber: z.string().min(6, "Phone number must be at least 6 characters").trim().optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  code: z
    .string()
    .length(5, "OTP must be 5 digits")
    .regex(/^\d{5}$/, "OTP must contain only digits"),
});

export const completeProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").trim(),
  profilePicture: z.string().url("Invalid URL format").optional(),
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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SocialAuthInput = z.infer<typeof socialAuthSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
