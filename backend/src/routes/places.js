import { Router } from "express";
import { z } from "zod";
import SavedPlace from "../models/SavedPlace.js";
import Report from "../models/Report.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(async (req, res) => res.json({ places: await SavedPlace.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean() })));
router.post("/", asyncHandler(async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(1).max(100), label: z.string().trim().max(250).optional(), longitude: z.number().min(-180).max(180), latitude: z.number().min(-90).max(90) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid saved place.", details: parsed.error.flatten() });
  const d = parsed.data;
  const place = await SavedPlace.create({ userId: req.user._id, name: d.name, label: d.label, location: { type: "Point", coordinates: [d.longitude, d.latitude] } });
  return res.status(201).json({ place });
}));
router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await SavedPlace.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!result.deletedCount) return res.status(404).json({ error: "Saved place not found." });
  return res.status(204).end();
}));
router.get("/:id/insights", asyncHandler(async (req, res) => {
  const place = await SavedPlace.findOne({ _id: req.params.id, userId: req.user._id });
  if (!place) return res.status(404).json({ error: "Saved place not found." });
  const reports = await Report.find({
    location: { $near: { $geometry: place.location, $maxDistance: 2000 } },
    createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
    status: { $ne: "Flagged" }, sourceType: { $ne: "synthetic_demo" }
  }).select("category status createdAt location.label").limit(100).lean();
  return res.json({ place: { id: place._id, name: place.name, label: place.label }, radiusMeters: 2000, periodDays: 30, recentReportCount: reports.length, reports });
}));
export default router;
