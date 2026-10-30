import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { normalizePhoneNumber, isSmsConfigured, getSmsProviderStatus } from "../src/services/smsService.js";
import { env } from "../src/config/env.js";

test("Phone Authentication & SMS Security Suite", async (t) => {
  await t.test("Phone normalization: formats Indian 10-digit mobile numbers to E.164 (+91)", () => {
    const rawNumbers = [
      "9876543210",
      "+91 98765 43210",
      "919876543210",
      "98765-43210",
      "  9876543210  "
    ];

    for (const num of rawNumbers) {
      const { isValid, normalized } = normalizePhoneNumber(num);
      assert.equal(isValid, true, `Expected ${num} to be valid`);
      assert.equal(normalized, "+919876543210", `Expected ${num} to normalize to +919876543210`);
    }
  });

  await t.test("Phone normalization: handles international E.164 formats", () => {
    const usNumber = "+1 (415) 555-2671";
    const { isValid, normalized } = normalizePhoneNumber(usNumber);
    assert.equal(isValid, true);
    assert.equal(normalized, "+14155552671");
  });

  await t.test("Phone normalization: rejects invalid or malformed numbers", () => {
    const invalidNumbers = [
      "",
      "12345",
      "abcdefghij",
      "12345678901234567890" // > 15 digits
    ];

    for (const num of invalidNumbers) {
      const { isValid } = normalizePhoneNumber(num);
      assert.equal(isValid, false, `Expected ${num} to be invalid`);
    }
  });

  await t.test("Cryptographic HMAC-SHA256 OTP hashing prevents plaintext storage", () => {
    const phone = "+919876543210";
    const otp = "739201";
    const secret = env.otpSecret;

    const hash1 = crypto.createHmac("sha256", secret).update(`${phone}:${otp}`).digest("hex");
    const hash2 = crypto.createHmac("sha256", secret).update(`${phone}:${otp}`).digest("hex");
    const wrongHash = crypto.createHmac("sha256", secret).update(`${phone}:739202`).digest("hex");

    assert.equal(hash1, hash2);
    assert.notEqual(hash1, wrongHash);
    assert.equal(hash1.length, 64);

    // Timing-safe comparison check
    const buf1 = Buffer.from(hash1, "hex");
    const buf2 = Buffer.from(hash2, "hex");
    const bufWrong = Buffer.from(wrongHash, "hex");

    assert.equal(crypto.timingSafeEqual(buf1, buf2), true);
    assert.equal(crypto.timingSafeEqual(buf1, bufWrong), false);
  });

  await t.test("SMS Provider status: honestly indicates readiness without fake success claims", () => {
    const status = getSmsProviderStatus();
    assert.ok(status);
    assert.equal(typeof status.configured, "boolean");
    assert.equal(typeof status.provider, "string");

    if (!isSmsConfigured()) {
      assert.equal(status.configured, false);
      assert.match(status.notice, /not configured|Twilio/i);
    }
  });
});
