import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  phone: { type: String, trim: true, sparse: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user", index: true },
  verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "pending_review", "verified", "rejected", "resubmission_required", "failed"],
    default: "unverified",
    index: true
  },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  documentDetails: {
    originalName: { type: String, trim: true },
    storedName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    fileSize: { type: Number, min: 0 },
    storagePath: { type: String, select: false },
    sha256Hash: { type: String, select: false },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNotes: { type: String, trim: true, maxlength: 1000 },
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    consentGiven: { type: Boolean, default: false },
    consentTimestamp: Date
  },
  identityProviderReference: { type: String, select: false },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date
}, { timestamps: true, versionKey: false });

userSchema.pre("validate", function(next) {
  if (!this.email && !this.phone) this.invalidate("email", "Provide an email or phone number.");
  next();
});
export default mongoose.model("User", userSchema);
