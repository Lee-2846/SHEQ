import { Router } from "express";
import { z } from "zod";
import Hotspot from "../models/Hotspot.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateHotspotCandidates, getHotspotBenchmark } from "../services/hotspotService.js";
const router = Router();

router.get("/benchmark", (req, res) => {
  return res.json(getHotspotBenchmark());
});

router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const hotspots = await Hotspot.find({ state: "designated" }).select("-evidenceReportIds").sort({ updatedAt: -1 }).limit(200).lean();
  return res.json({ hotspots });
}));

router.get("/candidates", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
  const candidates = await calculateHotspotCandidates({ days });
  return res.json({
    mode: "modular-multisignal-v2",
    candidates,
    benchmark: getHotspotBenchmark()
  });
}));

router.post("/candidates/save", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({
    label: z.string().max(250).optional(),
    longitude: z.number().min(-180).max(180), latitude: z.number().min(-90).max(90),
    score: z.number().min(0).max(100),
    factors: z.record(z.any()),
    evidenceReportIds: z.array(z.string()).max(500),
    rationale: z.string().max(2000)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid candidate.", details: parsed.error.flatten() });
  const d = parsed.data;
  const hotspot = await Hotspot.create({
    label: d.label, center: { type: "Point", coordinates: [d.longitude, d.latitude] }, score: d.score,
    factors: d.factors, evidenceReportIds: d.evidenceReportIds, rationale: d.rationale,
    state: "candidate", createdBy: req.user._id
  });
  return res.status(201).json({ hotspot });
}));
router.patch("/:id/review", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({ state: z.enum(["designated", "dismissed", "inactive"]), rationale: z.string().max(2000).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "State must be designated, dismissed, or inactive." });
  const hotspot = await Hotspot.findByIdAndUpdate(req.params.id, { state: parsed.data.state, rationale: parsed.data.rationale, reviewedBy: req.user._id, reviewedAt: new Date() }, { new: true, runValidators: true });
  if (!hotspot) return res.status(404).json({ error: "Hotspot candidate not found." });
  return res.json({ hotspot });
}));
export default router;
