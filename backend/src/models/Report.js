import mongoose from "mongoose";

const categories = ["Harassment", "Stalking", "Theft", "Suspicious Activity", "Unsafe Transport", "Poor Lighting", "Broken CCTV", "Unsafe / Isolated Area", "Infrastructure Concern", "Other"];
const reportSchema = new mongoose.Schema({
  category: { type: String, required: true, enum: categories, index: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true, validate: { validator: v => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90, message: "Coordinates must be [longitude, latitude]." } },
    label: { type: String, trim: true, maxlength: 250 }
  },
  incidentAt: Date,
  status: { type: String, enum: ["Submitted", "Under Review", "Verified", "Resolved", "Flagged"], default: "Submitted", index: true },
  isAnonymousPublicly: { type: Boolean, default: false },
  confirmations: { type: Number, default: 0, min: 0 },
  disputes: { type: Number, default: 0, min: 0 },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", select: false },
  sourceType: { type: String, enum: ["community", "imported", "synthetic_demo"], default: "community", index: true },
  dataLabel: { type: String, default: "community_report" },
  moderationNote: { type: String, maxlength: 2000 }
}, { timestamps: true, versionKey: false });
reportSchema.index({ location: "2dsphere" });
reportSchema.index({ createdAt: -1, category: 1 });
export { categories };
export default mongoose.model("Report", reportSchema);
