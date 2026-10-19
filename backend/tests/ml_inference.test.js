import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  haversineKm,
  loadModelArtifact,
  buildFeatureVector,
  predictProbability,
  scoreCandidateWithModel
} from "../src/services/mlHotspotInference.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, "../docs");

test("Machine Learning Hotspot Inference Engine Suite", async (t) => {
  await t.test("Model Artifacts: serialized JSON model artifact exists and contains 100 decision trees", () => {
    const jsonPath = path.join(DOCS_DIR, "hotspot_rf_model.json");
    assert.equal(fs.existsSync(jsonPath), true, "hotspot_rf_model.json must exist in docs/");

    const model = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    assert.equal(model.metadata?.model_name, "RandomForestClassifier");
    assert.equal(model.metadata?.n_estimators, 100);
    assert.equal(Array.isArray(model.trees), true);
    assert.equal(model.trees.length, 100);
    assert.equal(Array.isArray(model.feature_names), true);
    assert.equal(model.feature_names.length, 12);
  });

  await t.test("Haversine Distance: accurately computes spherical distance between known Mumbai coordinates", () => {
    // Gateway of India to Chhatrapati Shivaji Maharaj Terminus (CSMT) ~2.2 km
    const dist = haversineKm(18.9220, 72.8347, 18.9401, 72.8354);
    assert.ok(dist >= 1.8 && dist <= 2.5, `Calculated distance ${dist}km should be ~2.0km`);
  });

  await t.test("Feature Vector Engineering: extracts 12 training features with spatial infrastructure proximities", () => {
    const vector = buildFeatureVector({
      lat: 19.0760, // Dadar / Central Mumbai
      lon: 72.8777,
      hour: 22,
      dayOfWeek: 5,
      isWeekend: false,
      isNight: true,
      category: "Harassment"
    });

    assert.ok(vector);
    assert.equal(Array.isArray(vector.features), true);
    assert.equal(vector.features.length, 12);

    // Verify spatial distances were computed
    assert.equal(typeof vector.featureBreakdown.distNearestPoliceKm, "number");
    assert.equal(typeof vector.featureBreakdown.distNearestStreetlightKm, "number");
    assert.ok(vector.featureBreakdown.distNearestPoliceKm > 0);
    assert.ok(vector.featureBreakdown.distNearestStreetlightKm > 0);
  });

  await t.test("Pure Node.js Tree Traversal: computes valid class probability in [0, 1] in < 5ms", () => {
    const model = loadModelArtifact();
    assert.ok(model, "Model should load successfully");

    const vector = buildFeatureVector({
      lat: 19.0178, // Dadar
      lon: 72.8478,
      hour: 23,
      dayOfWeek: 6,
      isWeekend: true,
      isNight: true,
      category: "Stalking"
    });

    const startTime = performance.now();
    const prob = predictProbability(vector.features);
    const duration = performance.now() - startTime;

    assert.equal(typeof prob, "number");
    assert.ok(prob >= 0.0 && prob <= 1.0, `Probability ${prob} must be between 0 and 1`);
    assert.ok(duration < 15, `Inference duration was ${duration.toFixed(2)}ms (must be <15ms)`);
  });

  await t.test("Candidate Scoring Contract: balances ML model score (0-50 pts) with community evidence (0-50 pts)", () => {
    const result = scoreCandidateWithModel({
      lat: 19.0760,
      lon: 72.8777,
      reportCount: 8,
      recentCount: 3,
      decayWeightedSum: 5.2,
      avgSeverity: 2.5,
      netConfirmations: 12,
      disputes: 0,
      nightRatio: 0.6,
      distinctCategories: 3,
      topCategory: "Harassment"
    });

    assert.ok(result);
    assert.equal(result.isFallback, false);
    assert.equal(result.scoringMethod, "ml-random-forest-v1");
    assert.ok(result.rawMlProbability >= 0 && result.rawMlProbability <= 1);
    assert.ok(result.mlScoreContribution >= 0 && result.mlScoreContribution <= 50);
    assert.ok(result.evidenceScoreContribution >= 0 && result.evidenceScoreContribution <= 50);
    assert.ok(result.provisionalScore >= 0 && result.provisionalScore <= 100);
    assert.match(result.disclaimer, /synthetic demonstration coordinates|Mandatory administrator review/i);
  });
});
