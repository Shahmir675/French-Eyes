import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { Session } from "../models/session.model.js";
import { AppError } from "../utils/errors.js";
import type { TokenPayload } from "../types/index.js";

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

export class TokenService {
  static generateAccessToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: "access",
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  static async generateRefreshToken(
    userId: string,
    email: string,
    userAgent?: string
  ): Promise<string> {
    const refreshToken = nanoid(64);
    const expiresAt = new Date(
      Date.now() + parseExpiry(config.jwt.refreshExpiresIn)
    );

    await Session.create({
      userId,
      refreshToken,
      expiresAt,
      userAgent,
    });

    return refreshToken;
  }

  static async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

      if (payload.type !== "access") {
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

  static async verifyRefreshToken(refreshToken: string): Promise<{
    userId: string;
    session: typeof Session.prototype;
  }> {
    const session = await Session.findOne({ refreshToken });

    if (!session) {
      throw AppError.tokenInvalid();
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      throw AppError.tokenExpired();
    }

    return {
      userId: session.userId.toString(),
      session,
    };
  }

  static async invalidateRefreshToken(refreshToken: string): Promise<void> {
    await Session.deleteOne({ refreshToken });
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    await Session.deleteMany({ userId });
  }

  static async rotateRefreshToken(
    oldRefreshToken: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const { userId, session } =
      await TokenService.verifyRefreshToken(oldRefreshToken);

    await Session.deleteOne({ _id: session._id });

    const user = await import("../models/user.model.js").then(
      (m) => m.User.findById(userId)
    );

    if (!user) {
      throw AppError.userNotFound();
    }

    const accessToken = TokenService.generateAccessToken(
      userId,
      user.email
    );
    const refreshToken = await TokenService.generateRefreshToken(
      userId,
      user.email,
      userAgent
    );

    return { accessToken, refreshToken, userId };
  }
}
