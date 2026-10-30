# 05 — Authentication, Security & Masked Aadhaar Identity Vault

---

## 1. Authentication vs Authorization (The Golden Viva Distinction)

In a viva, faculty will frequently test if you know the difference between these two terms:

* **Authentication ("Who are you?"):**
  * Verifying the identity of the user.
  * In SHEQ: Checked when a user provides their email/phone + password or validates a 6-digit one-time passcode (OTP). The system issues a signed JSON Web Token (JWT) proving who they are.
* **Authorization ("What are you permitted to do?"):**
  * Verifying whether the authenticated user has permission to perform an action.
  * In SHEQ: Handled by `requireAdmin` middleware. Both a regular commuter and an administrator are authenticated, but only the user with `role === "admin"` is authorized to access `/api/identity/pending`, moderate reports, or promote hotspot candidates.

---

## 2. Complete Sequence: Signup & OTP Verification

```
[ Frontend: Signup.jsx ]
User inputs Name, Email/Phone, Password (>= 10 chars, special symbol) -> clicks "Continue"
                 |
                 v
[ HTTP Request ]
POST http://localhost:5000/api/auth/signup/initiate
Payload: { name, email, phone, password }
                 |
                 v
[ Backend: auth.js -> handleSignupInitiation() ]
1. Zod Validation (signupSchema): Enforces >=10 chars and special character regex.
2. Checks MongoDB if user already exists (User.findOne).
3. Generates 6-digit cryptographic OTP: crypto.randomInt(100000, 1000000).
4. Hashes password using Bcrypt: bcrypt.hash(password, 10 salt rounds).
5. Hashes OTP using HMAC-SHA256: crypto.createHmac("sha256", secret).update(`${email}:${otp}`).
6. Saves pending record to EmailOtp or PhoneOtp collection with:
   - otpHash (raw OTP never stored)
   - attemptsRemaining: 3
   - resendAvailableAt: Date.now() + 60s
   - expiresAt: Date.now() + 10m (Mongo TTL auto-purge)
7. Attempts Delivery:
   - If Email: emailService.js -> nodemailer SMTP transport or Resend API.
   - If Phone: smsService.js -> Twilio SMS or Fast2SMS HTTP gateway.
8. Returns HTTP 200: { message: "Verification passcode sent.", delivery: { delivered, notice } }
                 |
                 v
[ Frontend: OTP Screen ]
Signup wizard enters Step 2 -> Displays countdown timer (60s) -> User enters 6-digit OTP
                 |
                 v
[ HTTP Request ]
POST http://localhost:5000/api/auth/signup/verify
Payload: { email/phone, otp, name, password }
                 |
                 v
[ Backend: auth.js ]
1. Finds pending OTP record in EmailOtp/PhoneOtp collection.
2. Checks expiration and attempts remaining (> 0).
3. Hashes submitted OTP with HMAC-SHA256.
4. Performs timing-safe comparison: crypto.timingSafeEqual(bufferA, bufferB).
5. If invalid: decrements attemptsRemaining; returns 400.
6. If valid:
   - Creates active User in MongoDB: User.create({ name, email, phone, passwordHash }).
   - Deletes pending OTP record.
   - Issues signed JWT token: issueAccessToken(user).
7. Returns HTTP 201: { token, user: publicUser(user) }.
                 |
                 v
[ Frontend: Authenticated State ]
AuthContext receives JWT -> stores in localStorage -> updates user state ->
Auto-redirects to /dashboard.
```

---

## 3. Cryptographic & Security Safeguards Implemented in Code

### A. Timing-Safe HMAC-SHA256 OTP Hashing
* **File:** `backend/src/routes/auth.js` (`hashOtp`, `hashPhoneOtp`)
* **Why it matters:** If an attacker gains read access to the database, they cannot read any user's active OTP because only an irreversible SHA-256 HMAC hash is stored.
* **Timing-Attack Protection:** When comparing submitted OTP hashes against stored hashes, the code converts them into byte buffers and uses:
  ```javascript
  crypto.timingSafeEqual(submittedBuf, storedBuf);
  ```
  Standard string comparison (`a === b`) terminates on the first non-matching character, leaking elapsed time in nanoseconds that attackers can measure to guess characters. `timingSafeEqual` always runs in constant time.

### B. Bcrypt One-Way Password Hashing
* **File:** `backend/src/routes/auth.js`
* **Implementation:** `await bcrypt.hash(password, 10)`
* **Security:** Uses an adaptive salt cost of 10 rounds. Even if two users choose the identical password, their stored hashes are completely different due to unique random salting.

### C. Rate Limiting & Cooldown Enforcements
* **Global API Limiter:** `120 requests/minute` per IP (`app.js`).
* **Auth Limiter:** `15 requests / 15 minutes` in production (`auth.js`).
* **Resend Cooldown:** 60-second mandatory wait time enforced by checking `resendAvailableAt > new Date()`.
* **Brute-Force Guard:** Strict limit of 3 invalid attempts per OTP challenge (`attemptsRemaining`).

### D. Honest External Service Error Handling
* **Email Service (`emailService.js`):** Catches Resend free-tier domain verification errors cleanly (when emails are sent to unverified domains with `onboarding@resend.dev`), returning `{ delivered: false, notice: "..." }` rather than making a false claim of delivery.
* **SMS Service (`smsService.js`):** When Twilio credentials are not configured, returns `configured: false` with explicit instructions.

---

## 4. The Masked Aadhaar Document Vault (Investigation & Viva Proof)

Here are the answers to the 10 vital audit questions regarding the document verification workflow:

### 1. Does uploading the PNG persist it beyond the current browser session?
**YES.** Uploaded documents are saved directly to the server's disk storage in the private vault directory (`backend/uploads/vault_documents/`).

### 2. Exactly where are the bytes stored?
* **Directory:** `c:\Users\DELL\Desktop\SHEQ\backend\uploads\vault_documents\`
* **Filename Pattern:** `<userId>_<randomUUID>.<ext>` (e.g. `67b54a10e8_a3b2c1d0-4e5f-6a7b.png`).
* **Permissions:** Stored with `0o600` mode (POSIX read/write by owner only; forbidden to all other system users).
* **Isolation:** Located strictly outside public web roots (`public/` or `dist/`). There is zero static file serving to the internet.

### 3. Which database record references the file?
The `User` document in MongoDB contains the subdocument `documentDetails`:
* `storagePath`: Absolute path to the file on disk (`select: false` so it is never leaked over APIs).
* `sha256Hash`: Cryptographic checksum calculated immediately upon buffer reception.
* `originalName`: User-facing name (e.g. `Masked_Aadhaar.png`).
* `mimeType`: `application/pdf`, `image/png`, or `image/jpeg`.
* `fileSize`: File size in bytes.
* `submittedAt`: ISO timestamp.

### 4. Which API endpoint handles the upload?
* **Endpoint:** `POST /api/identity/upload-document`
* **Handler:** Uses `multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })`.
* **Magic Bytes Inspection:** Reads the first 4 bytes of the binary buffer to verify true file format (`%PDF` = `0x25 0x50 0x44 0x46`, `PNG` = `0x89 0x50 0x4E 0x47`, `JPEG` = `0xFF 0xD8 0xFF`), immediately rejecting executable or script files disguised with image extensions.

### 5. Which Admin page or component displays it?
* **Component:** `src/pages/admin/AdminIdentity.jsx`
* **Route:** `/admin/identity` (guarded by `<AdminRoute />`).
* **UI Features:** Displays the pending verification queue, member name, submission date, file metadata, and a "View Document" button.

### 6. Can an authorized Admin actually open and review the image?
**YES.** Clicking "View Document" calls `fetchDocumentBlob(userId)` in `src/services/identityService.js`, which hits `GET /api/identity/document/:userId`. The browser receives the binary stream, converts it into a local `Blob` URL (`URL.createObjectURL(blob)`), and opens the document in a secure browser tab for inspection.

### 7. Is access protected by authentication and Admin authorization?
**YES.** `GET /api/identity/document/:userId` enforces:
```javascript
const isSelf = req.user._id.toString() === req.params.userId;
const isAdmin = req.user.role === "admin";
if (!isSelf && !isAdmin) {
  return res.status(403).json({ error: "Access denied." });
}
```
Unauthorized users or visitors without an active JWT token receive `401 Unauthorized` or `403 Forbidden`. Every access is logged in the `IdentityAudit` collection.

### 8. What happens if the backend restarts?
The document file remains safely stored on disk, and the MongoDB document metadata persists. When the server boots back up, admins can still view and review the document without loss.

### 9. What happens if the database is unavailable?
The API returns `500 Database operation failed`. Because file writes occur after database user lookups, no orphaned files are written without database references. Existing files on disk remain safe.

### 10. What remains unimplemented?
* **Automated UIDAI Biometric Verification:** By deliberate system design and Indian privacy law, SHEQ **does not** integrate automated UIDAI biometric APIs. The platform enforces human administrative review of masked documents to verify legal name and proof of community presence without storing unmasked national identity numbers.

---

## 5. Right to Erasure & DPDP Compliance

Under India's **Digital Personal Data Protection (DPDP) Act 2023**, citizens have the right to request deletion of their personal identity records.

* **Implementation:** `DELETE /api/identity/document`
* **What happens when the member clicks "Delete Document" in `Profile.jsx`:**
  1. The server unlinks and deletes the physical file from `uploads/vault_documents/` using `fs.unlinkSync()`.
  2. The user's `verificationStatus` is reset to `"unverified"`.
  3. The `documentDetails` subdocument is cleared to `null`.
  4. An immutable event is logged in `IdentityAudit`:
     ```javascript
     action: "document_deleted", performedBy: user._id, notes: "Right to erasure exercised."
     ```
