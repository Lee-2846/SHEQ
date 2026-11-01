/**
 * MLModelRegistry — Records each training run and tracks the deployed model.
 *
 * Each document represents one training run. The "deployed" model is the
 * single document with status === "deployed". When a new model passes
 * evaluation and is deployed, the previous deployed model is moved to "superseded"
 * but retained for rollback auditing.
 *
 * Design principles:
 * - New model must pass minimum evaluation criteria before deployment.
 * - Previous production model is always preserved.
 * - Synthetic-only training is clearly labeled; real-data training tracked separately.
 * - No model is deployed automatically — requires admin confirmation or explicit pass criteria.
 */
import mongoose from "mongoose";

const mlModelRegistrySchema = new mongoose.Schema(
  {
    // e.g. "rf-v1.0-synthetic-demo", "rf-v2.0-real-20261101"
    modelVersion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      unique: true
    },

    // Dataset version at time of training
    datasetVersion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    // When training completed
    trainedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    // Training data composition
    syntheticRecordCount: { type: Number, min: 0, default: 0 },
    realRecordCount: { type: Number, min: 0, default: 0 },

    // Feature schema version used during training
    featureSchemaVersion: {
      type: String,
      default: "v1.0",
      maxlength: 20
    },

    // Whether training used real community data in addition to synthetic
    usedRealData: { type: Boolean, default: false },

    // Evaluation metrics recorded at training time
    metrics: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number,
      rocAuc: Number,
      cvMeanAuc: Number,
      cvStdAuc: Number,
      confusionMatrix: {
        trueNegatives: Number,
        falsePositives: Number,
        falseNegatives: Number,
        truePositives: Number
      }
    },

    // Path to the model artifact (JSON decision trees)
    artifactPath: {
      type: String,
      maxlength: 500,
      default: "backend/docs/hotspot_rf_model.json"
    },

    // Training status lifecycle
    // "training" → "candidate" → "deployed" | "rejected" | "superseded"
    status: {
      type: String,
      enum: ["training", "candidate", "deployed", "rejected", "superseded"],
      default: "candidate",
      index: true
    },

    // Whether this training was triggered manually by an admin
    triggeredByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Why a model was rejected (if status === "rejected")
    rejectionReason: {
      type: String,
      maxlength: 1000,
      default: null
    },

    // Deployment timestamp (when this model was set to "deployed")
    deployedAt: {
      type: Date,
      default: null
    },

    // Honest provenance notes
    notes: {
      type: String,
      maxlength: 2000,
      default: ""
    }
  },
  { timestamps: true, versionKey: false }
);

mlModelRegistrySchema.index({ status: 1, trainedAt: -1 });

export default mongoose.model("MLModelRegistry", mlModelRegistrySchema);

