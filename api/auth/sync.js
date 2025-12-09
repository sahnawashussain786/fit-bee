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

  const { clerkId, name, email } = req.body;

  if (!clerkId || !email) {
    return res.status(400).json({ message: "ClerkId and email are required" });
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Find user by clerkId or email
    let user = await User.findOne({ $or: [{ clerkId }, { email }] });

    const shouldBeAdmin = isBootstrapAdmin(email);

    if (!user) {
      // Create new user
      user = await User.create({
        clerkId,
        name,
        email,
        isAdmin: shouldBeAdmin,
      });
    } else {
      // Update existing user details to match Clerk
      user.name = name || user.name;
      user.email = email || user.email;
      user.clerkId = clerkId;
      if (shouldBeAdmin && !user.isAdmin) {
        user.isAdmin = true;
      }
      await user.save();
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      clerkId: user.clerkId,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Error in sync handler:", error);
    res.status(500).json({ message: error.message });
  }
}
