import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicUser } from "../utils/sanitize.js";
import { issueAccessToken } from "../services/tokenService.js";

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.production ? 10 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(10).max(128)
}).refine(v => Boolean(v.email || v.phone), { message: "Provide email or phone." });

router.post("/signup", limiter, asyncHandler(async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid signup details.", details: parsed.error.flatten() });
  const d = parsed.data;
  const email = d.email?.toLowerCase();
  const duplicate = await User.findOne({ $or: [email ? { email } : null, d.phone ? { phone: d.phone } : null].filter(Boolean) });
  if (duplicate) return res.status(409).json({ error: "An account with those details already exists." });
  const user = await User.create({ name: d.name, email, phone: d.phone, passwordHash: await bcrypt.hash(d.password, env.bcryptRounds), role: "user" });
  return res.status(201).json({ user: publicUser(user), token: issueAccessToken(user), notice: "Account created. Email/phone verification is not active until a delivery provider is configured." });
}));
router.post("/login", limiter, asyncHandler(async (req, res) => {
  const parsed = z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Identifier and password are required." });
  const { identifier, password } = parsed.data;
  const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] }).select("+passwordHash");
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials." });
  user.lastLoginAt = new Date();
  await user.save();
  return res.json({ user: publicUser(user), token: issueAccessToken(user) });
}));
router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// Integration seam only. Never accept/store Aadhaar numbers, Aadhaar OTPs, or scans in this API.
router.get("/identity/status", requireAuth, asyncHandler(async (req, res) => {
  return res.json({
    verificationStatus: req.user.verificationStatus,
    providerConfigured: Boolean(env.identityEnabled && env.identityProvider !== "disabled" && env.identityProviderBaseUrl && env.identityProviderApiKey),
    provider: env.identityProvider,
    mode: "integration-seam-demo-boundary",
    requirements: [
      "Authorized UIDAI / MeitY ASA or KUA gateway (e.g. Setu, Digilocker, Karza)",
      "Registered client credentials (IDENTITY_PROVIDER_BASE_URL, IDENTITY_PROVIDER_API_KEY)",
      "Hosted eKYC redirect / session handshake with explicit user consent",
      "Legal and security compliance review for Aadhaar data minimization"
    ]
  });
}));

router.post("/identity/start", requireAuth, asyncHandler(async (req, res) => {
  if (!env.identityEnabled || env.identityProvider === "disabled" || !env.identityProviderBaseUrl || !env.identityProviderApiKey) {
    return res.status(503).json({
      status: "unavailable",
      error: "Identity verification provider is not configured.",
      message: "Real identity verification requires an authorized UIDAI/MeitY provider, documented API credentials, hosted redirect, and legal review."
    });
  }
  return res.status(501).json({
    status: "not_implemented",
    error: "Provider-specific adapter required.",
    message: "Integrate the authorized provider's documented hosted redirect/session API after legal and security review."
  });
}));

router.post("/identity/demo-verify", requireAuth, asyncHandler(async (req, res) => {
  // Demo simulation only — explicitly preserves unverified status so simulated OTP never masquerades as genuine Aadhaar
  return res.json({
    status: "demo_simulation_tested",
    accountStatus: req.user.verificationStatus,
    notice: "Demo sandbox flow exercised successfully. Official verified status remains unchanged because no authorized UIDAI/eKYC provider is active."
  });
}));

router.patch("/users/:id/verification", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({
    verificationStatus: z.enum(["unverified", "pending", "verified", "failed"])
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid verification status." });
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: parsed.data.verificationStatus },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ error: "User not found." });
  return res.json({ user: publicUser(user) });
}));

export default router;
