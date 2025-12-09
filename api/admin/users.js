import {
  connectToDatabase,
  setCorsHeaders,
  checkAdmin,
} from "../utils/authHelper.js";
import User from "../../server/models/User.js";

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

      // Get all users without passwords
      const users = await User.find({}).select("-password");
      res.json(users);
    } else if (req.method === "DELETE") {
      const auth = await checkAdmin(req);
      if (!auth.authorized) {
        return res.status(401).json({ message: auth.message });
      }

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await User.findById(id);
      if (user) {
        await user.deleteOne();
        res.json({ message: "User removed" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in users handler:", error);
    res.status(500).json({ message: error.message });
  }
}
