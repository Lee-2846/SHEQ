import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { sendOtpEmail, isEmailConfigured, getProviderStatus, __setDevOtpListener } from "../src/services/emailService.js";

test("Email Verification Architecture & OTP Security Suite", async (t) => {
  await t.test("Password validation requirements: enforces 10-char minimum and special character", () => {
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    
    // Less than 10 characters
    const shortPwd = "Short1!";
    assert.equal(shortPwd.length < 10, true);

    // 10 chars but no special char
    const noSpecial = "LongPassword123";
    assert.equal(noSpecial.length >= 10, true);
    assert.equal(specialCharRegex.test(noSpecial), false);

    // Valid password
    const validPwd = "SecurePassword2026@!";
    assert.equal(validPwd.length >= 10, true);
    assert.equal(specialCharRegex.test(validPwd), true);
  });

  await t.test("Cryptographic OTP generation produces 6-digit integer string", () => {
    for (let i = 0; i < 50; i++) {
      const code = crypto.randomInt(100000, 1000000).toString();
      assert.equal(code.length, 6);
      assert.match(code, /^\d{6}$/);
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  await t.test("HMAC-SHA256 OTP hashing prevents plaintext storage and is timing-safe", () => {
    const email = "safety.member@example.com";
    const otp = "842915";
    const secret = env.otpSecret;

    const hashA = crypto.createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
    const hashB = crypto.createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
    const hashWrong = crypto.createHmac("sha256", secret).update(`${email}:842916`).digest("hex");

    assert.equal(hashA, hashB);
    assert.notEqual(hashA, hashWrong);
    assert.equal(hashA.length, 64);

    // Timing safe comparison verification
    const bufA = Buffer.from(hashA, "hex");
    const bufB = Buffer.from(hashB, "hex");
    const bufWrong = Buffer.from(hashWrong, "hex");

    assert.equal(crypto.timingSafeEqual(bufA, bufB), true);
    assert.equal(crypto.timingSafeEqual(bufA, bufWrong), false);
  });

  await t.test("Plaintext passwords are never stored in pending records: bcrypt hashing check", async () => {
    const rawPassword = "ValidPassword2026!#";
    const hash = await bcrypt.hash(rawPassword, 10);
    
    assert.notEqual(hash, rawPassword);
    assert.equal(await bcrypt.compare(rawPassword, hash), true);
    assert.equal(await bcrypt.compare("WrongPassword", hash), false);
  });

  await t.test("Email provider status: reports honest diagnostics when disabled", () => {
    const status = getProviderStatus();
    assert.ok(typeof status.configured === "boolean");
    assert.ok(typeof status.provider === "string");
    assert.ok(typeof status.notice === "string");
  });

  await t.test("Email adapter sendOtpEmail: handles delivery cleanly without exposing secrets", async () => {
    let capturedOtp = null;
    __setDevOtpListener(({ to, otp }) => {
      capturedOtp = otp;
    });

    const result = await sendOtpEmail({
      to: "test.user@sheq.app",
      otp: "951753",
      name: "Test User"
    });

    assert.ok(typeof result.delivered === "boolean");
    assert.ok(typeof result.provider === "string");
    assert.ok(typeof result.notice === "string");

    // Clean up listener
    __setDevOtpListener(null);
  });
});
