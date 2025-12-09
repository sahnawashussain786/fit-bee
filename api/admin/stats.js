import {
  connectToDatabase,
  setCorsHeaders,
  checkAdmin,
} from "../utils/authHelper.js";
import User from "../../server/models/User.js";
import Subscriber from "../../server/models/Subscriber.js";
import Message from "../../server/models/Message.js";
import Payment from "../../server/models/Payment.js";

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

    if (req.method === "GET") {
      const auth = await checkAdmin(req);
      if (!auth.authorized) {
        return res.status(401).json({ message: auth.message });
      }

      // Get dashboard statistics
      const totalUsers = await User.countDocuments();
      const totalSubscribers = await Subscriber.countDocuments();
      const totalMessages = await Message.countDocuments();
      const recentPayments = await Payment.countDocuments();

      // Calculate total revenue (assuming amount is in Payment model)
      const payments = await Payment.find();
      const totalRevenue = payments.reduce(
        (acc, p) => acc + (p.amount || 0),
        0
      );

      res.json({
        totalUsers,
        totalSubscribers,
        totalMessages,
        totalRevenue,
        recentPayments,
      });
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in stats handler:", error);
    res.status(500).json({ message: error.message });
  }
}
