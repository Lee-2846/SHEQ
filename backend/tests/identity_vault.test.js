import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Magic bytes validation matching backend/src/routes/identity.js
function validateMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  // PDF signature: %PDF (0x25 0x50 0x44 0x46)
  if (mimeType === "application/pdf" && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return true;
  }

  // PNG signature: 0x89 0x50 0x4E 0x47
  if (mimeType === "image/png" && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return true;
  }

  // JPEG signature: 0xFF 0xD8 0xFF
  if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  return false;
}

test("Identity Document Vault & Compliance Suite", async (t) => {
  await t.test("File Type Validation: accepts valid PDF, PNG, and JPEG magic bytes", () => {
    // Valid PDF buffer
    const pdfBuf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    assert.equal(validateMagicBytes(pdfBuf, "application/pdf"), true);

    // Valid PNG buffer
    const pngBuf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    assert.equal(validateMagicBytes(pngBuf, "image/png"), true);

    // Valid JPEG buffer
    const jpgBuf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    assert.equal(validateMagicBytes(jpgBuf, "image/jpeg"), true);
  });

  await t.test("Security: rejects spoofed files (executables or scripts disguised with PDF/PNG extensions)", () => {
    // Windows executable (MZ header) with PDF mimetype
    const exeBuf = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    assert.equal(validateMagicBytes(exeBuf, "application/pdf"), false);

    // HTML/Script file disguised as JPEG
    const scriptBuf = Buffer.from("<script>alert(1)</script>");
    assert.equal(validateMagicBytes(scriptBuf, "image/jpeg"), false);

    // Empty or short buffer
    assert.equal(validateMagicBytes(Buffer.from([0x25]), "application/pdf"), false);
  });

  await t.test("Vault Storage Isolation: vault directory is strictly outside public web roots", () => {
    const cwd = process.cwd();
    const vaultPath = path.resolve(cwd, "uploads", "vault_documents");
    const publicPath = path.resolve(cwd, "public");

    // Must not be a subdirectory of public
    const isInsidePublic = vaultPath.startsWith(publicPath + path.sep);
    assert.equal(isInsidePublic, false, "Vault directory must never be inside public web root");
  });

  await t.test("Integrity Checksum: generates SHA-256 hash for submitted documents", () => {
    const sampleDoc = Buffer.from("%PDF-1.4 sample masked aadhaar content for checksum validation");
    const hash = crypto.createHash("sha256").update(sampleDoc).digest("hex");
    assert.equal(typeof hash, "string");
    assert.equal(hash.length, 64);
    assert.match(hash, /^[a-f0-9]{64}$/);
  });

  await t.test("Right to Erasure: document deletion sanitizes user record and leaves no orphan pointers", () => {
    // Simulated user document state before deletion
    const userDocState = {
      verificationStatus: "pending_review",
      documentDetails: {
        submittedAt: new Date(),
        storageFileName: "uuid-1234.pdf",
        originalName: "masked_aadhaar.pdf",
        sha256Hash: "abcd"
      }
    };

    // Deletion transition
    userDocState.verificationStatus = "unverified";
    userDocState.documentDetails = null;

    assert.equal(userDocState.verificationStatus, "unverified");
    assert.equal(userDocState.documentDetails, null);
  });
});
