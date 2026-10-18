import mongoose from "mongoose";
const infrastructureSchema = new mongoose.Schema({
  sourceId: { type: String, required: true, unique: true },
  sourceDataset: { type: String, required: true, index: true },
  featureType: { type: String, required: true, index: true },
  label: { type: String, maxlength: 250 },
  geometry: { type: { type: String, enum: ["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"], required: true }, coordinates: { type: mongoose.Schema.Types.Mixed, required: true } },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  dataYear: Number,
  isSynthetic: { type: Boolean, default: false },
  sourceNote: String
}, { timestamps: true, versionKey: false });
infrastructureSchema.index({ geometry: "2dsphere" });
infrastructureSchema.index({ sourceDataset: 1, featureType: 1 });
export default mongoose.model("InfrastructureFeature", infrastructureSchema);
