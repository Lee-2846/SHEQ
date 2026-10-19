import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, "../../docs");
const PROJECT_ROOT = path.resolve(__dirname, "../../../");

let cachedModel = null;
let policeStationCoords = null;
let streetlightCoords = null;

/**
 * Calculates great-circle haversine distance between two coordinates in kilometers.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Loads infrastructure coordinates from GeoJSON files for spatial feature engineering.
 */
function loadInfrastructureCoords() {
  if (policeStationCoords && streetlightCoords) {
    return { policeStationCoords, streetlightCoords };
  }

  policeStationCoords = [];
  streetlightCoords = [];

  try {
    const psPath = path.join(
      PROJECT_ROOT,
      "datasets",
      "infrastructure-data",
      "mumbai_navi_mumbai_police_stations_expanded.geojson"
    );
    if (fs.existsSync(psPath)) {
      const psData = JSON.parse(fs.readFileSync(psPath, "utf-8"));
      for (const f of psData.features || []) {
        if (f.geometry?.type === "Point" && f.geometry.coordinates?.length >= 2) {
          policeStationCoords.push([f.geometry.coordinates[1], f.geometry.coordinates[0]]); // [lat, lon]
        }
      }
    }
  } catch (err) {
    console.warn("Could not load police station GeoJSON:", err.message);
  }

  try {
    const slPath = path.join(
      PROJECT_ROOT,
      "datasets",
      "infrastructure-data",
      "mumbai_navi_mumbai_streetlights_expanded.geojson"
    );
    if (fs.existsSync(slPath)) {
      const slData = JSON.parse(fs.readFileSync(slPath, "utf-8"));
      for (const f of slData.features || []) {
        if (f.geometry?.type === "Point" && f.geometry.coordinates?.length >= 2) {
          streetlightCoords.push([f.geometry.coordinates[1], f.geometry.coordinates[0]]); // [lat, lon]
        }
      }
    }
  } catch (err) {
    console.warn("Could not load streetlight GeoJSON:", err.message);
  }

  return { policeStationCoords, streetlightCoords };
}

/**
 * Calculates nearest infrastructure distances in kilometers for candidate coordinates.
 */
export function calculateInfrastructureProximities(lat, lon) {
  const { policeStationCoords: ps, streetlightCoords: sl } = loadInfrastructureCoords();

  let minPs = 1.0;
  if (ps && ps.length > 0) {
    minPs = Math.min(...ps.map(([plat, plon]) => haversineKm(lat, lon, plat, plon)));
  }

  let minSl = 0.5;
  if (sl && sl.length > 0) {
    // Sample search every 3rd light for efficiency matching training pipeline
    const sampled = sl.filter((_, i) => i % 3 === 0);
    minSl = Math.min(...sampled.map(([slat, slon]) => haversineKm(lat, lon, slat, slon)));
  }

  return {
    distNearestPoliceKm: Math.round(minPs * 1000) / 1000,
    distNearestStreetlightKm: Math.round(minSl * 1000) / 1000
  };
}

/**
 * Loads the trained Random Forest model artifact.
 * Verifies tree structure integrity and feature order.
 */
export function loadModelArtifact() {
  if (cachedModel) return cachedModel;

  try {
    const modelPath = path.join(DOCS_DIR, "hotspot_rf_model.json");
    if (fs.existsSync(modelPath)) {
      const raw = fs.readFileSync(modelPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.trees && parsed.trees.length > 0 && Array.isArray(parsed.feature_names)) {
        cachedModel = parsed;
        return cachedModel;
      }
    }
  } catch (err) {
    console.warn("Unable to load hotspot_rf_model.json:", err.message);
  }

  return null;
}

/**
 * Maps a single decision tree traversal for a given feature vector.
 */
function evaluateDecisionTree(tree, features) {
  let node = 0;
  while (tree.children_left[node] !== -1 && tree.children_right[node] !== -1) {
    const featIdx = tree.feature[node];
    const threshold = tree.threshold[node];
    const val = features[featIdx];

    if (val <= threshold) {
      node = tree.children_left[node];
    } else {
      node = tree.children_right[node];
    }
  }

  // Leaf node distribution [count_class_0, count_class_1]
  const valArray = tree.value[node];
  const counts = Array.isArray(valArray[0]) ? valArray[0] : valArray;
  const c0 = counts[0] || 0;
  const c1 = counts[1] || 0;
  const total = c0 + c1;
  return total > 0 ? c1 / total : 0;
}

/**
 * Evaluates the trained Random Forest ensemble on the candidate feature vector.
 *
 * @param {Array<number>} features - Vector of features in exact training order:
 * [latitude, longitude, hour, dayofweek, is_weekend, is_night,
 *  dist_nearest_police_km, dist_nearest_streetlight_km,
 *  cat_poor_lighting_concern, cat_stalking, cat_unsafe_public_area, cat_verbal_harassment]
 * @returns {number} Predicted probability of class 1 (High-Priority Candidate)
 */
export function predictProbability(features) {
  const model = loadModelArtifact();
  if (!model || !model.trees || model.trees.length === 0) {
    throw new Error("Trained Random Forest model artifact is not loaded.");
  }

  if (features.length !== model.feature_names.length) {
    throw new Error(
      `Feature length mismatch: expected ${model.feature_names.length} features, got ${features.length}.`
    );
  }

  let sum = 0;
  for (const tree of model.trees) {
    sum += evaluateDecisionTree(tree, features);
  }

  return Math.round((sum / model.trees.length) * 10000) / 10000;
}

/**
 * Maps live SHEQ incident categories and cluster metadata to the exact 12 features
 * required by the trained Random Forest model.
 *
 * @param {Object} clusterData
 * @returns {{ features: Array<number>, featureNames: Array<string>, featureBreakdown: Object }}
 */
export function buildFeatureVector({
  lat,
  lon,
  hour = 21,
  dayOfWeek = 5,
  isWeekend = 0,
  isNight = 1,
  category = "Harassment",
  distNearestPoliceKm,
  distNearestStreetlightKm
}) {
  const model = loadModelArtifact();
  const featureNames = model?.feature_names || [
    "latitude",
    "longitude",
    "hour",
    "dayofweek",
    "is_weekend",
    "is_night",
    "dist_nearest_police_km",
    "dist_nearest_streetlight_km",
    "cat_poor_lighting_concern",
    "cat_stalking",
    "cat_unsafe_public_area",
    "cat_verbal_harassment"
  ];

  // If spatial proximity not supplied, calculate from infrastructure GeoJSON
  let pDist = distNearestPoliceKm;
  let sDist = distNearestStreetlightKm;
  if (pDist === undefined || sDist === undefined) {
    const proximities = calculateInfrastructureProximities(lat, lon);
    pDist = proximities.distNearestPoliceKm;
    sDist = proximities.distNearestStreetlightKm;
  }

  // Explicit, documented category mapping to training dummy features:
  // - "Poor Lighting" -> cat_poor_lighting_concern: 1
  // - "Stalking" -> cat_stalking: 1
  // - "Unsafe / Isolated Area" -> cat_unsafe_public_area: 1
  // - "Harassment" / "Verbal Harassment" -> cat_verbal_harassment: 1
  // - Other categories -> 0 for all dummies (matches reference baseline)
  let cat_poor_lighting_concern = 0;
  let cat_stalking = 0;
  let cat_unsafe_public_area = 0;
  let cat_verbal_harassment = 0;

  const catLower = (category || "").toLowerCase();
  if (catLower.includes("lighting")) {
    cat_poor_lighting_concern = 1;
  } else if (catLower.includes("stalking")) {
    cat_stalking = 1;
  } else if (catLower.includes("isolated") || catLower.includes("unsafe") || catLower.includes("area")) {
    cat_unsafe_public_area = 1;
  } else if (catLower.includes("verbal")) {
    cat_verbal_harassment = 1;
  } else if (catLower.includes("harassment")) {
    // Standard Harassment mapped to baseline/verbal harassment
    cat_verbal_harassment = 1;
  }

  const features = [
    lat,
    lon,
    hour,
    dayOfWeek,
    isWeekend ? 1 : 0,
    isNight ? 1 : 0,
    pDist,
    sDist,
    cat_poor_lighting_concern,
    cat_stalking,
    cat_unsafe_public_area,
    cat_verbal_harassment
  ];

  const featureBreakdown = {
    latitude: lat,
    longitude: lon,
    hour,
    dayOfWeek,
    isWeekend: Boolean(isWeekend),
    isNight: Boolean(isNight),
    distNearestPoliceKm: pDist,
    distNearestStreetlightKm: sDist,
    categoryOneHot: {
      cat_poor_lighting_concern,
      cat_stalking,
      cat_unsafe_public_area,
      cat_verbal_harassment
    }
  };

  return { features, featureNames, featureBreakdown };
}

/**
 * Scores a live hotspot candidate by running genuine inference through the trained Random Forest model.
 * If the model is absent or inference fails, falls back safely to explainable rule scoring.
 *
 * Scoring Normalization Method (Documented & Configurable):
 * Total Provisional Score (0-100) = ML Component (up to 50 pts) + Community Evidence Component (up to 50 pts)
 * - ML Component: rawMlProbability (0.0 to 1.0) * 50
 * - Community Evidence Component: Volume (up to 20) + Recency (up to 15) + Net Confirmations (up to 15)
 *
 * @param {Object} candidateCluster
 * @returns {Object} Enriched scoring evaluation
 */
export function scoreCandidateWithModel({
  lat,
  lon,
  reportCount,
  recentCount,
  decayWeightedSum,
  avgSeverity,
  netConfirmations,
  disputes,
  nightRatio,
  distinctCategories,
  topCategory,
  mostRecentIncidentAt
}) {
  const model = loadModelArtifact();
  const d = mostRecentIncidentAt ? new Date(mostRecentIncidentAt) : new Date();
  const hour = d.getHours();
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
  const isNight = hour >= 20 || hour <= 5 ? 1 : 0;

  // Evidence component (0 to 50 scale)
  const volumePoints = Math.min(20, reportCount * 2.5);
  const recencyPoints = Math.min(15, (decayWeightedSum || reportCount) * 3.0);
  const confirmationPoints = Math.min(15, Math.max(0, netConfirmations) * 1.5);
  const evidenceScore = Math.round(volumePoints + recencyPoints + confirmationPoints);

  if (!model) {
    // Graceful rule-based fallback mode
    const severityPoints = Math.min(20, (avgSeverity - 1.0) * 35);
    const nightPoints = nightRatio * 15;
    const fallbackScore = Math.min(
      100,
      Math.max(0, Math.round(volumePoints * 1.5 + recencyPoints * 1.5 + confirmationPoints + severityPoints + nightPoints))
    );

    return {
      provisionalScore: fallbackScore,
      scoringMethod: "rule-based-fallback",
      isFallback: true,
      rawMlProbability: null,
      mlScoreContribution: 0,
      evidenceScoreContribution: fallbackScore,
      modelVersion: "heuristic-multisignal-fallback",
      predictionTimestamp: new Date().toISOString(),
      disclaimer: "Model artifact not loaded; scoring generated via explainable multi-signal heuristic fallback. Admin review required before designation."
    };
  }

  try {
    const { features, featureBreakdown } = buildFeatureVector({
      lat,
      lon,
      hour,
      dayOfWeek,
      isWeekend,
      isNight,
      category: topCategory
    });

    const rawMlProbability = predictProbability(features);
    const mlScoreContribution = Math.round(rawMlProbability * 50 * 10) / 10;
    const finalScore = Math.min(100, Math.max(0, Math.round(mlScoreContribution + evidenceScore)));

    return {
      provisionalScore: finalScore,
      scoringMethod: "ml-random-forest-v1",
      isFallback: false,
      rawMlProbability,
      mlPriorityClassification: rawMlProbability >= 0.5 ? "High Priority" : "Standard Priority",
      mlScoreContribution,
      evidenceScoreContribution: evidenceScore,
      modelVersion: model.metadata.version || "rf-v1.0-synthetic-demo",
      predictionTimestamp: new Date().toISOString(),
      featuresUsed: featureBreakdown,
      disclaimer: "Trained on synthetic demonstration coordinates (SHEQ_dataset2_SYNTHETIC_demo.csv). Does not represent scientific validation of real-world crime. Mandatory administrator review required before designation."
    };
  } catch (err) {
    console.warn("ML inference error; falling back to heuristic scoring:", err.message);

    const severityPoints = Math.min(20, (avgSeverity - 1.0) * 35);
    const nightPoints = nightRatio * 15;
    const fallbackScore = Math.min(
      100,
      Math.max(0, Math.round(volumePoints * 1.5 + recencyPoints * 1.5 + confirmationPoints + severityPoints + nightPoints))
    );

    return {
      provisionalScore: fallbackScore,
      scoringMethod: "rule-based-fallback",
      isFallback: true,
      rawMlProbability: null,
      mlScoreContribution: 0,
      evidenceScoreContribution: fallbackScore,
      modelVersion: "heuristic-fallback-on-error",
      predictionTimestamp: new Date().toISOString(),
      disclaimer: `Inference failed (${err.message}); scored via explainable heuristic fallback. Admin review required.`
    };
  }
}
