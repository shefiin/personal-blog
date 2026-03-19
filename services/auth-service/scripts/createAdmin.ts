import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/user.model.js";

dotenv.config({ path: ".env.development" });
dotenv.config();

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/code-context-auth";
const adminName = process.env.ADMIN_SEED_NAME || "Admin";
const adminEmail = process.env.ADMIN_SEED_EMAIL;
const adminPassword = process.env.ADMIN_SEED_PASSWORD;

const main = async () => {
  if (!adminEmail || !adminPassword) {
    throw new Error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD before running create-admin.");
  }

  await mongoose.connect(mongoUrl);

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin = await User.findOneAndUpdate(
    { email: adminEmail.toLowerCase().trim() },
    {
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
      isEmailVerified: true
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  console.log(`Admin ready: ${admin.email}`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error("Failed to create admin:", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
