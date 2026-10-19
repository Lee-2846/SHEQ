import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  passwordHash: {
    type: String,
    required: true,
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
    required: true,
    index: { expires: 0 } // MongoDB TTL index: automatically deletes document upon reaching expiresAt
  }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.model("EmailOtp", emailOtpSchema);
