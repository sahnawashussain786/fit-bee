import express from "express";
import Message from "../models/Message.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET api/messages
// @desc    Get all messages
// @access  Private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST api/messages
// @desc    Send a message
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;

    // Validate request
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newMessage = new Message({
      firstName,
      lastName,
      email,
      message,
    });

    await newMessage.save();

    res
      .status(201)
      .json({ message: "Message sent successfully!", data: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
