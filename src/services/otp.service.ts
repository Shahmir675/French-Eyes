import { Otp } from "../models/otp.model.js";
import { User } from "../models/user.model.js";
import { EmailService } from "./email.service.js";
import { AppError } from "../utils/errors.js";
import type { OtpType } from "../types/index.js";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export class OtpService {
  static generateOtpCode(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  static async generate(
    email: string,
    type: OtpType,
    userId?: string
  ): Promise<{ message: string; expiresAt: Date }> {
    const existingOtp = await Otp.findOne({
      email,
      type,
      verified: false,
      createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) },
    });

    if (existingOtp) {
      throw AppError.validation(
        `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP`
      );
    }

    await Otp.deleteMany({ email, type });

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({
      userId,
      email,
      code,
      type,
      expiresAt,
      verified: false,
      attempts: 0,
    });

    await EmailService.sendOtpEmail(email, code);

    return {
      message: "OTP sent to your email",
      expiresAt,
    };
  }

  static async verify(
    email: string,
    code: string
  ): Promise<{ verified: boolean; userId?: string }> {
    const otp = await Otp.findOne({
      email,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      throw AppError.validation("OTP expired or not found");
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: otp._id });
      throw AppError.validation("Maximum attempts exceeded. Please request a new OTP");
    }

    if (otp.code !== code) {
      await Otp.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
      throw AppError.validation("Invalid OTP code");
    }

    await Otp.updateOne({ _id: otp._id }, { verified: true });

    if (otp.type === "registration") {
      await User.updateOne({ email }, { emailVerified: true });
    }

    const result: { verified: boolean; userId?: string } = { verified: true };
    if (otp.userId) {
      result.userId = otp.userId.toString();
    }
    return result;
  }

  static async resend(email: string): Promise<{ message: string; expiresAt: Date }> {
    const existingOtp = await Otp.findOne({
      email,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!existingOtp) {
      throw AppError.validation("No pending OTP verification found");
    }

    const timeSinceLastOtp = Date.now() - existingOtp.createdAt.getTime();
    if (timeSinceLastOtp < RESEND_COOLDOWN_SECONDS * 1000) {
      const remainingSeconds = Math.ceil(
        (RESEND_COOLDOWN_SECONDS * 1000 - timeSinceLastOtp) / 1000
      );
      throw AppError.validation(
        `Please wait ${remainingSeconds} seconds before requesting a new OTP`
      );
    }

    return this.generate(email, existingOtp.type, existingOtp.userId?.toString());
  }
}
