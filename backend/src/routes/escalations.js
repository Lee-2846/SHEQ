import { Router } from "express";
import { z } from "zod";
import Escalation from "../models/Escalation.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const router = Router();
router.use(requireAuth, requireAdmin);
router.get("/", asyncHandler(async (req, res) => res.json({ escalations: await Escalation.find().sort({ createdAt: -1 }).limit(200).lean() })));
router.post("/", asyncHandler(async (req, res) => {
  const parsed = z.object({ title: z.string().trim().min(3).max(250), summary: z.string().trim().min(5).max(5000), reportIds: z.array(z.string()).max(100).default([]), locationLabel: z.string().max(250).optional(), category: z.string().max(100).optional(), evidenceContext: z.string().max(5000).optional(), adminNotes: z.string().max(5000).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid escalation record.", details: parsed.error.flatten() });
  const escalation = await Escalation.create({ ...parsed.data, createdBy: req.user._id });
  return res.status(201).json({ escalation });
}));
router.patch("/:id", asyncHandler(async (req, res) => {
  const parsed = z.object({ status: z.enum(["draft", "under_review", "prepared_for_external_escalation", "closed"]).optional(), adminNotes: z.string().max(5000).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid update." });
  const escalation = await Escalation.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!escalation) return res.status(404).json({ error: "Escalation not found." });
  return res.json({ escalation });
}));
export default router;
