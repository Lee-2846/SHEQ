import mongoose from "mongoose";
const confirmationSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, versionKey: false });
confirmationSchema.index({ reportId: 1, userId: 1 }, { unique: true });
export default mongoose.model("Confirmation", confirmationSchema);
