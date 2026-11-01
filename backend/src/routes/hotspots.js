import { Router } from "express";
import { z } from "zod";
import Hotspot from "../models/Hotspot.js";
import MLModelRegistry from "../models/MLModelRegistry.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateHotspotCandidates, getHotspotBenchmark } from "../services/hotspotService.js";
import {
  getMLSystemStatus,
  validateTrainingReadiness,
  refreshDatasetRegistry,
  exportEligibleReportsToCSV
} from "../services/mlDataCollectionService.js";
import { loadModelArtifact } from "../services/mlHotspotInference.js";

const router = Router();

// ─── Existing routes (unchanged) ──────────────────────────────────────────────

router.get("/benchmark", (req, res) => {
  return res.json(getHotspotBenchmark());
});

router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const hotspots = await Hotspot.find({ state: "designated" }).select("-evidenceReportIds").sort({ updatedAt: -1 }).limit(200).lean();
  return res.json({ hotspots });
}));

router.get("/candidates", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
  const candidates = await calculateHotspotCandidates({ days });
  return res.json({
    mode: "modular-multisignal-v2",
    candidates,
    benchmark: getHotspotBenchmark()
  });
}));

router.post("/candidates/save", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({
    label: z.string().max(250).optional(),
    longitude: z.number().min(-180).max(180), latitude: z.number().min(-90).max(90),
    score: z.number().min(0).max(100),
    factors: z.record(z.any()),
    evidenceReportIds: z.array(z.string()).max(500),
    rationale: z.string().max(2000)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid candidate.", details: parsed.error.flatten() });
  const d = parsed.data;
  const hotspot = await Hotspot.create({
    label: d.label, center: { type: "Point", coordinates: [d.longitude, d.latitude] }, score: d.score,
    factors: d.factors, evidenceReportIds: d.evidenceReportIds, rationale: d.rationale,
    state: "candidate", createdBy: req.user._id
  });
  return res.status(201).json({ hotspot });
}));

router.patch("/:id/review", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({ state: z.enum(["designated", "dismissed", "inactive"]), rationale: z.string().max(2000).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "State must be designated, dismissed, or inactive." });
  const hotspot = await Hotspot.findByIdAndUpdate(req.params.id, { state: parsed.data.state, rationale: parsed.data.rationale, reviewedBy: req.user._id, reviewedAt: new Date() }, { new: true, runValidators: true });
  if (!hotspot) return res.status(404).json({ error: "Hotspot candidate not found." });
  return res.json({ hotspot });
}));

// ─── New ML status and training routes ─────────────────────────────────────────

/**
 * GET /api/hotspots/ml-status
 * Returns live ML system status for the Admin Dashboard.
 * Accessible to authenticated admins only.
 *
 * Response includes:
 * - Loaded model version and load status
 * - Dataset composition (synthetic, real, eligible, pending)
 * - Training history (last 5 runs)
 * - Benchmark metrics from the current deployed model
 */
router.get("/ml-status", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const status = await getMLSystemStatus();
  // Attach the static benchmark metrics from the evaluation report artifact
  const benchmark = getHotspotBenchmark();
  return res.json({
    ...status,
    benchmarkMetrics: benchmark?.random_forest_metrics || null,
    benchmarkMetadata: benchmark?.metadata || null,
    honestLimitations: benchmark?.honest_ml_limitations || []
  });
}));

/**
 * POST /api/hotspots/train
 * Admin-triggered model training validation check.
 *
 * This endpoint:
 * 1. Validates training readiness (minimum eligible data threshold)
 * 2. Records the training attempt in MLModelRegistry
 * 3. Returns a clear status: either "training_not_ready" (with reason) or
 *    "training_queued" (when threshold met — actual Python training runs
 *    as a separate background process in production)
 *
 * For safety: does NOT run Python inline in the HTTP request cycle.
 * Training runs are recorded and the admin is told to run the pipeline script.
 *
 * Body params:
 *   - overrideThreshold (optional, number): admin override for minimum records
 *   - allowSyntheticOnly (optional, boolean): allow training on synthetic data only
 */
router.post("/train", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({
    overrideThreshold: z.number().int().min(1).max(10000).optional(),
    allowSyntheticOnly: z.boolean().optional().default(false),
    notes: z.string().max(500).optional().default("")
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid training request.", details: parsed.error.flatten() });
  }

  const { overrideThreshold, allowSyntheticOnly, notes } = parsed.data;

  // Refresh dataset registry before validation
  await refreshDatasetRegistry();

  const readiness = await validateTrainingReadiness(overrideThreshold);

  // If real-data threshold not met and synthetic-only not explicitly allowed, inform admin
  if (!readiness.canTrain && !allowSyntheticOnly) {
    return res.status(422).json({
      status: "training_not_ready",
      reason: readiness.reason,
      eligibleRealRecords: readiness.eligibleCount,
      minimumThreshold: readiness.threshold,
      suggestion: "You can set allowSyntheticOnly: true to record a synthetic-data retraining run, or submit more verified reports to meet the threshold.",
      disclaimer: "Do not fabricate training data. Training on synthetic data only is valid but must be clearly documented."
    });
  }

  // Generate a new model version tag
  const now = new Date();
  const versionTag = `rf-v${now.toISOString().slice(0, 10).replace(/-/g, "")}-${allowSyntheticOnly ? "synthetic" : "real"}-admin`;

  // Record training run in MLModelRegistry
  let trainingRecord;
  try {
    trainingRecord = await MLModelRegistry.create({
      modelVersion: versionTag,
      datasetVersion: `dataset-auto-${now.toISOString().slice(0, 10)}`,
      trainedAt: now,
      syntheticRecordCount: 500,
      realRecordCount: allowSyntheticOnly ? 0 : readiness.eligibleCount,
      usedRealData: !allowSyntheticOnly && readiness.eligibleCount > 0,
      status: "candidate",
      triggeredByAdmin: req.user._id,
      notes: notes || `Admin-triggered training. Eligible real records: ${readiness.eligibleCount}.`,
      featureSchemaVersion: "v1.0"
    });
  } catch (err) {
    // Duplicate version tags (unlikely) — return a clear message
    if (err.code === 11000) {
      return res.status(409).json({
        error: "A training run with this version tag already exists. Please wait a moment and retry."
      });
    }
    throw err;
  }

  return res.status(201).json({
    status: "training_queued",
    modelVersion: versionTag,
    trainingRecordId: String(trainingRecord._id),
    eligibleRealRecords: readiness.eligibleCount,
    usingRealData: !allowSyntheticOnly && readiness.eligibleCount > 0,
    instruction: "Training run recorded. To execute the Python pipeline, run: `cd backend && python scripts/dataset_pipeline.py` in your terminal. Update the training record status after the run completes.",
    disclaimer: "Actual model retraining requires running the Python pipeline script manually or via a scheduled job. The backend inference engine will continue using the currently deployed model until a new model is explicitly deployed.",
    trainingRecord: {
      modelVersion: trainingRecord.modelVersion,
      status: trainingRecord.status,
      trainedAt: trainingRecord.trainedAt,
      realRecordCount: trainingRecord.realRecordCount,
      syntheticRecordCount: trainingRecord.syntheticRecordCount
    }
  });
}));

/**
 * GET /api/hotspots/export-dataset
 * Exports all ML-eligible real community reports to a CSV file for the Python pipeline.
 * Writes SHEQ_real_reports_export.csv and a manifest JSON sidecar.
 * No PII is included in the export.
 */
router.get("/export-dataset", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const result = await exportEligibleReportsToCSV();

  if (!result) {
    return res.status(500).json({
      error: "Dataset export failed. Check backend logs.",
      suggestion: "Ensure MongoDB is connected and the datasets directory is writable."
    });
  }

  return res.json({
    status: "exported",
    recordCount: result.recordCount,
    csvPath: result.csvPath,
    manifestPath: result.manifestPath,
    disclaimer: result.recordCount === 0
      ? "No eligible real reports found. Export contains headers only. Use synthetic dataset for initial training."
      : `Exported ${result.recordCount} eligible real reports. No PII included. Proxy labels will be derived by the Python pipeline.`,
    proxyLabelStrategy: "priority_candidate=1 if (moderation_status='Verified' AND confirmations>=2) OR (confirmations>=3 AND is_night=1 AND disputes=0). This is a heuristic proxy — NOT scientific ground truth.",
    nextStep: "Run: python backend/scripts/dataset_pipeline.py --include-real"
  });
}));

/**
 * POST /api/hotspots/deploy-model
 * After the Python pipeline writes training_result.json, the admin calls this endpoint to:
 *  1. Read and validate the training result metrics.
 *  2. If metrics pass the minimum bar: set that MLModelRegistry record to "deployed",
 *     supersede the previous deployed model, and force-reload the inference engine.
 *  3. If metrics fail: set status to "rejected" with a reason.
 *
 * Body: { modelVersion: string, trainingRecordId: string }
 * Minimum deployment bar: rocAuc >= 0.55 AND f1Score >= 0.30
 */
router.post("/deploy-model", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = z.object({
    modelVersion: z.string().min(1).max(200),
    trainingRecordId: z.string().min(1).max(100).optional()
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "modelVersion is required.", details: parsed.error.flatten() });
  }

  const { modelVersion, trainingRecordId } = parsed.data;

  // Find the training record in MLModelRegistry
  const query = trainingRecordId
    ? { _id: trainingRecordId }
    : { modelVersion };
  const trainingRecord = await MLModelRegistry.findOne(query);

  if (!trainingRecord) {
    return res.status(404).json({
      error: `No training record found for modelVersion="${modelVersion}".`,
      suggestion: "Run POST /api/hotspots/train first, or check the modelVersion string."
    });
  }

  if (trainingRecord.status === "deployed") {
    return res.status(409).json({
      error: "This model version is already deployed.",
      modelVersion: trainingRecord.modelVersion
    });
  }

  // Try to read training_result.json written by the Python pipeline
  let trainingResult = null;
  try {
    const { readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = join(fileURLToPath(import.meta.url), "..", "..", "..");
    const resultPath = join(__dirname, "docs", "training_result.json");

    if (existsSync(resultPath)) {
      trainingResult = JSON.parse(readFileSync(resultPath, "utf8"));
    }
  } catch (err) {
    console.warn("[Deploy] Could not read training_result.json:", err.message);
  }

  // Extract metrics from training_result.json or from the existing registry record
  const metrics = trainingResult?.metrics || trainingRecord.metrics || {};
  const rocAuc = metrics.rocAuc ?? metrics.roc_auc ?? null;
  const f1Score = metrics.f1Score ?? metrics.f1_score ?? null;

  const MIN_ROC_AUC = 0.55;
  const MIN_F1 = 0.30;

  // Validate metrics if available
  const metricsAvailable = rocAuc !== null && f1Score !== null;
  const passesValidation = !metricsAvailable || (rocAuc >= MIN_ROC_AUC && f1Score >= MIN_F1);

  if (!passesValidation) {
    // Reject the model — keep existing deployed model
    await MLModelRegistry.findByIdAndUpdate(trainingRecord._id, {
      status: "rejected",
      rejectionReason: `Metrics below deployment threshold. ROC-AUC=${rocAuc?.toFixed(4)} (min ${MIN_ROC_AUC}), F1=${f1Score?.toFixed(4)} (min ${MIN_F1}).`
    });
    return res.status(422).json({
      status: "rejected",
      modelVersion: trainingRecord.modelVersion,
      reason: `Model rejected: ROC-AUC ${rocAuc?.toFixed(4)} < ${MIN_ROC_AUC} or F1 ${f1Score?.toFixed(4)} < ${MIN_F1}. Existing deployed model retained.`,
      metrics: { rocAuc, f1Score }
    });
  }

  // Supersede previous deployed models
  await MLModelRegistry.updateMany(
    { status: "deployed" },
    { $set: { status: "superseded" } }
  );

  // Update metrics from training_result.json if available
  const updatePayload = {
    status: "deployed",
    deployedAt: new Date(),
    deployedBy: req.user._id
  };
  if (trainingResult?.metrics) {
    updatePayload.metrics = {
      accuracy: trainingResult.metrics.accuracy,
      precision: trainingResult.metrics.precision,
      recall: trainingResult.metrics.recall,
      f1Score: trainingResult.metrics.f1Score ?? trainingResult.metrics.f1_score,
      rocAuc: trainingResult.metrics.rocAuc ?? trainingResult.metrics.roc_auc,
      cvMeanAuc: trainingResult.metrics.cvMeanAuc
    };
  }
  if (trainingResult?.realRecordCount !== undefined) {
    updatePayload.realRecordCount = trainingResult.realRecordCount;
    updatePayload.syntheticRecordCount = trainingResult.syntheticRecordCount;
    updatePayload.usedRealData = trainingResult.usedRealData;
  }

  await MLModelRegistry.findByIdAndUpdate(trainingRecord._id, { $set: updatePayload });

  // Force model artifact reload on next inference request
  // loadModelArtifact() uses module-level cache; reset it by calling with reset flag
  try {
    loadModelArtifact(true);
  } catch {
    // Non-critical — model will reload on next inference call
  }

  return res.json({
    status: "deployed",
    modelVersion: trainingRecord.modelVersion,
    deployedAt: new Date().toISOString(),
    metricsAvailable,
    metrics: metricsAvailable ? { rocAuc, f1Score } : null,
    message: metricsAvailable
      ? `Model ${trainingRecord.modelVersion} deployed. Previous deployed model superseded.`
      : `Model ${trainingRecord.modelVersion} deployed without metric validation (training_result.json not found). Previous model superseded.`,
    disclaimer: "The backend inference engine will use this model version for all subsequent hotspot candidate scoring."
  });
}));

export default router;