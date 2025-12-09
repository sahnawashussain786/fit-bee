import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  connectToDatabase,
  setCorsHeaders,
  generateToken,
  isBootstrapAdmin,
} from "../utils/authHelper.js";

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    clerkId: { type: String, unique: true, sparse: true },
    isAdmin: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get or create User model
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const startAsAdmin = isBootstrapAdmin(email);

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      isAdmin: startAsAdmin,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in register handler:", error);
    res.status(500).json({ message: error.message });
  }
}
