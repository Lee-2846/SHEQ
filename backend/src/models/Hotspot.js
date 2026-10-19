import mongoose from "mongoose";
const hotspotSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 250, default: "High report activity — review required" },
  center: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], required: true } },
  radiusMeters: { type: Number, min: 50, max: 5000, default: 500 },
  state: { type: String, enum: ["candidate", "designated", "dismissed", "inactive"], default: "candidate", index: true },
  score: { type: Number, min: 0, max: 100 },
  factors: { reportCount: Number, recentReportCount: Number, confirmations: Number, categoryMix: Number },
  evidenceReportIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
  rationale: { type: String, maxlength: 2000 },
  algorithmVersion: { type: String, default: "transparent-baseline-v1" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true, versionKey: false });
hotspotSchema.index({ center: "2dsphere" });
export default mongoose.model("Hotspot", hotspotSchema);
