import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    const adminEmail = "admin@example.com";
    const adminPassword = "admin123";

    // Check if admin already exists
    const userExists = await User.findOne({ email: adminEmail });

    if (userExists) {
      console.log("Admin user already exists");
      userExists.isAdmin = true; // Ensure they are admin
      userExists.password = adminPassword; // Reset password to known value if desired, or skip
      await userExists.save();
      console.log(
        `Admin user updated. Email: ${adminEmail}, Password: ${adminPassword}`
      );
    } else {
      const user = await User.create({
        name: "Admin User",
        email: adminEmail,
        password: adminPassword,
        isAdmin: true,
      });
      console.log(
        `Admin user created. Email: ${user.email}, Password: ${adminPassword}`
      );
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
