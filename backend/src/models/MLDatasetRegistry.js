/**
 * MLDatasetRegistry — Tracks the versioned state of the ML training dataset.
 *
 * This model records the current composition of training data, distinguishing
 * clearly between synthetic demonstration records and genuine community reports.
 * It is updated whenever the dataset changes or training is triggered.
 *
 * Design principles:
 * - Never misrepresents synthetic records as genuine reports.
 * - Tracks eligibility separately from raw submission count.
 * - All timestamps are UTC.
 */
import mongoose from "mongoose";

const mlDatasetRegistrySchema = new mongoose.Schema(
  {
    // Human-readable version tag, e.g. "dataset-v1.0-2026-11-01"
    datasetVersion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    // Number of records from the synthetic demo CSV (never changes post-import)
    syntheticRecordCount: {
      type: Number,
      required: true,
      min: 0,
      default: 500
    },

    // Total genuine community reports in MongoDB (sourceType: "community" or "imported")
    realSubmittedCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    // Reports that pass eligibility: not Flagged, not synthetic_demo, have valid coordinates
    eligibleForTrainingCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    // Reports submitted but awaiting moderation review before training eligibility
    pendingVerificationCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    // Reports explicitly excluded (Flagged, missing coordinates, duplicates detected)
    excludedRecordCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    // Minimum eligible real-data records before retraining is permitted
    minimumTrainingThreshold: {
      type: Number,
      required: true,
      min: 1,
      default: 10
    },

    // Whether the threshold for triggering real-data retraining is currently met
    thresholdMet: {
      type: Boolean,
      default: false
    },

    // When the dataset stats were last recalculated
    lastUpdatedAt: {
      type: Date,
      default: null
    },

    // Feature schema version — must match training and inference pipelines
    featureSchemaVersion: {
      type: String,
      default: "v1.0",
      maxlength: 20
    },

    // Notes for audit trail
    notes: {
      type: String,
      maxlength: 2000,
      default: ""
    }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("MLDatasetRegistry", mlDatasetRegistrySchema);

