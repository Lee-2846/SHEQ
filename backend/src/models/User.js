import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  phone: { type: String, trim: true, sparse: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user", index: true },
  verificationStatus: { type: String, enum: ["unverified", "pending", "verified", "failed"], default: "unverified" },
  identityProviderReference: { type: String, select: false },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date
}, { timestamps: true, versionKey: false });

userSchema.pre("validate", function(next) {
  if (!this.email && !this.phone) this.invalidate("email", "Provide an email or phone number.");
  next();
});
export default mongoose.model("User", userSchema);
