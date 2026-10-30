import mongoose from "mongoose";

const identityAuditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      "document_uploaded",
      "document_accessed",
      "review_approved",
      "review_rejected",
      "review_resubmission_requested",
      "document_deleted"
    ],
    index: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  performedByRole: {
    type: String,
    enum: ["user", "admin"],
    required: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false
});

identityAuditSchema.index({ createdAt: -1 });

export default mongoose.model("IdentityAudit", identityAuditSchema);
