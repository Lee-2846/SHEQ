import mongoose from "mongoose";
const escalationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 250 },
  summary: { type: String, required: true, trim: true, maxlength: 5000 },
  reportIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
  locationLabel: { type: String, maxlength: 250 },
  category: { type: String, maxlength: 100 },
  evidenceContext: { type: String, maxlength: 5000 },
  status: { type: String, enum: ["draft", "under_review", "prepared_for_external_escalation", "closed"], default: "draft" },
  adminNotes: { type: String, maxlength: 5000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, versionKey: false });
export default mongoose.model("Escalation", escalationSchema);
