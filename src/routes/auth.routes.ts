import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authRateLimiter } from "../middleware/rate-limit.js";
import { authenticate } from "../middleware/auth.js";
import {
  registerSchema,
  loginSchema,
  socialAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verifyOtpSchema,
  completeProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validator.js";
import { resendOtpSchema } from "../validators/otp.validator.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post(
  "/social",
  authRateLimiter,
  validate(socialAuthSchema),
  AuthController.socialAuth
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  AuthController.refresh
);

router.post(
  "/logout",
  validate(refreshTokenSchema),
  AuthController.logout
);

// OTP routes
router.post(
  "/otp/verify",
  authRateLimiter,
  validate(verifyOtpSchema),
  AuthController.verifyOtp
);

router.post(
  "/otp/resend",
  authRateLimiter,
  validate(resendOtpSchema),
  AuthController.resendOtp
);

// Protected routes
router.post(
  "/complete-profile",
  authenticate,
  validate(completeProfileSchema),
  AuthController.completeProfile
);

router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

export default router;
