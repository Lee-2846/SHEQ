/**
 * ML Data Collection Service
 * ===========================
 * Manages report eligibility assessment for ML training, dataset registry
 * synchronization, and exposes dataset stats for the admin ML status panel.
 *
 * Design principles:
 * - Reports are NEVER automatically trusted as ground-truth labels.
 * - PII (reporterId) is never included in training feature extraction.
 * - Synthetic demo records are always excluded from real-data training counts.
 * - Eligibility is based on data quality: valid coordinates, non-flagged, non-synthetic.
 * - Moderation status is tracked to distinguish pending vs verified reports.
 * - The minimum threshold for real-data retraining is configurable.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Report from "../models/Report.js";
import MLDatasetRegistry from "../models/MLDatasetRegistry.js";
import MLModelRegistry from "../models/MLModelRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

// Configurable minimum eligible real-data records before retraining is allowed.
// Admin can override via the trigger endpoint.
const DEFAULT_MIN_TRAINING_THRESHOLD = 10;

// Synthetic dataset baseline — matches dataset_pipeline.py
const SYNTHETIC_RECORD_COUNT = 500;

/**
 * Assesses and tags the ML eligibility of a single newly-submitted report.
 * Called non-blockingly after a report is saved to MongoDB.
 * Does NOT modify any other field; only sets mlEligible and mlExcludeReason.
 *
 * Eligibility criteria:
 *  1. sourceType must NOT be "synthetic_demo"
 *  2. Must have valid GeoJSON coordinates [lon, lat]
 *  3. Must NOT have status "Flagged"
 *
 * Note: "Submitted" reports (not yet verified) ARE considered eligible for
 * data collection but are counted separately as "pendingVerification".
 * The dataset pipeline can choose to include or weight them accordingly.
 *
 * @param {string} reportId - MongoDB ObjectId of the saved report
 */
export async function tagReportMLEligibility(reportId) {
  try {
    const report = await Report.findById(reportId)
      .select("sourceType status location mlEligible")
      .lean();

    if (!report) return;

    // Already assessed — don't re-assess unless explicitly requested
    if (report.mlEligible !== null && report.mlEligible !== undefined) return;

    let eligible = true;
    let excludeReason = null;

    // Exclude synthetic demo records
    if (report.sourceType === "synthetic_demo") {
      eligible = false;
      excludeReason = "synthetic_demo";
    }
    // Exclude flagged reports
    else if (report.status === "Flagged") {
      eligible = false;
      excludeReason = "flagged";
    }
    // Exclude reports with missing or invalid coordinates
    else if (
      !report.location?.coordinates ||
      report.location.coordinates.length !== 2 ||
      !report.location.coordinates.every(Number.isFinite)
    ) {
      eligible = false;
      excludeReason = "missing_coordinates";
    }

    await Report.findByIdAndUpdate(reportId, {
      mlEligible: eligible,
      mlExcludeReason: excludeReason
    });
  } catch (err) {
    // Non-critical: log and continue — report was already saved successfully
    console.warn(`[MLDataCollection] Failed to tag eligibility for report ${reportId}:`, err.message);
  }
}

/**
 * Re-assesses ML eligibility for a report whose status has changed
 * (e.g. moderation marked it as Flagged).
 * Called from report moderation route after status update.
 *
 * @param {string} reportId
 * @param {string} newStatus - The updated report status
 */
export async function retagReportOnStatusChange(reportId, newStatus) {
  try {
    if (newStatus === "Flagged") {
      await Report.findByIdAndUpdate(reportId, {
        mlEligible: false,
        mlExcludeReason: "flagged"
      });
    } else {
      // Re-open eligibility for un-flagged reports by resetting to null for re-assessment
      const report = await Report.findById(reportId)
        .select("sourceType status location mlExcludeReason")
        .lean();
      if (report && report.mlExcludeReason === "flagged") {
        // Only reset if the exclusion was specifically due to flagging
        await Report.findByIdAndUpdate(reportId, {
          mlEligible: null,
          mlExcludeReason: null
        });
        // Re-assess
        await tagReportMLEligibility(reportId);
      }
    }
  } catch (err) {
    console.warn(`[MLDataCollection] Failed to retag report ${reportId} on status change:`, err.message);
  }
}

/**
 * Recalculates and persists the current dataset registry stats.
 * Should be called: on server startup, after training, or on admin request.
 *
 * Returns the upserted MLDatasetRegistry document.
 */
export async function refreshDatasetRegistry() {
  try {
    const now = new Date();

    // Count real submitted reports (community + imported)
    const realSubmittedCount = await Report.countDocuments({
      sourceType: { $ne: "synthetic_demo" }
    });

    // Count reports tagged as ML eligible
    const eligibleCount = await Report.countDocuments({
      sourceType: { $ne: "synthetic_demo" },
      mlEligible: true
    });

    // Count reports not yet assessed (mlEligible: null) — these are pending
    const pendingCount = await Report.countDocuments({
      sourceType: { $ne: "synthetic_demo" },
      mlEligible: null,
      status: { $ne: "Flagged" }
    });

    // Count explicitly excluded records
    const excludedCount = await Report.countDocuments({
      sourceType: { $ne: "synthetic_demo" },
      mlEligible: false
    });

    const thresholdMet = eligibleCount >= DEFAULT_MIN_TRAINING_THRESHOLD;

    // Generate a version tag based on real report count + timestamp
    const datasetVersion = `dataset-v1.${realSubmittedCount}-${now.toISOString().slice(0, 10)}`;

    // Upsert — there is only ever one active dataset registry document
    const registry = await MLDatasetRegistry.findOneAndUpdate(
      {},
      {
        $set: {
          datasetVersion,
          syntheticRecordCount: SYNTHETIC_RECORD_COUNT,
          realSubmittedCount,
          eligibleForTrainingCount: eligibleCount,
          pendingVerificationCount: pendingCount,
          excludedRecordCount: excludedCount,
          minimumTrainingThreshold: DEFAULT_MIN_TRAINING_THRESHOLD,
          thresholdMet,
          lastUpdatedAt: now,
          featureSchemaVersion: "v1.0"
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return registry;
  } catch (err) {
    console.error("[MLDataCollection] Failed to refresh dataset registry:", err.message);
    return null;
  }
}

/**
 * Returns the current ML system status for the admin dashboard.
 * Combines: dataset registry, model registry (deployed model), and model artifact metadata.
 *
 * @returns {Object} ML status object safe for API response
 */
export async function getMLSystemStatus() {
  try {
    // Refresh dataset stats
    const registry = await refreshDatasetRegistry();

    // Get deployed model from registry
    const deployedModel = await MLModelRegistry.findOne({ status: "deployed" })
      .sort({ deployedAt: -1 })
      .lean();

    // Get training history (last 5 runs)
    const trainingHistory = await MLModelRegistry.find({})
      .sort({ trainedAt: -1 })
      .limit(5)
      .select("modelVersion status trainedAt syntheticRecordCount realRecordCount metrics usedRealData notes")
      .lean();

    // Model artifact version from the JSON file (what's actually loaded in memory)
    let loadedModelVersion = null;
    let modelLoadStatus = "not_loaded";
    try {
      const { loadModelArtifact } = await import("./mlHotspotInference.js");
      const model = loadModelArtifact();
      if (model) {
        loadedModelVersion = model.metadata?.version || "rf-v1.0-synthetic-demo";
        modelLoadStatus = "loaded";
      }
    } catch {
      modelLoadStatus = "error";
    }

    return {
      modelLoadStatus,
      loadedModelVersion,
      deployedModelVersion: deployedModel?.modelVersion || loadedModelVersion || "rf-v1.0-synthetic-demo",
      deployedAt: deployedModel?.deployedAt || null,
      dataset: registry ? {
        datasetVersion: registry.datasetVersion,
        syntheticRecordCount: registry.syntheticRecordCount,
        realSubmittedCount: registry.realSubmittedCount,
        eligibleForTrainingCount: registry.eligibleForTrainingCount,
        pendingVerificationCount: registry.pendingVerificationCount,
        excludedRecordCount: registry.excludedRecordCount,
        minimumTrainingThreshold: registry.minimumTrainingThreshold,
        thresholdMet: registry.thresholdMet,
        lastUpdatedAt: registry.lastUpdatedAt,
        featureSchemaVersion: registry.featureSchemaVersion
      } : null,
      deployedMetrics: deployedModel?.metrics || null,
      trainingHistory: trainingHistory.map(run => ({
        modelVersion: run.modelVersion,
        status: run.status,
        trainedAt: run.trainedAt,
        syntheticRecordCount: run.syntheticRecordCount,
        realRecordCount: run.realRecordCount,
        usedRealData: run.usedRealData,
        f1Score: run.metrics?.f1Score,
        rocAuc: run.metrics?.rocAuc,
        accuracy: run.metrics?.accuracy,
        notes: run.notes
      })),
      disclaimer: "ML system uses synthetic demonstration data as primary training foundation. Real community reports are collected and tracked for future controlled retraining. No report is automatically treated as confirmed ground-truth."
    };
  } catch (err) {
    console.error("[MLDataCollection] getMLSystemStatus error:", err.message);
    return {
      modelLoadStatus: "error",
      error: err.message,
      disclaimer: "ML status temporarily unavailable."
    };
  }
}

/**
 * Validates that the minimum data threshold is met before training can proceed.
 * Returns { canTrain, reason, eligibleCount, threshold }.
 *
 * @param {number} [overrideThreshold] - Optional admin override
 */
export async function validateTrainingReadiness(overrideThreshold) {
  const threshold = overrideThreshold || DEFAULT_MIN_TRAINING_THRESHOLD;

  const eligibleCount = await Report.countDocuments({
    sourceType: { $ne: "synthetic_demo" },
    mlEligible: true
  });

  if (eligibleCount < threshold) {
    return {
      canTrain: false,
      reason: `Insufficient eligible real-data records. Found ${eligibleCount}, need at least ${threshold}. Training on synthetic data only is also valid but should be explicitly confirmed.`,
      eligibleCount,
      threshold
    };
  }

  return {
    canTrain: true,
    reason: `Threshold met: ${eligibleCount} eligible records (minimum: ${threshold}).`,
    eligibleCount,
    threshold
  };
}

/**
 * Extracts non-identifying training features from a report document.
 * Explicitly excludes: reporterId, description, moderationNote.
 * Used when assembling the real-data training CSV for the Python pipeline.
 *
 * Returns null if the report does not have the required fields for ML use.
 *
 * @param {Object} report - Mongoose lean document
 * @returns {Object|null} Feature record safe for training export
 */
export function extractMLFeatures(report) {
  if (!report || !report.location?.coordinates || report.location.coordinates.length !== 2) {
    return null;
  }

  const [lon, lat] = report.location.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const incidentDate = report.incidentAt || report.createdAt;
  const dt = incidentDate ? new Date(incidentDate) : new Date();
  const hour = dt.getHours();
  const dayofweek = dt.getDay();
  const is_weekend = (dayofweek === 0 || dayofweek === 6) ? 1 : 0;
  const is_night = (hour >= 20 || hour <= 5) ? 1 : 0;

  return {
    // Location features (non-identifying: no address, no label)
    latitude: Math.round(lat * 100000) / 100000,
    longitude: Math.round(lon * 100000) / 100000,
    // Temporal features
    incident_hour: hour,
    dayofweek,
    is_weekend,
    is_night,
    // Report metadata (no PII)
    incident_category: report.category || "Other",
    moderation_status: report.status || "Submitted",
    confirmations: report.confirmations || 0,
    disputes: report.disputes || 0,
    // Source provenance
    sourceType: report.sourceType || "community",
    is_synthetic: false,
    // Internal ID for deduplication (not a PII field)
    report_id: String(report._id)
  };
}

/**
 * Exports all ML-eligible real reports to a CSV file for use in the Python
 * training pipeline. Also writes a manifest JSON sidecar for provenance tracking.
 *
 * Critically:
 * - Excludes all PII (reporterId, description, moderationNote, authorName).
 * - Exports only reports with mlEligible: true and sourceType != "synthetic_demo".
 * - Writes a disclaimer: proxy labels are not scientific ground truth.
 *
 * @returns {{ csvPath, manifestPath, recordCount } | null}
 */
export async function exportEligibleReportsToCSV() {
  try {
    // Query all eligible real reports — no PII fields selected
    const reports = await Report.find({
      sourceType: { $ne: "synthetic_demo" },
      mlEligible: true
    })
      .select("_id category status confirmations disputes location incidentAt createdAt sourceType")
      .lean();

    const records = reports.map(r => extractMLFeatures(r)).filter(Boolean);

    const datasetsDir = path.join(PROJECT_ROOT, "datasets", "geospatial-crime-data");
    // Ensure directory exists (it should, but guard anyway)
    if (!fs.existsSync(datasetsDir)) {
      fs.mkdirSync(datasetsDir, { recursive: true });
    }

    const csvPath = path.join(datasetsDir, "SHEQ_real_reports_export.csv");
    const manifestPath = path.join(datasetsDir, "SHEQ_real_reports_export_manifest.json");

    // Get current dataset registry version for provenance
    const registry = await MLDatasetRegistry.findOne({}).lean();
    const datasetVersion = registry?.datasetVersion || "dataset-v1.0-unknown";

    // Write CSV
    if (records.length === 0) {
      // Write empty CSV with headers only so the pipeline can detect it
      const headers = [
        "report_id", "latitude", "longitude", "incident_hour", "dayofweek",
        "is_weekend", "is_night", "incident_category", "moderation_status",
        "confirmations", "disputes", "sourceType", "is_synthetic"
      ];
      fs.writeFileSync(csvPath, headers.join(",") + "\n", "utf8");
    } else {
      const headers = Object.keys(records[0]);
      const rows = records.map(r =>
        headers.map(h => {
          const v = r[h];
          // Quote strings that may contain commas
          if (typeof v === "string" && (v.includes(",") || v.includes('"'))) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return String(v ?? "");
        }).join(",")
      );
      fs.writeFileSync(csvPath, [headers.join(","), ...rows].join("\n") + "\n", "utf8");
    }

    // Write manifest (provenance sidecar)
    const manifest = {
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      datasetVersion,
      csvPath,
      disclaimer: [
        "This CSV contains community-submitted incident reports from the SHEQ platform.",
        "All PII (reporter ID, description, moderation notes) has been excluded.",
        "Reports are eligible for training data collection but labels (priority_candidate) must be derived by the pipeline using a disclosed proxy strategy.",
        "Proxy label strategy: priority_candidate=1 if (moderation_status='Verified' AND confirmations>=2) OR (confirmations>=3 AND is_night=1 AND disputes=0).",
        "This is a conservative heuristic proxy, NOT a scientifically validated ground truth. Treat all model outputs accordingly.",
        "Do not publish or share this file. It is internal training data only."
      ],
      featureSchema: {
        excluded: ["reporterId", "description", "moderationNote", "authorName", "photoUrl"],
        included: ["latitude", "longitude", "incident_hour", "dayofweek", "is_weekend", "is_night",
                   "incident_category", "moderation_status", "confirmations", "disputes", "sourceType", "is_synthetic", "report_id"]
      }
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    return { csvPath, manifestPath, recordCount: records.length };
  } catch (err) {
    console.error("[MLDataCollection] exportEligibleReportsToCSV failed:", err.message);
    return null;
  }
}

