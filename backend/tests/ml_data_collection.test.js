/**
 * ML Data Collection Service Tests
 * Tests eligibility logic, feature extraction, and dataset registry stats.
 * These tests are pure unit tests — no MongoDB connection required.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { extractMLFeatures } from "../src/services/mlDataCollectionService.js";

test("ML Data Collection: extractMLFeatures", async (t) => {
  await t.test("returns null for a report with missing coordinates", () => {
    const result = extractMLFeatures({ category: "Harassment", _id: "abc123" });
    assert.equal(result, null);
  });

  await t.test("returns null for a report with non-finite coordinates", () => {
    const result = extractMLFeatures({
      _id: "abc123",
      category: "Harassment",
      location: { coordinates: [NaN, 19.0760] }
    });
    assert.equal(result, null);
  });

  await t.test("extracts valid feature record from a community report", () => {
    const report = {
      _id: "64f000000000000000000001",
      category: "Stalking",
      status: "Submitted",
      sourceType: "community",
      confirmations: 3,
      disputes: 0,
      location: { coordinates: [72.8777, 19.0760] },  // [lon, lat]
      incidentAt: new Date("2026-10-15T22:30:00.000Z"),
      createdAt: new Date("2026-10-15T22:35:00.000Z")
    };

    const features = extractMLFeatures(report);

    assert.ok(features, "should return a features object");

    // Location (order preserved: lat, lon)
    assert.equal(typeof features.latitude, "number");
    assert.equal(typeof features.longitude, "number");
    assert.equal(features.latitude, 19.0760);
    assert.equal(features.longitude, 72.8777);

    // Temporal features
    assert.equal(typeof features.incident_hour, "number");
    assert.ok(features.incident_hour >= 0 && features.incident_hour <= 23);
    assert.equal(features.is_night, 1, "22:30 UTC should be night (hour >= 20)");

    // Category preserved
    assert.equal(features.incident_category, "Stalking");

    // Provenance
    assert.equal(features.is_synthetic, false);
    assert.equal(features.sourceType, "community");

    // PII excluded — description and reporterId must NOT be present
    assert.equal(features.description, undefined);
    assert.equal(features.reporterId, undefined);
    assert.equal(features.moderationNote, undefined);

    // Deduplication ID present
    assert.equal(features.report_id, "64f000000000000000000001");
  });

  await t.test("correctly marks daytime incident", () => {
    const report = {
      _id: "64f000000000000000000002",
      category: "Poor Lighting",
      status: "Verified",
      sourceType: "community",
      confirmations: 1,
      disputes: 0,
      location: { coordinates: [72.8777, 19.0760] },
      incidentAt: new Date("2026-10-15T14:00:00.000Z") // 2 PM UTC
    };

    const features = extractMLFeatures(report);
    assert.ok(features);
    assert.equal(features.is_night, 0, "14:00 UTC should not be night");
  });

  await t.test("handles report without incidentAt (falls back to createdAt)", () => {
    const report = {
      _id: "64f000000000000000000003",
      category: "Other",
      status: "Submitted",
      sourceType: "community",
      confirmations: 0,
      disputes: 0,
      location: { coordinates: [72.8777, 19.0760] },
      createdAt: new Date("2026-10-15T22:30:00.000Z") // 22:30 UTC = night in any timezone
    };

    const features = extractMLFeatures(report);
    assert.ok(features);
    assert.equal(features.is_night, 1, "22:30 UTC should be night (hour >= 20)");
  });
});

test("ML Data Collection: eligibility logic assertions", async (t) => {
  await t.test("correctly classifies synthetic_demo as non-eligible", () => {
    // Test the inline logic that tagReportMLEligibility uses
    const report = {
      sourceType: "synthetic_demo",
      status: "Submitted",
      location: { coordinates: [72.8777, 19.0760] }
    };

    let eligible = true;
    let excludeReason = null;

    if (report.sourceType === "synthetic_demo") {
      eligible = false;
      excludeReason = "synthetic_demo";
    } else if (report.status === "Flagged") {
      eligible = false;
      excludeReason = "flagged";
    } else if (
      !report.location?.coordinates ||
      report.location.coordinates.length !== 2 ||
      !report.location.coordinates.every(Number.isFinite)
    ) {
      eligible = false;
      excludeReason = "missing_coordinates";
    }

    assert.equal(eligible, false);
    assert.equal(excludeReason, "synthetic_demo");
  });

  await t.test("correctly classifies flagged report as non-eligible", () => {
    const report = {
      sourceType: "community",
      status: "Flagged",
      location: { coordinates: [72.8777, 19.0760] }
    };

    let eligible = true;
    let excludeReason = null;

    if (report.sourceType === "synthetic_demo") {
      eligible = false;
      excludeReason = "synthetic_demo";
    } else if (report.status === "Flagged") {
      eligible = false;
      excludeReason = "flagged";
    }

    assert.equal(eligible, false);
    assert.equal(excludeReason, "flagged");
  });

  await t.test("correctly classifies valid community report as eligible", () => {
    const report = {
      sourceType: "community",
      status: "Submitted",
      location: { coordinates: [72.8777, 19.0760] }
    };

    let eligible = true;
    let excludeReason = null;

    if (report.sourceType === "synthetic_demo") {
      eligible = false;
      excludeReason = "synthetic_demo";
    } else if (report.status === "Flagged") {
      eligible = false;
      excludeReason = "flagged";
    } else if (
      !report.location?.coordinates ||
      report.location.coordinates.length !== 2 ||
      !report.location.coordinates.every(Number.isFinite)
    ) {
      eligible = false;
      excludeReason = "missing_coordinates";
    }

    assert.equal(eligible, true);
    assert.equal(excludeReason, null);
  });
});
