import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../../server/models/User.js";

// MongoDB connection cache
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  const db = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedDb = db;
  return db;
}

// Auth Helper
const checkAuth = async (req) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "defaultsecret"
      );
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return { authorized: false, message: "User not found" };
      }
      return { authorized: true, user };
    } catch (error) {
      return { authorized: false, message: "Not authorized, token failed" };
    }
  }
  return { authorized: false, message: "Not authorized, no token" };
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();

    if (req.method === "PUT") {
      const auth = await checkAuth(req);
      if (!auth.authorized) {
        return res.status(401).json({ message: auth.message }); // Use message for client compatibility if needed, or error
      }

      if (!auth.user.isAdmin) {
        return res.status(401).json({ message: "Not authorized as an admin" });
      }

      const { email } = req.body;
      const userToPromote = await User.findOne({ email });

      if (userToPromote) {
        userToPromote.isAdmin = true;
        await userToPromote.save();
        return res.json({ message: "User promoted to admin" });
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in promote handler:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
