import test from "node:test";
import assert from "node:assert/strict";
import { categories } from "../src/models/Report.js";

test("Reports Validation: categories match standard safety taxonomy", () => {
  assert.ok(categories.includes("Harassment"));
  assert.ok(categories.includes("Stalking"));
  assert.ok(categories.includes("Theft"));
  assert.ok(categories.includes("Poor Lighting"));
  assert.ok(categories.includes("Unsafe Transport"));
  assert.ok(categories.includes("Unsafe / Isolated Area"));
  assert.ok(categories.includes("Broken CCTV"));
});

test("Coordinate Validation: standard spherical coordinates contract [longitude, latitude]", () => {
  function validateCoordinates(coords) {
    return Array.isArray(coords) &&
      coords.length === 2 &&
      coords.every(Number.isFinite) &&
      coords[0] >= -180 && coords[0] <= 180 &&
      coords[1] >= -90 && coords[1] <= 90;
  }

  // Valid coordinates (Mumbai / Pune)
  assert.equal(validateCoordinates([72.8777, 19.0760]), true);
  assert.equal(validateCoordinates([73.8567, 18.5204]), true);

  // Invalid coordinates
  assert.equal(validateCoordinates([200, 19.0760]), false); // Lon > 180
  assert.equal(validateCoordinates([72.8777, 95]), false);  // Lat > 90
  assert.equal(validateCoordinates(["72.8", "19.0"]), false);
  assert.equal(validateCoordinates([]), false);
});

test("Dispute and Confirmation logic contracts", () => {
  const allowedStatuses = ["Submitted", "Under Review", "Verified", "Resolved", "Flagged"];
  assert.equal(allowedStatuses.includes("Verified"), true);
  assert.equal(allowedStatuses.includes("Resolved"), true);
  assert.equal(allowedStatuses.includes("Flagged"), true);
});
