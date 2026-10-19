import { Router } from "express";
import { z } from "zod";
import Escalation from "../models/Escalation.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSms, isSmsConfigured, normalizePhoneNumber } from "../services/smsService.js";
import { env } from "../config/env.js";

const router = Router();

/**
 * GET /api/escalations/sos-status
 * Checks real server-side SMS and WhatsApp provider availability.
 */
router.get("/sos-status", (req, res) => {
  const smsReady = isSmsConfigured();
  const whatsappReady = Boolean(env.whatsappToken && env.whatsappPhoneNumberId);

  return res.json({
    smsProvider: env.smsProvider,
    smsConfigured: smsReady,
    whatsappConfigured: whatsappReady,
    disclaimer: "No direct automated connection to police or municipal emergency dispatch exists unless an official government gateway is integrated. Real alerts are dispatched to user's trusted contacts."
  });
});

/**
 * POST /api/escalations/sos-alert
 * Dispatches real emergency alerts to configured trusted contacts via backend providers.
 */
router.post("/sos-alert", requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().min(0).max(5000).optional()
    }).optional(),
    isStale: z.boolean().default(false),
    contacts: z.array(z.object({
      name: z.string().trim().max(100),
      phone: z.string().trim().min(8).max(25)
    })).min(1, "At least one contact is required to send emergency alerts.")
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid SOS payload.", details: parsed.error.flatten() });
  }

  const { coordinates, isStale, contacts } = parsed.data;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString();

  let locationText = "Location coordinates unavailable";
  let mapsUrl = "";
  if (coordinates) {
    mapsUrl = `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`;
    const stalenessNote = isStale ? " [Cached/Stale GPS]" : "";
    locationText = `Location: ${mapsUrl} (±${coordinates.accuracy || 0}m)${stalenessNote}`;
  }

  const alertMessage = `EMERGENCY SOS from ${req.user.name || "Member"} (${dateStr} ${timeStr}): I need immediate assistance. ${locationText} - Sent via SHEQ Safety Network.`;

  const results = [];
  const smsConfigured = isSmsConfigured();

  // Attempt real provider delivery for each contact
  for (const c of contacts) {
    const { isValid, normalized } = normalizePhoneNumber(c.phone);
    if (!isValid) {
      results.push({
        contact: c.name,
        phone: c.phone,
        channel: "sms",
        delivered: false,
        notice: "Invalid phone number format."
      });
      continue;
    }

    if (smsConfigured) {
      const smsRes = await sendSms({ to: normalized, message: alertMessage });
      results.push({
        contact: c.name,
        phone: normalized,
        channel: "sms",
        delivered: smsRes.delivered,
        provider: smsRes.provider,
        notice: smsRes.notice
      });
    } else {
      results.push({
        contact: c.name,
        phone: normalized,
        channel: "sms",
        delivered: false,
        provider: "unconfigured",
        notice: "Automated SMS provider not configured on backend."
      });
    }
  }

  // Official WhatsApp Business Cloud API Adapter (if credentials configured)
  const whatsappConfigured = Boolean(env.whatsappToken && env.whatsappPhoneNumberId);
  const waResults = [];
  if (whatsappConfigured) {
    for (const c of contacts) {
      const { isValid, normalized } = normalizePhoneNumber(c.phone);
      if (!isValid) continue;

      try {
        const waRes = await fetch(`https://graph.facebook.com/v18.0/${env.whatsappPhoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.whatsappToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalized.replace("+", ""),
            type: "text",
            text: { preview_url: true, body: alertMessage }
          })
        });

        const waData = await waRes.json().catch(() => ({}));
        waResults.push({
          contact: c.name,
          phone: normalized,
          channel: "whatsapp",
          delivered: waRes.ok,
          notice: waRes.ok ? "Delivered via WhatsApp Cloud API" : (waData.error?.message || "WhatsApp delivery failed")
        });
      } catch (err) {
        waResults.push({
          contact: c.name,
          phone: normalized,
          channel: "whatsapp",
          delivered: false,
          notice: `WhatsApp network error: ${err.message}`
        });
      }
    }
  }

  // Record internal incident escalation for audit & follow-up
  try {
    await Escalation.create({
      title: `Emergency SOS Alert — ${req.user.name || "Member"}`,
      summary: alertMessage,
      locationLabel: coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : "No GPS",
      category: "Emergency SOS",
      evidenceContext: `Contacts targeted: ${contacts.map(c => `${c.name} (${c.phone})`).join(", ")}`,
      adminNotes: `SMS Delivered: ${results.filter(r => r.delivered).length}/${results.length}. WhatsApp: ${waResults.filter(r => r.delivered).length}/${waResults.length}`,
      status: "prepared_for_external_escalation",
      createdBy: req.user._id
    });
  } catch (err) {
    console.warn("Unable to save escalation record:", err.message);
  }

  const allDeliveredCount = results.filter(r => r.delivered).length;
  const anyDelivered = allDeliveredCount > 0;

  return res.json({
    status: anyDelivered ? "alerts_sent" : "delivery_unconfigured",
    message: anyDelivered
      ? `Emergency alerts delivered to ${allDeliveredCount} contact(s) via automated SMS.`
      : "Automated server providers are not configured. Use device messenger fallbacks.",
    smsConfigured,
    whatsappConfigured,
    results,
    whatsappResults: waResults,
    alertMessage,
    mapsUrl,
    fallbackUrls: {
      prefilledSms: `sms:${contacts.map(c => c.phone).join(",")}?body=${encodeURIComponent(alertMessage)}`,
      prefilledWhatsapp: `https://wa.me/?text=${encodeURIComponent(alertMessage)}`
    }
  });
}));

// Administrative escalation routes
router.get("/", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  return res.json({ escalations: await Escalation.find().sort({ createdAt: -1 }).limit(200).lean() });
}));

router.post("/", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({
    title: z.string().trim().min(3).max(250),
    summary: z.string().trim().min(5).max(5000),
    reportIds: z.array(z.string()).max(100).default([]),
    locationLabel: z.string().max(250).optional(),
    category: z.string().max(100).optional(),
    evidenceContext: z.string().max(5000).optional(),
    adminNotes: z.string().max(5000).optional()
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid escalation record.", details: parsed.error.flatten() });
  const escalation = await Escalation.create({ ...parsed.data, createdBy: req.user._id });
  return res.status(201).json({ escalation });
}));

router.patch("/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({
    status: z.enum(["draft", "under_review", "prepared_for_external_escalation", "closed"]).optional(),
    adminNotes: z.string().max(5000).optional()
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Invalid update." });
  const escalation = await Escalation.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!escalation) return res.status(404).json({ error: "Escalation not found." });
  return res.json({ escalation });
}));

export default router;
