import { Router } from "express";
import { z } from "zod";
import Report, { categories } from "../models/Report.js";
import Comment from "../models/Comment.js";
import Confirmation from "../models/Confirmation.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicReport } from "../utils/sanitize.js";

const router = Router();
const reportSchema = z.object({
  category: z.enum(categories),
  description: z.string().trim().min(5).max(5000),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  locationLabel: z.string().trim().max(250).optional(),
  incidentAt: z.string().datetime().optional(),
  isAnonymousPublicly: z.boolean().default(false)
});
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const filter = {};
  if (typeof req.query.status === "string") filter.status = req.query.status;
  if (typeof req.query.category === "string") filter.category = req.query.category;
  if (req.query.nearLon !== undefined && req.query.nearLat !== undefined) {
    const lon = Number(req.query.nearLon), lat = Number(req.query.nearLat), maxDistance = Math.min(Number(req.query.maxDistance) || 3000, 20000);
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) return res.status(400).json({ error: "Invalid coordinates." });
    filter.location = { $near: { $geometry: { type: "Point", coordinates: [lon, lat] }, $maxDistance: maxDistance } };
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const reports = await Report.find(filter).select("-reporterId -moderationNote").sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({ reports });
}));
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid report.", details: parsed.error.flatten() });
  const d = parsed.data;
  const report = await Report.create({
    category: d.category, description: d.description,
    location: { type: "Point", coordinates: [d.longitude, d.latitude], label: d.locationLabel },
    incidentAt: d.incidentAt ? new Date(d.incidentAt) : undefined,
    isAnonymousPublicly: d.isAnonymousPublicly, reporterId: req.user._id
  });
  return res.status(201).json({ report: publicReport(report) });
}));
router.get("/:id/comments", requireAuth, asyncHandler(async (req, res) => {
  const comments = await Comment.find({ reportId: req.params.id, moderationStatus: "visible" }).select("-authorId").sort({ createdAt: 1 }).lean();
  return res.json({ comments });
}));
router.post("/:id/comments", requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ text: z.string().trim().min(2).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Comment must be 2–2000 characters." });
  if (!(await Report.exists({ _id: req.params.id }))) return res.status(404).json({ error: "Report not found." });
  const comment = await Comment.create({ reportId: req.params.id, authorId: req.user._id, text: parsed.data.text });
  return res.status(201).json({ comment: { id: comment._id, reportId: comment.reportId, text: comment.text, createdAt: comment.createdAt } });
}));
router.post("/:id/confirm", requireAuth, asyncHandler(async (req, res) => {
  if (!(await Report.exists({ _id: req.params.id }))) return res.status(404).json({ error: "Report not found." });
  try {
    await Confirmation.create({ reportId: req.params.id, userId: req.user._id });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "You have already confirmed this report." });
    throw error;
  }
  const report = await Report.findByIdAndUpdate(req.params.id, { $inc: { confirmations: 1 } }, { new: true }).select("-reporterId -moderationNote");
  return res.json({ report: publicReport(report) });
}));
router.post("/:id/dispute", requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({
    reason: z.string().trim().min(2).max(250),
    details: z.string().trim().max(2000).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Reason is required (2–250 characters)." });
  if (!(await Report.exists({ _id: req.params.id }))) return res.status(404).json({ error: "Report not found." });
  const report = await Report.findByIdAndUpdate(req.params.id, { $inc: { disputes: 1 } }, { new: true }).select("-reporterId -moderationNote");
  return res.json({ report: publicReport(report), dispute: parsed.data });
}));
router.patch("/:id/moderation", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({ status: z.enum(["Submitted", "Under Review", "Verified", "Resolved", "Flagged"]), moderationNote: z.string().max(2000).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid moderation update." });
  const report = await Report.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true }).select("-reporterId");
  if (!report) return res.status(404).json({ error: "Report not found." });
  return res.json({ report });
}));
export default router;
