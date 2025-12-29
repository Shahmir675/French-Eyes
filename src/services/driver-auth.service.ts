import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { Driver } from "../models/driver.model.js";
import { DriverSession } from "../models/driverSession.model.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { AppError } from "../utils/errors.js";
import { EmailService } from "./email.service.js";
import type { DriverTokenPayload } from "../types/index.js";
import type {
  DriverLoginInput,
  DriverForgotPasswordInput,
} from "../validators/driver.validator.js";

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

export class DriverAuthService {
  static generateAccessToken(driverId: string, email: string): string {
    const payload: DriverTokenPayload = {
      driverId,
      email,
      type: "access",
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  static async generateRefreshToken(
    driverId: string,
    email: string,
    userAgent?: string
  ): Promise<string> {
    const refreshToken = nanoid(64);
    const expiresAt = new Date(
      Date.now() + parseExpiry(config.jwt.refreshExpiresIn)
    );

    await DriverSession.create({
      driverId,
      refreshToken,
      expiresAt,
      userAgent,
    });

    return refreshToken;
  }

  static async verifyAccessToken(token: string): Promise<DriverTokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as DriverTokenPayload;

      if (payload.type !== "access" || !payload.driverId) {
        throw AppError.tokenInvalid();
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.tokenExpired();
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.tokenInvalid();
      }
      throw error;
    }
  }

  static async login(
    input: DriverLoginInput,
    userAgent?: string
  ): Promise<{
    driver: { id: string; email: string; name: string };
    accessToken: string;
    refreshToken: string;
  }> {
    const driver = await Driver.findOne({ email: input.email });

    if (!driver) {
      throw AppError.invalidCredentials();
    }

    if (driver.status === "inactive") {
      throw AppError.driverInactive();
    }

    const isValid = await verifyPassword(driver.passwordHash, input.password);

    if (!isValid) {
      throw AppError.invalidCredentials();
    }

    const accessToken = this.generateAccessToken(
      driver._id.toString(),
      driver.email
    );
    const refreshToken = await this.generateRefreshToken(
      driver._id.toString(),
      driver.email,
      userAgent
    );

    return {
      driver: {
        id: driver._id.toString(),
        email: driver.email,
        name: driver.name,
      },
      accessToken,
      refreshToken,
    };
  }

  static async forgotPassword(input: DriverForgotPasswordInput): Promise<void> {
    const driver = await Driver.findOne({ email: input.email });

    if (!driver) {
      return;
    }

    const resetToken = nanoid(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await Driver.updateOne(
      { _id: driver._id },
      {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      }
    );

    await EmailService.sendPasswordResetEmail(driver.email, resetToken);
  }

  static async logout(refreshToken: string): Promise<void> {
    await DriverSession.deleteOne({ refreshToken });
  }

  static async refreshTokens(
    refreshToken: string,
    userAgent?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const session = await DriverSession.findOne({ refreshToken });

    if (!session) {
      throw AppError.tokenInvalid();
    }

    if (session.expiresAt < new Date()) {
      await DriverSession.deleteOne({ _id: session._id });
      throw AppError.tokenExpired();
    }

    await DriverSession.deleteOne({ _id: session._id });

    const driver = await Driver.findById(session.driverId);

    if (!driver) {
      throw AppError.driverNotFound();
    }

    const accessToken = this.generateAccessToken(
      driver._id.toString(),
      driver.email
    );
    const newRefreshToken = await this.generateRefreshToken(
      driver._id.toString(),
      driver.email,
      userAgent
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async invalidateAllDriverSessions(driverId: string): Promise<void> {
    await DriverSession.deleteMany({ driverId });
  }
}
