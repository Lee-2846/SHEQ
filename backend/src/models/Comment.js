import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, select: false },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  moderationStatus: { type: String, enum: ["visible", "flagged", "hidden"], default: "visible" }
}, { timestamps: true, versionKey: false });
export default mongoose.model("Comment", commentSchema);
