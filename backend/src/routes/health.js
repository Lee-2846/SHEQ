import { Router } from "express";
import mongoose from "mongoose";
const router = Router();
router.get("/", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "degraded", service: "sheq-api", database: connected ? "connected" : "disconnected", timestamp: new Date().toISOString() });
});
export default router;
