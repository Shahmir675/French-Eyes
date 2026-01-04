import mongoose from "mongoose";
import { config } from "../src/config/index.js";
import { AdminAuthService } from "../src/services/admin-auth.service.js";

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");

    const email = "admin@frencheyes.com";
    const password = "Admin123!";
    const name = "Admin User";

    console.log("Creating admin user...");
    const admin = await AdminAuthService.createAdmin(
      email,
      password,
      name,
      "super_admin",
      []
    );

    console.log("\n=================================");
    console.log("Admin user created successfully!");
    console.log("=================================");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: super_admin`);
    console.log(`ID: ${admin.id}`);
    console.log("=================================\n");

  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const err = error as { message: string };
      if (err.message.includes("already exists")) {
        console.log("\nAdmin user already exists with email: admin@frencheyes.com");
        console.log("Password: Admin123!");
      } else {
        console.error("Error creating admin:", err.message);
      }
    } else {
      console.error("Error creating admin:", error);
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedAdmin();
