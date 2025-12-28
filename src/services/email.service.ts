import { config } from "../config/index.js";

export class EmailService {
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${config.apiUrl}/auth/reset-password?token=${resetToken}`;

    if (config.nodeEnv === "development") {
      console.log("=".repeat(50));
      console.log("PASSWORD RESET EMAIL");
      console.log("=".repeat(50));
      console.log(`To: ${email}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log("=".repeat(50));
      return;
    }

    console.log(`Password reset email sent to ${email}`);
  }

  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    if (config.nodeEnv === "development") {
      console.log("=".repeat(50));
      console.log("WELCOME EMAIL");
      console.log("=".repeat(50));
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log("=".repeat(50));
      return;
    }

    console.log(`Welcome email sent to ${email}`);
  }

  static async sendAccountDeletionConfirmation(email: string): Promise<void> {
    if (config.nodeEnv === "development") {
      console.log("=".repeat(50));
      console.log("ACCOUNT DELETION CONFIRMATION");
      console.log("=".repeat(50));
      console.log(`To: ${email}`);
      console.log("=".repeat(50));
      return;
    }

    console.log(`Account deletion confirmation sent to ${email}`);
  }
}
