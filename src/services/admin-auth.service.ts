import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { Admin } from "../models/admin.model.js";
import { AdminSession } from "../models/adminSession.model.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { AppError } from "../utils/errors.js";
import type { AdminTokenPayload, AdminRole } from "../types/index.js";

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

export class AdminAuthService {
  static generateAccessToken(adminId: string, email: string, role: AdminRole): string {
    const payload: AdminTokenPayload = {
      adminId,
      email,
      role,
      type: "access",
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  static async generateRefreshToken(
    adminId: string,
    userAgent?: string
  ): Promise<string> {
    const refreshToken = nanoid(64);
    const expiresAt = new Date(
      Date.now() + parseExpiry(config.jwt.refreshExpiresIn)
    );

    await AdminSession.create({
      adminId,
      refreshToken,
      expiresAt,
      userAgent,
    });

    return refreshToken;
  }

  static async verifyAccessToken(token: string): Promise<AdminTokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as AdminTokenPayload;

      if (payload.type !== "access" || !payload.adminId) {
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
    email: string,
    password: string,
    userAgent?: string
  ): Promise<{
    admin: { id: string; email: string; name: string; role: AdminRole };
    accessToken: string;
    refreshToken: string;
  }> {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      throw AppError.invalidCredentials();
    }

    if (admin.status === "inactive") {
      throw AppError.adminInactive();
    }

    const isValid = await verifyPassword(admin.passwordHash, password);

    if (!isValid) {
      throw AppError.invalidCredentials();
    }

    await Admin.updateOne({ _id: admin._id }, { lastLoginAt: new Date() });

    const accessToken = this.generateAccessToken(
      admin._id.toString(),
      admin.email,
      admin.role
    );
    const refreshToken = await this.generateRefreshToken(
      admin._id.toString(),
      userAgent
    );

    return {
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async logout(refreshToken: string): Promise<void> {
    await AdminSession.deleteOne({ refreshToken });
  }

  static async refreshTokens(
    refreshToken: string,
    userAgent?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const session = await AdminSession.findOne({ refreshToken });

    if (!session) {
      throw AppError.tokenInvalid();
    }

    if (session.expiresAt < new Date()) {
      await AdminSession.deleteOne({ _id: session._id });
      throw AppError.tokenExpired();
    }

    await AdminSession.deleteOne({ _id: session._id });

    const admin = await Admin.findById(session.adminId);

    if (!admin) {
      throw AppError.adminNotFound();
    }

    if (admin.status === "inactive") {
      throw AppError.adminInactive();
    }

    const accessToken = this.generateAccessToken(
      admin._id.toString(),
      admin.email,
      admin.role
    );
    const newRefreshToken = await this.generateRefreshToken(
      admin._id.toString(),
      userAgent
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async getMe(adminId: string) {
    const admin = await Admin.findById(adminId).select("-passwordHash -passwordResetToken -passwordResetExpires");

    if (!admin) {
      throw AppError.adminNotFound();
    }

    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
      permissions: admin.permissions,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    };
  }

  static async createAdmin(
    email: string,
    password: string,
    name: string,
    role: AdminRole = "admin",
    permissions: string[] = []
  ) {
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      throw AppError.adminExists();
    }

    const passwordHash = await hashPassword(password);

    const admin = await Admin.create({
      email,
      passwordHash,
      name,
      role,
      permissions,
    });

    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  }

  static async invalidateAllAdminSessions(adminId: string): Promise<void> {
    await AdminSession.deleteMany({ adminId });
  }
}
