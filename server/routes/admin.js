import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Subscriber from "../models/Subscriber.js";
import Message from "../models/Message.js";

const router = express.Router();

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSubscribers = await Subscriber.countDocuments();
    const totalMessages = await Message.countDocuments();
    const recentPayments = await Payment.countDocuments();

    // Calculate total revenue (assuming amount is in Payment model)
    // You might need to adjust this based on your actual Payment model
    const payments = await Payment.find();
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.json({
      totalUsers,
      totalSubscribers,
      totalMessages,
      totalRevenue,
      recentPayments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete("/users/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Admin
router.get("/payments", protect, admin, async (req, res) => {
  try {
    const payments = await Payment.find({}).populate("user", "name email");
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all messages
// @route   GET /api/admin/messages
// @access  Private/Admin
router.get("/messages", protect, admin, async (req, res) => {
  try {
    const messages = await Message.find({});
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all subscribers
// @route   GET /api/admin/subscribers
// @access  Private/Admin
router.get("/subscribers", protect, admin, async (req, res) => {
  try {
    const subscribers = await Subscriber.find({});
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
