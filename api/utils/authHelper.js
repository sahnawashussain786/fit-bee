import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../../server/models/User.js";

// MongoDB connection cache
let cachedDb = null;

/**
 * Connect to MongoDB database with connection caching
 */
export async function connectToDatabase() {
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

/**
 * Set CORS headers for Vercel serverless functions
 */
export function setCorsHeaders(res) {
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
}

/**
 * Check if user is authenticated via JWT token
 * @returns {Object} { authorized: boolean, user?: User, message?: string }
 */
export async function checkAuth(req) {
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
}

/**
 * Check if user is authenticated AND is an admin
 * @returns {Object} { authorized: boolean, isAdmin: boolean, user?: User, message?: string }
 */
export async function checkAdmin(req) {
  const auth = await checkAuth(req);
  if (!auth.authorized) {
    return { ...auth, isAdmin: false };
  }

  if (!auth.user.isAdmin) {
    return {
      authorized: false,
      isAdmin: false,
      message: "Not authorized as an admin",
    };
  }

  return { authorized: true, isAdmin: true, user: auth.user };
}

/**
 * Check if email is the bootstrap admin
 */
export function isBootstrapAdmin(email) {
  return email === "sahnawashussain98@gmail.com";
}

/**
 * Generate JWT token for user
 */
export function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || "defaultsecret", {
    expiresIn: "30d",
  });
}
