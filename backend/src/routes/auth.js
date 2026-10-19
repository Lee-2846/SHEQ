import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import User from "../models/User.js";
import EmailOtp from "../models/EmailOtp.js";
import PhoneOtp from "../models/PhoneOtp.js";
import { env } from "../config/env.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicUser } from "../utils/sanitize.js";
import { issueAccessToken } from "../services/tokenService.js";
import { sendOtpEmail, getProviderStatus } from "../services/emailService.js";
import {
  sendOtpSms,
  getSmsProviderStatus,
  normalizePhoneNumber,
  isSmsConfigured
} from "../services/smsService.js";

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.production ? 15 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().email("Please provide a valid email address.").optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string()
    .min(10, "Password must be at least 10 characters.")
    .max(128)
    .refine(v => specialCharRegex.test(v), {
      message: "Password must include at least one special character (!@#$%^&*...)."
    })
}).refine(v => Boolean(v.email || v.phone), { message: "Provide an email address or mobile phone number." });

function hashOtp(email, otp) {
  return crypto
    .createHmac("sha256", env.otpSecret)
    .update(`${email.toLowerCase()}:${otp.trim()}`)
    .digest("hex");
}

function hashPhoneOtp(phone, otp) {
  return crypto
    .createHmac("sha256", env.otpSecret)
    .update(`${phone.trim()}:${otp.trim()}`)
    .digest("hex");
}

/**
 * Initiates the signup process by validating input, generating a secure OTP,
 * hashing it, and attempting delivery through the configured adapter.
 */
async function handleSignupInitiation(req, res) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid signup details.", details: parsed.error.flatten() });
  }

  const d = parsed.data;
  const email = d.email ? d.email.toLowerCase().trim() : null;
  const rawPhone = d.phone ? d.phone.trim() : null;

  // 1. Phone-based signup
  if (!email && rawPhone) {
    const { isValid, normalized, error: phoneError } = normalizePhoneNumber(rawPhone);
    if (!isValid) {
      return res.status(400).json({ error: phoneError || "Invalid phone number format." });
    }

    if (!isSmsConfigured()) {
      return res.status(503).json({
        error: "SMS verification is not configured on this server.",
        message: "An automated SMS provider (e.g., Twilio) is not configured. Please register using your email address, or configure telephony credentials in backend/.env."
      });
    }

    const existingUser = await User.findOne({ phone: normalized });
    if (existingUser && existingUser.isActive) {
      return res.status(409).json({
        error: "An account with this phone number already exists. Please log in or reset your password."
      });
    }

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashPhoneOtp(normalized, rawOtp);
    const passwordHash = await bcrypt.hash(d.password, env.bcryptRounds);
    const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + env.otpResendCooldownSeconds * 1000);

    await PhoneOtp.findOneAndUpdate(
      { phone: normalized },
      {
        name: d.name,
        passwordHash,
        otpHash,
        attemptsRemaining: env.otpMaxAttempts,
        resendAvailableAt,
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const deliveryResult = await sendOtpSms({
      to: normalized,
      otp: rawOtp,
      name: d.name
    });

    return res.status(200).json({
      status: "otp_initiated",
      method: "phone",
      phone: normalized,
      smsDeliveryConfigured: deliveryResult.delivered,
      provider: deliveryResult.provider,
      notice: deliveryResult.notice,
      expiresInMinutes: env.otpExpiryMinutes,
      resendCooldownSeconds: env.otpResendCooldownSeconds
    });
  }

  // 2. Email-based signup
  // Check if an active user already exists with this email
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isActive) {
    return res.status(409).json({
      error: "An account with this email address already exists. Please log in or reset your password."
    });
  }

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(email, rawOtp);

  // Hash password with bcrypt immediately — plaintext password is NEVER stored
  const passwordHash = await bcrypt.hash(d.password, env.bcryptRounds);

  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
  const resendAvailableAt = new Date(Date.now() + env.otpResendCooldownSeconds * 1000);

  // Upsert pending signup record in EmailOtp collection
  await EmailOtp.findOneAndUpdate(
    { email },
    {
      name: d.name,
      passwordHash,
      otpHash,
      attemptsRemaining: env.otpMaxAttempts,
      resendAvailableAt,
      expiresAt
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Attempt delivery through the configured provider adapter
  const deliveryResult = await sendOtpEmail({
    to: email,
    otp: rawOtp,
    name: d.name
  });

  return res.status(200).json({
    status: "otp_initiated",
    method: "email",
    email,
    emailDeliveryConfigured: deliveryResult.delivered,
    provider: deliveryResult.provider,
    notice: deliveryResult.notice,
    expiresInMinutes: env.otpExpiryMinutes,
    resendCooldownSeconds: env.otpResendCooldownSeconds
  });
}

// Support both POST /signup and POST /signup/initiate for clean architecture
router.post("/signup", limiter, asyncHandler(handleSignupInitiation));
router.post("/signup/initiate", limiter, asyncHandler(handleSignupInitiation));

/**
 * Validates submitted OTP for either email or phone signup.
 */
router.post("/signup/verify", limiter, asyncHandler(async (req, res) => {
  const verifySchema = z.object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    otp: z.string().trim().min(4).max(8)
  }).refine(v => Boolean(v.email || v.phone), { message: "Provide an email address or phone number." });

  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Identifier and verification code are required.", details: parsed.error.flatten() });
  }

  const { email, phone, otp } = parsed.data;

  // Handle phone verification
  if (phone) {
    const { normalized } = normalizePhoneNumber(phone);
    const record = await PhoneOtp.findOne({ phone: normalized }).select("+passwordHash +otpHash");
    if (!record) {
      return res.status(400).json({
        error: "No pending registration found for this phone number, or the code has expired. Please initiate signup again."
      });
    }

    if (new Date() > record.expiresAt) {
      await PhoneOtp.deleteOne({ _id: record._id });
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    if (record.attemptsRemaining <= 0) {
      await PhoneOtp.deleteOne({ _id: record._id });
      return res.status(400).json({ error: "Maximum verification attempts exceeded. Code has been invalidated." });
    }

    const expectedHash = hashPhoneOtp(normalized, otp);
    let isMatch = false;
    try {
      const bufA = Buffer.from(expectedHash, "hex");
      const bufB = Buffer.from(record.otpHash, "hex");
      if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
        isMatch = true;
      }
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      record.attemptsRemaining -= 1;
      if (record.attemptsRemaining <= 0) {
        await PhoneOtp.deleteOne({ _id: record._id });
        return res.status(400).json({ error: "Incorrect verification code. Maximum attempts exceeded." });
      }
      await record.save();
      return res.status(400).json({ error: `Incorrect verification code. ${record.attemptsRemaining} attempt(s) remaining.` });
    }

    await PhoneOtp.deleteOne({ _id: record._id });

    let user = await User.findOne({ phone: normalized });
    if (user) {
      user.name = record.name || user.name;
      user.passwordHash = record.passwordHash || user.passwordHash;
      user.phoneVerified = true;
      user.isActive = true;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: record.name,
        phone: normalized,
        passwordHash: record.passwordHash,
        role: "user",
        phoneVerified: true,
        verificationStatus: "unverified",
        isActive: true,
        lastLoginAt: new Date()
      });
    }

    const token = issueAccessToken(user);
    return res.status(201).json({
      user: publicUser(user),
      token,
      notice: "Mobile phone verified and account activated successfully."
    });
  }

  // Handle email verification
  const normalizedEmail = email.toLowerCase().trim();
  const record = await EmailOtp.findOne({ email: normalizedEmail }).select("+passwordHash +otpHash");
  if (!record) {
    return res.status(400).json({
      error: "No pending registration found for this email, or the code has expired. Please initiate signup again."
    });
  }

  // Check expiration
  if (new Date() > record.expiresAt) {
    await EmailOtp.deleteOne({ _id: record._id });
    return res.status(400).json({
      error: "Verification code has expired. Please request a new code."
    });
  }

  // Check attempt limits
  if (record.attemptsRemaining <= 0) {
    await EmailOtp.deleteOne({ _id: record._id });
    return res.status(400).json({
      error: "Maximum verification attempts exceeded. For your security, this code has been invalidated. Please request a new code."
    });
  }

  // Constant-time timing-safe hash comparison
  const expectedHash = hashOtp(normalizedEmail, otp);
  let isMatch = false;
  try {
    const bufA = Buffer.from(expectedHash, "hex");
    const bufB = Buffer.from(record.otpHash, "hex");
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      isMatch = true;
    }
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    record.attemptsRemaining -= 1;
    if (record.attemptsRemaining <= 0) {
      await EmailOtp.deleteOne({ _id: record._id });
      return res.status(400).json({
        error: "Incorrect verification code. Maximum attempts exceeded. Code has been invalidated. Please request a new code."
      });
    }
    await record.save();
    return res.status(400).json({
      error: `Incorrect verification code. ${record.attemptsRemaining} attempt(s) remaining.`
    });
  }

  // Invalidate OTP record immediately to prevent replay
  await EmailOtp.deleteOne({ _id: record._id });

  // Create or activate the user account
  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    user.name = record.name;
    user.passwordHash = record.passwordHash;
    user.emailVerified = true;
    user.isActive = true;
    user.lastLoginAt = new Date();
    await user.save();
  } else {
    user = await User.create({
      name: record.name,
      email: normalizedEmail,
      passwordHash: record.passwordHash,
      role: "user",
      emailVerified: true,
      verificationStatus: "unverified",
      isActive: true,
      lastLoginAt: new Date()
    });
  }

  const token = issueAccessToken(user);
  return res.status(201).json({
    user: publicUser(user),
    token,
    notice: "Email verified and account activated successfully."
  });
}));

/**
 * Resends a newly generated OTP subject to cooldown and rate limits.
 */
router.post("/signup/resend-otp", limiter, asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional()
  }).refine(v => Boolean(v.email || v.phone), { message: "Provide an email or phone number." });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Valid email or phone number is required." });
  }

  if (parsed.data.phone) {
    const { normalized } = normalizePhoneNumber(parsed.data.phone);
    const record = await PhoneOtp.findOne({ phone: normalized }).select("+passwordHash");
    if (!record) {
      return res.status(400).json({ error: "No pending registration found for this phone number." });
    }

    const now = new Date();
    if (record.resendAvailableAt && record.resendAvailableAt > now) {
      const secondsRemaining = Math.ceil((record.resendAvailableAt.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        error: `Please wait ${secondsRemaining} second(s) before requesting a new code.`,
        secondsRemaining
      });
    }

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    record.otpHash = hashPhoneOtp(normalized, rawOtp);
    record.attemptsRemaining = env.otpMaxAttempts;
    record.resendAvailableAt = new Date(Date.now() + env.otpResendCooldownSeconds * 1000);
    record.expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
    await record.save();

    const deliveryResult = await sendOtpSms({
      to: normalized,
      otp: rawOtp,
      name: record.name
    });

    return res.status(200).json({
      status: "otp_resent",
      method: "phone",
      phone: normalized,
      smsDeliveryConfigured: deliveryResult.delivered,
      provider: deliveryResult.provider,
      notice: deliveryResult.notice,
      resendCooldownSeconds: env.otpResendCooldownSeconds
    });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const record = await EmailOtp.findOne({ email }).select("+passwordHash");

  if (!record) {
    return res.status(400).json({
      error: "No pending registration found for this email. Please start signup from the beginning."
    });
  }

  // Enforce resend cooldown
  const now = new Date();
  if (record.resendAvailableAt && record.resendAvailableAt > now) {
    const secondsRemaining = Math.ceil((record.resendAvailableAt.getTime() - now.getTime()) / 1000);
    return res.status(429).json({
      error: `Please wait ${secondsRemaining} second(s) before requesting a new verification code.`,
      secondsRemaining
    });
  }

  // Generate fresh OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(email, rawOtp);

  record.otpHash = otpHash;
  record.attemptsRemaining = env.otpMaxAttempts;
  record.resendAvailableAt = new Date(Date.now() + env.otpResendCooldownSeconds * 1000);
  record.expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
  await record.save();

  const deliveryResult = await sendOtpEmail({
    to: email,
    otp: rawOtp,
    name: record.name
  });

  return res.status(200).json({
    status: "otp_resent",
    method: "email",
    email,
    emailDeliveryConfigured: deliveryResult.delivered,
    provider: deliveryResult.provider,
    notice: deliveryResult.notice,
    resendCooldownSeconds: env.otpResendCooldownSeconds
  });
}));

/**
 * Dedicated phone verification endpoints (for profile & account phone verification)
 */
router.post("/phone/initiate", limiter, requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({
    phone: z.string().trim().min(8).max(20)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid phone number required." });

  const { isValid, normalized, error } = normalizePhoneNumber(parsed.data.phone);
  if (!isValid) return res.status(400).json({ error: error || "Invalid phone number." });

  if (!isSmsConfigured()) {
    return res.status(503).json({
      error: "SMS service is not configured on this server.",
      message: "An automated SMS provider (such as Twilio) is not configured. Telephony credentials must be added to .env."
    });
  }

  // Check if already bound to another active user
  const conflict = await User.findOne({ phone: normalized, _id: { $ne: req.user._id } });
  if (conflict) {
    return res.status(409).json({ error: "This phone number is already registered to another account." });
  }

  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashPhoneOtp(normalized, rawOtp);
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
  const resendAvailableAt = new Date(Date.now() + env.otpResendCooldownSeconds * 1000);

  await PhoneOtp.findOneAndUpdate(
    { phone: normalized },
    {
      userId: req.user._id,
      name: req.user.name,
      otpHash,
      attemptsRemaining: env.otpMaxAttempts,
      resendAvailableAt,
      expiresAt
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const deliveryResult = await sendOtpSms({
    to: normalized,
    otp: rawOtp,
    name: req.user.name
  });

  return res.json({
    status: "phone_otp_initiated",
    phone: normalized,
    delivered: deliveryResult.delivered,
    provider: deliveryResult.provider,
    notice: deliveryResult.notice,
    expiresInMinutes: env.otpExpiryMinutes,
    resendCooldownSeconds: env.otpResendCooldownSeconds
  });
}));

router.post("/phone/verify", limiter, requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({
    phone: z.string().trim().min(8),
    otp: z.string().trim().min(4).max(8)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Phone and verification code are required." });

  const { normalized } = normalizePhoneNumber(parsed.data.phone);
  const record = await PhoneOtp.findOne({ phone: normalized }).select("+otpHash");

  if (!record) {
    return res.status(400).json({ error: "No pending phone verification found or code expired." });
  }

  if (new Date() > record.expiresAt) {
    await PhoneOtp.deleteOne({ _id: record._id });
    return res.status(400).json({ error: "Verification code expired. Please request a new one." });
  }

  if (record.attemptsRemaining <= 0) {
    await PhoneOtp.deleteOne({ _id: record._id });
    return res.status(400).json({ error: "Maximum attempts exceeded. Code has been invalidated." });
  }

  const expectedHash = hashPhoneOtp(normalized, parsed.data.otp);
  let isMatch = false;
  try {
    const bufA = Buffer.from(expectedHash, "hex");
    const bufB = Buffer.from(record.otpHash, "hex");
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      isMatch = true;
    }
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    record.attemptsRemaining -= 1;
    if (record.attemptsRemaining <= 0) {
      await PhoneOtp.deleteOne({ _id: record._id });
      return res.status(400).json({ error: "Incorrect verification code. Maximum attempts exceeded." });
    }
    await record.save();
    return res.status(400).json({ error: `Incorrect verification code. ${record.attemptsRemaining} attempt(s) remaining.` });
  }

  await PhoneOtp.deleteOne({ _id: record._id });

  const user = await User.findById(req.user._id);
  user.phone = normalized;
  user.phoneVerified = true;
  await user.save();

  return res.json({
    status: "verified",
    message: "Phone number verified and bound to account successfully.",
    user: publicUser(user)
  });
}));

router.get("/phone/status", (req, res) => {
  return res.json(getSmsProviderStatus());
});

/**
 * Public provider diagnostics (honest boundary information).
 */
router.get("/email/status", (req, res) => {
  return res.json(getProviderStatus());
});
router.post("/login", limiter, asyncHandler(async (req, res) => {
  const parsed = z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Identifier and password are required." });
  const { identifier, password } = parsed.data;

  const conditions = [
    { email: identifier.toLowerCase() },
    { phone: identifier }
  ];
  const { isValid, normalized } = normalizePhoneNumber(identifier);
  if (isValid && normalized) {
    conditions.push({ phone: normalized });
  }

  const user = await User.findOne({ $or: conditions }).select("+passwordHash");
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
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
