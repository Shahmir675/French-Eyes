import { nanoid } from "nanoid";
import { User } from "../models/user.model.js";
import { TokenService } from "./token.service.js";
import { EmailService } from "./email.service.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { AppError } from "../utils/errors.js";
import { verifyFirebaseIdToken } from "./firebase-auth.service.js";
import type {
  RegisterInput,
  LoginInput,
  SocialAuthInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../validators/auth.validator.js";

export class AuthService {
  static async register(
    input: RegisterInput,
    userAgent?: string
  ): Promise<{
    user: { id: string; email: string; name: string };
    accessToken: string;
    refreshToken: string;
  }> {
    const existingUser = await User.findOne({ email: input.email });

    if (existingUser) {
      throw AppError.userExists();
    }

    const passwordHash = await hashPassword(input.password);

    const user = await User.create({
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      authProvider: "email",
      gdprConsent: input.gdprConsent,
      language: input.language,
    });

    const accessToken = TokenService.generateAccessToken(
      user._id.toString(),
      user.email
    );
    const refreshToken = await TokenService.generateRefreshToken(
      user._id.toString(),
      user.email,
      userAgent
    );

    await EmailService.sendWelcomeEmail(user.email, user.name);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(
    input: LoginInput,
    userAgent?: string
  ): Promise<{
    user: { id: string; email: string; name: string };
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await User.findOne({ email: input.email });

    if (!user) {
      throw AppError.invalidCredentials();
    }

    if (user.status === "inactive") {
      throw AppError.userInactive();
    }

    if (user.authProvider !== "email" || !user.passwordHash) {
      throw AppError.invalidCredentials();
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);

    if (!isValid) {
      throw AppError.invalidCredentials();
    }

    const accessToken = TokenService.generateAccessToken(
      user._id.toString(),
      user.email
    );
    const refreshToken = await TokenService.generateRefreshToken(
      user._id.toString(),
      user.email,
      userAgent
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  static async socialAuth(
    input: SocialAuthInput,
    userAgent?: string
  ): Promise<{
    user: { id: string; email: string; name: string };
    accessToken: string;
    refreshToken: string;
  }> {
    const firebaseUser = await verifyFirebaseIdToken(input.token);

    if (!firebaseUser.email) {
      throw AppError.socialAuthFailed("Email is required for authentication");
    }

    if (firebaseUser.provider !== input.provider) {
      throw AppError.socialAuthFailed(
        `Token provider mismatch. Expected ${input.provider}, got ${firebaseUser.provider}`
      );
    }

    let user = await User.findOne({
      $or: [
        { email: firebaseUser.email },
        { authProvider: input.provider, providerId: firebaseUser.uid },
      ],
    });

    if (user) {
      if (user.status === "inactive") {
        throw AppError.userInactive();
      }

      if (user.authProvider === "email") {
        throw AppError.socialAuthFailed(
          "This email is registered with password. Please use email login."
        );
      }

      if (user.authProvider !== input.provider) {
        throw AppError.socialAuthFailed(
          `This email is linked to ${user.authProvider}. Please use ${user.authProvider} to sign in.`
        );
      }
    } else {
      if (!input.phone || !input.gdprConsent) {
        throw AppError.validation("Phone and GDPR consent are required for new users");
      }

      user = await User.create({
        email: firebaseUser.email,
        name: input.name || firebaseUser.name || "User",
        phone: input.phone,
        authProvider: input.provider,
        providerId: firebaseUser.uid,
        gdprConsent: input.gdprConsent,
        language: "de",
      });

      await EmailService.sendWelcomeEmail(user.email, user.name);
    }

    const accessToken = TokenService.generateAccessToken(
      user._id.toString(),
      user.email
    );
    const refreshToken = await TokenService.generateRefreshToken(
      user._id.toString(),
      user.email,
      userAgent
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    };
  }

  static async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await User.findOne({ email: input.email });

    if (!user) {
      return;
    }

    if (user.authProvider !== "email") {
      return;
    }

    const resetToken = nanoid(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      }
    );

    await EmailService.sendPasswordResetEmail(user.email, resetToken);
  }

  static async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await User.findOne({
      passwordResetToken: input.token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw AppError.invalidResetToken();
    }

    const passwordHash = await hashPassword(input.newPassword);

    await User.updateOne(
      { _id: user._id },
      {
        passwordHash,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      }
    );

    await TokenService.invalidateAllUserSessions(user._id.toString());
  }

  static async refreshTokens(
    refreshToken: string,
    userAgent?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const result = await TokenService.rotateRefreshToken(
      refreshToken,
      userAgent
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  static async logout(refreshToken: string): Promise<void> {
    await TokenService.invalidateRefreshToken(refreshToken);
  }
}
