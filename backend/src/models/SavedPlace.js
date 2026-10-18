import mongoose from "mongoose";
const savedPlaceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  label: { type: String, trim: true, maxlength: 250 },
  location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], required: true } }
}, { timestamps: true, versionKey: false });
savedPlaceSchema.index({ userId: 1, name: 1 }, { unique: true });
export default mongoose.model("SavedPlace", savedPlaceSchema);
