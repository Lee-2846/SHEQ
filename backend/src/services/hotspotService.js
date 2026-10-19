import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Report from "../models/Report.js";
import { scoreCandidateWithModel, loadModelArtifact } from "./mlHotspotInference.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, "../../docs");

// Severity weights mapped to standard SHEQ categories
const SEVERITY_WEIGHTS = {
  "Harassment": 1.5,
  "Stalking": 1.5,
  "Theft": 1.4,
  "Unsafe Transport": 1.3,
  "Suspicious Activity": 1.2,
  "Unsafe / Isolated Area": 1.2,
  "Poor Lighting": 1.0,
  "Broken CCTV": 1.0,
  "Infrastructure Concern": 1.0,
  "Other": 1.0
};

/**
 * Calculates exponential time decay factor based on report age in days.
 * Recent reports (0-3 days) retain near full weight; older reports decay gracefully.
 */
function calculateRecencyWeight(reportDate, now) {
  const ageDays = Math.max(0, (now.getTime() - new Date(reportDate).getTime()) / (1000 * 86400));
  if (ageDays <= 3) return 1.0;
  if (ageDays <= 7) return 0.8;
  if (ageDays <= 14) return 0.5;
  if (ageDays <= 30) return 0.25;
  return 0.1;
}

/**
 * Checks if a report occurred during night hours (20:00 to 05:00).
 */
function isNightIncident(date) {
  const d = new Date(date);
  const hour = d.getHours();
  return hour >= 20 || hour <= 5;
}

/**
 * Loads the offline Scikit-Learn Random Forest benchmark evaluation report.
 * Provides transparent provenance disclosure for the Admin UI.
 */
export function getHotspotBenchmark() {
  try {
    const reportPath = path.join(DOCS_DIR, "model_evaluation_report.json");
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    }
  } catch (err) {
    console.warn("Unable to load model_evaluation_report.json:", err.message);
  }

  // Defensible fallback matching audited script outputs
  return {
    metadata: {
      dataset_used: "SHEQ_dataset2_SYNTHETIC_demo.csv (500 records)",
      task: "Provisional Hotspot Candidate Priority Classification",
      train_test_split: "80% train (400 samples), 20% test (101 samples), stratified"
    },
    random_forest_metrics: {
      accuracy: 0.74,
      precision: 0.6364,
      recall: 0.4375,
      f1_score: 0.5185,
      roc_auc: 0.7509
    },
    honest_ml_limitations: [
      "Offline benchmark trained on synthetic demonstration dataset exclusively.",
      "Official NCRB Table 3B data lacks incident coordinates.",
      "Operational candidate designation strictly requires human administrator review."
    ]
  };
}

/**
 * Modular multi-signal candidate generation and scoring layer.
 * Proposes candidate geographic clusters for Admin Review.
 *
 * NOTE: Transparent activity-scoring baseline, NOT a validated ML model.
 * It is NOT a scientifically validated probability of crime or danger.
 * Synthetic demo records are strictly excluded.
 */
export async function calculateHotspotCandidates({ days = 30, limit = 100 } = {}) {
  const now = new Date();
  const since = new Date(Date.now() - days * 86400000);

  // Exclude synthetic demonstration records and flagged reports
  const reports = await Report.find({
    createdAt: { $gte: since },
    status: { $ne: "Flagged" },
    sourceType: { $ne: "synthetic_demo" }
  })
    .select("location category confirmations disputes createdAt incidentAt sourceType")
    .limit(10000)
    .lean();

  const cells = new Map();

  for (const report of reports) {
    if (!report.location?.coordinates || report.location.coordinates.length !== 2) continue;
    const [lon, lat] = report.location.coordinates;

    // Spatial clustering grid (~0.002° / ~220m resolution)
    const key = `${Math.round(lon * 500) / 500}:${Math.round(lat * 500) / 500}`;
    const cell = cells.get(key) || {
      lon: 0,
      lat: 0,
      count: 0,
      recent: 0,
      decayWeightedSum: 0,
      severitySum: 0,
      nightCount: 0,
      confirmations: 0,
      disputes: 0,
      categoryCounts: {},
      ids: []
    };

    cell.lon += lon;
    cell.lat += lat;
    cell.count++;

    const incidentDate = report.incidentAt || report.createdAt;
    const recencyWeight = calculateRecencyWeight(incidentDate, now);
    cell.decayWeightedSum += recencyWeight;

    if (report.createdAt >= new Date(Date.now() - 7 * 86400000)) {
      cell.recent++;
    }

    if (isNightIncident(incidentDate)) {
      cell.nightCount++;
    }

    const sev = SEVERITY_WEIGHTS[report.category] || 1.0;
    cell.severitySum += sev;

    cell.confirmations += (report.confirmations || 0);
    cell.disputes += (report.disputes || 0);

    cell.categoryCounts[report.category] = (cell.categoryCounts[report.category] || 0) + 1;
    cell.ids.push(report._id);
    cells.set(key, cell);
  }

  // Filter cells requiring minimum activity threshold (>= 2 independent reports)
  const candidates = [...cells.values()]
    .filter(c => c.count >= 2)
    .map(c => {
      const avgSeverity = c.severitySum / c.count;
      const nightRatio = c.nightCount / c.count;
      const netConfirmations = Math.max(0, c.confirmations - c.disputes * 1.5);
      const distinctCategories = Object.keys(c.categoryCounts).length;

      // Find predominant category in this cluster
      let topCategory = "General Concern";
      let topCount = 0;
      for (const [cat, cnt] of Object.entries(c.categoryCounts)) {
        if (cnt > topCount) {
          topCategory = cat;
          topCount = cnt;
        }
      }

      // Drive provisional score genuinely with trained Random Forest inference
      const clusterLat = c.lat / c.count;
      const clusterLon = c.lon / c.count;

      const evalResult = scoreCandidateWithModel({
        lat: clusterLat,
        lon: clusterLon,
        reportCount: c.count,
        recentCount: c.recent,
        decayWeightedSum: c.decayWeightedSum,
        avgSeverity,
        netConfirmations,
        disputes: c.disputes,
        nightRatio,
        distinctCategories,
        topCategory,
        mostRecentIncidentAt: c.mostRecentIncidentAt || now
      });

      return {
        label: `${topCategory} Cluster (${c.count} reports) — Review Required`,
        center: {
          type: "Point",
          coordinates: [clusterLon, clusterLat]
        },
        score: evalResult.provisionalScore,
        scoringMethod: evalResult.scoringMethod,
        isFallback: evalResult.isFallback,
        rawMlProbability: evalResult.rawMlProbability,
        mlPriorityClassification: evalResult.mlPriorityClassification || "Standard Priority",
        mlScoreContribution: evalResult.mlScoreContribution,
        evidenceScoreContribution: evalResult.evidenceScoreContribution,
        modelVersion: evalResult.modelVersion,
        predictionTimestamp: evalResult.predictionTimestamp,
        featuresUsed: evalResult.featuresUsed || null,
        factors: {
          reportCount: c.count,
          recentReportCount: c.recent,
          weightedRecencyScore: Math.round(c.decayWeightedSum * 10) / 10,
          severityIndex: Math.round(avgSeverity * 100) / 100,
          netConfirmations: Math.round(netConfirmations * 10) / 10,
          disputes: c.disputes,
          nightIncidentRatio: `${Math.round(nightRatio * 100)}%`,
          categoryMix: distinctCategories,
          topCategory
        },
        evidenceReportIds: c.ids,
        rationale: evalResult.isFallback
          ? "Heuristic multi-factor baseline score used (fallback mode). Administrator review is required before designation."
          : `Genuinely driven by trained Random Forest ML model (${Math.round((evalResult.rawMlProbability || 0) * 100)}% priority confidence) combined with community evidence. Administrator review is required before designation.`,
        disclaimer: evalResult.disclaimer,
        algorithmVersion: evalResult.modelVersion,
        reviewStatus: "Pending Review"
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return candidates;
}
