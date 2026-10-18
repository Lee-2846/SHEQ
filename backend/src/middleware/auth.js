import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Authentication required." });
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("_id name email phone role verificationStatus isActive");
    if (!user || !user.isActive) return res.status(401).json({ error: "Account unavailable." });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token) {
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub).select("_id name email phone role verificationStatus isActive");
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // If token invalid, continue as unauthenticated guest
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Administrator access required." });
  return next();
}


