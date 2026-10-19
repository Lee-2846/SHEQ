import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { issueAccessToken } from "../src/services/tokenService.js";
import { publicUser, publicReport } from "../src/utils/sanitize.js";

test("Authentication & Security: password hashing and verification", async () => {
  const password = "StrongPassword@123";
  const hash = await bcrypt.hash(password, 10);
  assert.notEqual(hash, password);
  assert.equal(await bcrypt.compare(password, hash), true);
  assert.equal(await bcrypt.compare("WrongPassword", hash), false);
});

test("Authentication & Security: JWT issuance and payload verification", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: "user"
  };
  const token = issueAccessToken(mockUser);
  assert.ok(token);

  // Decode without verifying signature for structure check
  const decoded = jwt.decode(token);
  assert.equal(decoded.sub, mockUser._id);
  assert.equal(decoded.role, "user");
  assert.ok(decoded.exp);
  assert.ok(decoded.iat);
});

test("Data Protection & Privacy: publicUser strips sensitive password hash and internal fields", () => {
  const user = {
    _id: "507f1f77bcf86cd799439011",
    name: "Aaditi Deshmukh",
    email: "aaditi@example.com",
    phone: "9876543210",
    passwordHash: "$2a$10$abcdef1234567890",
    role: "user",
    verificationStatus: "unverified",
    identityProviderReference: "ID-999-SECRET",
    createdAt: new Date()
  };

  const sanitized = publicUser(user);
  assert.equal(sanitized.id, user._id);
  assert.equal(sanitized.name, user.name);
  assert.equal(sanitized.email, user.email);
  assert.equal(sanitized.phone, user.phone);
  assert.equal(sanitized.role, "user");
  assert.equal(sanitized.verificationStatus, "unverified");
  assert.equal("passwordHash" in sanitized, false);
  assert.equal("identityProviderReference" in sanitized, false);
});

test("Data Protection & Privacy: publicReport protects anonymous reporter identity", () => {
  const report = {
    _id: "607f1f77bcf86cd799439022",
    category: "Harassment",
    description: "Unsafe bus stop waiting area with broken lighting",
    location: { type: "Point", coordinates: [72.8777, 19.0760], label: "Bandra, Mumbai" },
    status: "Submitted",
    isAnonymousPublicly: true,
    reporterId: "507f1f77bcf86cd799439011",
    moderationNote: "Internal municipal referral pending"
  };

  const sanitized = publicReport(report);
  assert.equal(sanitized._id, report._id);
  assert.equal(sanitized.isAnonymousPublicly, true);
  assert.equal("reporterId" in sanitized, false);
  assert.equal("moderationNote" in sanitized, false);
});
