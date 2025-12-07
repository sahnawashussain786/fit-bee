import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Helper to check for bootstrap admin
const isBootstrapAdmin = (email) => {
  return email === "sahnawashussain98@gmail.com";
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const startAsAdmin = isBootstrapAdmin(email);

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
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/sync
// @desc    Sync user from Clerk to MongoDB
// @access  Public
router.post("/sync", async (req, res) => {
  const { clerkId, name, email } = req.body;

  try {
    let user = await User.findOne({ $or: [{ clerkId }, { email }] });

    const shouldBeAdmin = isBootstrapAdmin(email);

    if (!user) {
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
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/promote
// @desc    Promote a user to admin by email
// @access  Private/Admin
router.put("/promote", protect, admin, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      user.isAdmin = true;
      await user.save();
      res.json({
        message: `User ${email} is now an admin`,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
