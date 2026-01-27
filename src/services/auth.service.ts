import { nanoid } from "nanoid";
import { User } from "../models/user.model.js";
import { TokenService } from "./token.service.js";
import { EmailService } from "./email.service.js";
import { OtpService } from "./otp.service.js";
import { NotificationDbService } from "./notification-db.service.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { AppError } from "../utils/errors.js";
import { verifyFirebaseIdToken } from "./firebase-auth.service.js";
import type {
  RegisterInput,
  LoginInput,
  SocialAuthInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyOtpInput,
  CompleteProfileInput,
  ChangePasswordInput,
} from "../validators/auth.validator.js";

export class AuthService {
  static async register(input: RegisterInput): Promise<{
    userId: string;
    message: string;
    expiresAt: Date;
  }> {
    const existingUser = await User.findOne({ email: input.email });

    if (existingUser) {
      if (existingUser.emailVerified) {
        throw AppError.userExists();
      }
      await User.deleteOne({ _id: existingUser._id });
    }

    const passwordHash = await hashPassword(input.password);

    const user = await User.create({
      email: input.email,
      passwordHash,
      fullName: "User",
      phoneNumber: input.phoneNumber,
      authProvider: "email",
      gdprConsent: input.agreeToPrivacyPolicy,
      emailVerified: false,
      notificationsEnabled: true,
    });

    const otpResult = await OtpService.generate(
      input.email,
      "registration",
      user._id.toString()
    );

    return {
      userId: user._id.toString(),
      message: otpResult.message,
      expiresAt: otpResult.expiresAt,
    };
  }

  static async verifyOtp(
    input: VerifyOtpInput,
    userAgent?: string
  ): Promise<{
    user: { id: string; email: string; fullName: string };
    accessToken: string;
    refreshToken: string;
    profileComplete: boolean;
  }> {
    await OtpService.verify(input.email, input.code);

    const user = await User.findOne({ email: input.email });

    if (!user) {
      throw AppError.notFound("User not found");
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

    await NotificationDbService.createAccountNotification(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
      profileComplete: user.fullName !== "User",
    };
  }

  static async completeProfile(
    userId: string,
    input: CompleteProfileInput
  ): Promise<{
    user: { id: string; email: string; fullName: string; profilePicture?: string };
  }> {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        fullName: input.fullName,
        ...(input.profilePicture && { profilePicture: input.profilePicture }),
      },
      { new: true }
    );

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const userResponse: { id: string; email: string; fullName: string; profilePicture?: string } = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };

    if (user.profilePicture) {
      userResponse.profilePicture = user.profilePicture;
    }

    return { user: userResponse };
  }

  static async login(
    input: LoginInput,
    userAgent?: string
  ): Promise<{
    user: { id: string; email: string; fullName: string };
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

    if (!user.emailVerified) {
      throw AppError.validation("Please verify your email first");
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
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
    };
  }

  static async socialAuth(
    input: SocialAuthInput,
    userAgent?: string
  ): Promise<{
    user: { id: string; email: string; fullName: string };
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
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

    let isNewUser = false;

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
      if (!input.phoneNumber) {
        throw AppError.validation("Phone number is required for new users");
      }

      isNewUser = true;
      user = await User.create({
        email: firebaseUser.email,
        fullName: input.fullName || firebaseUser.name || "User",
        phoneNumber: input.phoneNumber,
        authProvider: input.provider,
        providerId: firebaseUser.uid,
        gdprConsent: true,
        emailVerified: true,
        notificationsEnabled: true,
      });

      await NotificationDbService.createAccountNotification(user._id.toString());
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
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  static async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<{ message: string }> {
    const user = await User.findById(userId);

    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (user.authProvider !== "email" || !user.passwordHash) {
      throw AppError.validation("Password change is not available for social login accounts");
    }

    const isValid = await verifyPassword(user.passwordHash, input.currentPassword);

    if (!isValid) {
      throw AppError.validation("Current password is incorrect");
    }

    const passwordHash = await hashPassword(input.newPassword);

    await User.updateOne({ _id: userId }, { passwordHash });

    await TokenService.invalidateAllUserSessions(userId);

    return { message: "Password changed successfully" };
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

  static async resendOtp(email: string): Promise<{ message: string; expiresAt: Date }> {
    return OtpService.resend(email);
  }
}
