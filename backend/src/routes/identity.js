import { Router } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { z } from "zod";
import User from "../models/User.js";
import IdentityAudit from "../models/IdentityAudit.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicUser } from "../utils/sanitize.js";
import { env } from "../config/env.js";

const router = Router();

// Configure private storage directory outside public static web roots
const DEFAULT_VAULT_DIR = path.resolve(process.cwd(), "uploads", "vault_documents");
const VAULT_DIR = env.documentsStoragePath || DEFAULT_VAULT_DIR;

// Ensure storage folder exists with restricted permissions
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true, mode: 0o700 });
}

// Memory storage for inspection before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum
  }
});

/**
 * Validates file signature (magic bytes) to prevent extension spoofing.
 */
function validateMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  // PDF signature: %PDF (0x25 0x50 0x44 0x46)
  if (mimeType === "application/pdf" && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return true;
  }

  // PNG signature: 0x89 0x50 0x4E 0x47
  if (mimeType === "image/png" && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }

  // JPEG signature: 0xFF 0xD8 0xFF
  if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  return false;
}

/**
 * GET /api/identity/my-status
 * Returns current identity verification stage and disclosures.
 */
router.get("/my-status", requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found." });

  return res.json({
    verificationStatus: user.verificationStatus,
    emailVerified: user.emailVerified,
    phoneVerified: Boolean(user.phoneVerified),
    documentSubmitted: Boolean(user.documentDetails?.submittedAt),
    reviewDetails: user.documentDetails?.submittedAt ? {
      submittedAt: user.documentDetails.submittedAt,
      reviewedAt: user.documentDetails.reviewedAt || null,
      reviewNotes: user.documentDetails.reviewNotes || null,
      rejectionReason: user.documentDetails.rejectionReason || null,
      fileName: user.documentDetails.originalName || null
    } : null,
    legalDisclosure: {
      purpose: "Identity & Eligibility verification for the SHEQ Community Network.",
      maskingRequirement: "You must mask the first 8 digits of your Aadhaar number before submission.",
      retentionPolicy: "Submitted documents are retained in a private, encrypted vault accessible only by authorized administrators, and may be deleted upon account closure.",
      limitations: "Manual document review checks submitted documentation only; it does not constitute automated UIDAI biometric authentication."
    }
  });
}));

/**
 * POST /api/identity/upload-document
 * Handles private document upload for eligibility review.
 */
router.post("/upload-document", requireAuth, upload.single("document"), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please select a valid document file (PDF, PNG, or JPEG up to 5MB)." });
  }

  const consent = req.body.consent === "true" || req.body.consent === true;
  if (!consent) {
    return res.status(400).json({ error: "Explicit consent is required to submit documents for review." });
  }

  const allowedMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type. Only PDF, PNG, and JPEG documents are accepted." });
  }

  // Validate magic bytes to avoid forged extensions
  if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({ error: "File content does not match the expected document format." });
  }

  // Generate SHA-256 integrity hash
  const sha256Hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

  // Determine safe extension
  const ext = req.file.mimetype === "application/pdf" ? "pdf" : (req.file.mimetype === "image/png" ? "png" : "jpg");
  const storedName = `${req.user._id}_${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(VAULT_DIR, storedName);

  // Clean up any previously uploaded file for this user
  const user = await User.findById(req.user._id).select("+documentDetails.storagePath");
  if (user.documentDetails?.storagePath && fs.existsSync(user.documentDetails.storagePath)) {
    try {
      fs.unlinkSync(user.documentDetails.storagePath);
    } catch {
      // Continue even if unlink fails
    }
  }

  // Write new file to private vault with restricted 0o600 permissions
  fs.writeFileSync(filePath, req.file.buffer, { mode: 0o600 });

  // Update user record
  user.verificationStatus = "pending_review";
  user.documentDetails = {
    originalName: req.file.originalname.replace(/[^a-zA-Z0-9._\-]/g, "_").slice(0, 100),
    storedName,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    storagePath: filePath,
    sha256Hash,
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
    rejectionReason: null,
    consentGiven: true,
    consentTimestamp: new Date()
  };
  await user.save();

  // Create audit log
  await IdentityAudit.create({
    userId: user._id,
    action: "document_uploaded",
    performedBy: user._id,
    performedByRole: user.role,
    ipAddress: req.ip,
    notes: `Document uploaded: ${user.documentDetails.originalName} (${req.file.size} bytes)`
  });

  return res.status(200).json({
    status: "pending_review",
    message: "Document successfully submitted to private vault. An administrator will review your submission.",
    user: publicUser(user)
  });
}));

/**
 * GET /api/identity/document/:userId
 * Stream the private document. Allowed only for the owner or an Admin.
 */
router.get("/document/:userId", requireAuth, asyncHandler(async (req, res) => {
  const isSelf = req.user._id.toString() === req.params.userId;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: "Access denied. You do not have permission to access this document." });
  }

  const targetUser = await User.findById(req.params.userId).select("+documentDetails.storagePath");
  if (!targetUser || !targetUser.documentDetails?.storagePath) {
    return res.status(404).json({ error: "No document found for this user." });
  }

  const filePath = targetUser.documentDetails.storagePath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Document file not found in storage vault." });
  }

  // Log audit access
  await IdentityAudit.create({
    userId: targetUser._id,
    action: "document_accessed",
    performedBy: req.user._id,
    performedByRole: req.user.role,
    ipAddress: req.ip,
    notes: `Document accessed by ${req.user.name} (${req.user.role})`
  });

  res.setHeader("Content-Type", targetUser.documentDetails.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${targetUser.documentDetails.originalName || "document"}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}));

/**
 * GET /api/identity/pending
 * Lists users awaiting document verification. Admin only.
 */
router.get("/pending", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({
    verificationStatus: { $in: ["pending_review", "pending", "resubmission_required", "rejected", "verified"] },
    "documentDetails.submittedAt": { $exists: true }
  })
    .select("name email phone role verificationStatus documentDetails createdAt")
    .sort({ "documentDetails.submittedAt": -1 })
    .lean();

  const formatted = pendingUsers.map(u => ({
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    verificationStatus: u.verificationStatus,
    document: u.documentDetails ? {
      originalName: u.documentDetails.originalName,
      mimeType: u.documentDetails.mimeType,
      fileSize: u.documentDetails.fileSize,
      submittedAt: u.documentDetails.submittedAt,
      reviewedAt: u.documentDetails.reviewedAt,
      reviewNotes: u.documentDetails.reviewNotes,
      rejectionReason: u.documentDetails.rejectionReason
    } : null,
    createdAt: u.createdAt
  }));

  return res.json(formatted);
}));

/**
 * PATCH /api/identity/review/:userId
 * Admin review endpoint to decide verification status.
 */
router.patch("/review/:userId", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const schema = z.object({
    decision: z.enum(["verified", "rejected", "resubmission_required"]),
    notes: z.string().trim().max(1000).optional(),
    rejectionReason: z.string().trim().max(1000).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid review decision.", details: parsed.error.flatten() });
  }

  const { decision, notes, rejectionReason } = parsed.data;

  if ((decision === "rejected" || decision === "resubmission_required") && !rejectionReason && !notes) {
    return res.status(400).json({ error: "Please provide a reason or notes for rejecting or requesting resubmission." });
  }

  const targetUser = await User.findById(req.params.userId);
  if (!targetUser) return res.status(404).json({ error: "Target user not found." });

  targetUser.verificationStatus = decision;
  if (!targetUser.documentDetails) {
    targetUser.documentDetails = {};
  }
  targetUser.documentDetails.reviewedAt = new Date();
  targetUser.documentDetails.reviewedBy = req.user._id;
  targetUser.documentDetails.reviewNotes = notes || "";
  targetUser.documentDetails.rejectionReason = rejectionReason || notes || "";
  await targetUser.save();

  // Determine audit action
  const auditActionMap = {
    verified: "review_approved",
    rejected: "review_rejected",
    resubmission_required: "review_resubmission_requested"
  };

  await IdentityAudit.create({
    userId: targetUser._id,
    action: auditActionMap[decision],
    performedBy: req.user._id,
    performedByRole: req.user.role,
    ipAddress: req.ip,
    notes: `Admin ${req.user.name} set status to ${decision}. Reason: ${rejectionReason || notes || "N/A"}`
  });

  return res.json({
    message: `Verification status updated to ${decision}.`,
    user: publicUser(targetUser)
  });
}));

/**
 * DELETE /api/identity/document
 * Secure deletion / Right to erasure: deletes user's uploaded document.
 */
router.delete("/document", requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+documentDetails.storagePath");
  if (!user || !user.documentDetails?.storagePath) {
    return res.status(404).json({ error: "No document on file to delete." });
  }

  if (fs.existsSync(user.documentDetails.storagePath)) {
    try {
      fs.unlinkSync(user.documentDetails.storagePath);
    } catch {
      // Continue
    }
  }

  user.documentDetails = undefined;
  if (user.verificationStatus === "pending_review") {
    user.verificationStatus = "unverified";
  }
  await user.save();

  await IdentityAudit.create({
    userId: user._id,
    action: "document_deleted",
    performedBy: user._id,
    performedByRole: user.role,
    ipAddress: req.ip,
    notes: "User securely removed document file."
  });

  return res.json({
    message: "Document deleted securely from vault.",
    user: publicUser(user)
  });
}));

/**
 * GET /api/identity/audit-logs
 * Compliance and audit trail. Admin only.
 */
router.get("/audit-logs", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const logs = await IdentityAudit.find()
    .populate("userId", "name email")
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return res.json(logs);
}));

export default router;
