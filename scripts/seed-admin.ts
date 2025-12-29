import mongoose from "mongoose";
import { Admin } from "../src/models/admin.model.js";
import { hashPassword } from "../src/utils/password.js";
import { config } from "../src/config/index.js";

async function main() {
  await mongoose.connect(config.mongodb.uri);
  console.log("Connected to MongoDB");

  const existingAdmin = await Admin.findOne({ email: "admin@frencheyes.com" });
  if (existingAdmin) {
    console.log("Test admin already exists");
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword("Admin123!");

  const admin = await Admin.create({
    email: "admin@frencheyes.com",
    passwordHash,
    name: "Test Admin",
    role: "super_admin",
    status: "active",
    permissions: [],
  });

  console.log("Admin created:", admin._id.toString());
  await mongoose.disconnect();
}

main().catch(console.error);
