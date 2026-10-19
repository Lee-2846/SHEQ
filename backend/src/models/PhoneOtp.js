import mongoose from "mongoose";

const phoneOtpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    sparse: true
  },
  name: {
    type: String,
    trim: true
  },
  passwordHash: {
    type: String,
    select: false
  },
  otpHash: {
    type: String,
    required: true,
    select: false
  },
  attemptsRemaining: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  resendAvailableAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PhoneOtp", phoneOtpSchema);
