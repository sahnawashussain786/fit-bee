import {
  connectToDatabase,
  setCorsHeaders,
  checkAdmin,
} from "../utils/authHelper.js";
import Subscriber from "../../server/models/Subscriber.js";

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

      // Get all subscribers
      const subscribers = await Subscriber.find({});
      res.json(subscribers);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in subscribers handler:", error);
    res.status(500).json({ message: error.message });
  }
}
