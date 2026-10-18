import { Router } from "express";
import Report from "../models/Report.js";
import Hotspot from "../models/Hotspot.js";
import Comment from "../models/Comment.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const router = Router();
router.get("/admin", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const [byStatus, byCategory, comments, hotspots, totalReports, recentReports] = await Promise.all([
    Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Report.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Comment.countDocuments({ moderationStatus: "visible" }),
    Hotspot.countDocuments({ state: "designated" }),
    Report.countDocuments(),
    Report.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } })
  ]);
  return res.json({ source: "database-derived", totalReports, reportsLast30Days: recentReports, visibleComments: comments, designatedHotspots: hotspots, byStatus, byCategory, note: "These are counts of stored records, not estimates of incidents prevented or real-world safety outcomes." });
}));
export default router;
