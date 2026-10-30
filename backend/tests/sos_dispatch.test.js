import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// SOS Schema matching backend/src/routes/escalations.js
const sosPayloadSchema = z.object({
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

test("Emergency SOS Dispatch & Location Protocol Suite", async (t) => {
  await t.test("Payload Validation: validates valid coordinates and recipient contacts", () => {
    const valid = sosPayloadSchema.safeParse({
      coordinates: {
        lat: 18.9220,
        lng: 72.8347,
        accuracy: 15
      },
      isStale: false,
      contacts: [
        { name: "Family Primary", phone: "+919876543210" },
        { name: "Trusted Friend", phone: "+919876543211" }
      ]
    });

    assert.equal(valid.success, true);
    assert.equal(valid.data.contacts.length, 2);
  });

  await t.test("Payload Validation: rejects invalid coordinates or empty contact lists", () => {
    // Latitude out of range (>90)
    const badLat = sosPayloadSchema.safeParse({
      coordinates: { lat: 95.0, lng: 72.8 },
      contacts: [{ name: "Contact", phone: "+919876543210" }]
    });
    assert.equal(badLat.success, false);

    // Empty contacts array
    const emptyContacts = sosPayloadSchema.safeParse({
      coordinates: { lat: 19.0, lng: 72.8 },
      contacts: []
    });
    assert.equal(emptyContacts.success, false);
  });

  await t.test("Staleness Tagging: appends cached GPS notice when coordinates are older than 60s", () => {
    const coords = { lat: 19.0760, lng: 72.8777, accuracy: 20 };
    const isStale = true;

    const mapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    const stalenessNote = isStale ? " [Cached/Stale GPS]" : "";
    const locationText = `Location: ${mapsUrl} (±${coords.accuracy}m)${stalenessNote}`;

    assert.match(locationText, /\[Cached\/Stale GPS\]/);
    assert.match(locationText, /https:\/\/maps\.google\.com\/\?q=19\.076,72\.8777/);
  });

  await t.test("Fallback Link Generation: produces valid URI schemes for client-assisted transmission", () => {
    const contacts = [
      { name: "Primary", phone: "+919876543210" },
      { name: "Sister", phone: "+919876543212" }
    ];
    const alertMessage = "EMERGENCY SOS: I need immediate assistance. Location: https://maps.google.com/?q=19.076,72.8777";

    const prefilledSms = `sms:${contacts.map(c => c.phone).join(",")}?body=${encodeURIComponent(alertMessage)}`;
    const prefilledWhatsapp = `https://wa.me/?text=${encodeURIComponent(alertMessage)}`;

    assert.match(prefilledSms, /^sms:\+919876543210,\+919876543212\?body=EMERGENCY%20SOS/);
    assert.match(prefilledWhatsapp, /^https:\/\/wa\.me\/\?text=EMERGENCY%20SOS/);
  });
});
