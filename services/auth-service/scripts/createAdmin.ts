import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../src/models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await User.create({
      name: "Super Admin",
      email: "admin@urbanfresh.com",
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    console.log("Admin created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
