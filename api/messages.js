import {
  connectToDatabase,
  setCorsHeaders,
  checkAdmin,
} from "./utils/authHelper.js";
import Message from "../server/models/Message.js";

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();

    if (req.method === "POST") {
      const { firstName, lastName, email, message } = req.body;

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

      return res
        .status(201)
        .json({ message: "Message sent successfully!", data: newMessage });
    } else if (req.method === "GET") {
      const auth = await checkAdmin(req);
      if (!auth.authorized) {
        return res.status(401).json({ error: auth.message });
      }

      const messages = await Message.find().sort({ createdAt: -1 });
      return res.json(messages);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in messages handler:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    return res.status(500).json({ error: "Server error" });
  }
}
