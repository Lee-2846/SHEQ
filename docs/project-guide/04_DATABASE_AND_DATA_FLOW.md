# 04 — Database Architecture, Schemas & Data Flow

---

## 1. Complete Database Models & Schemas Reference

All database models reside in `backend/src/models/` and are built using **Mongoose**, the Object Data Modeling (ODM) library for MongoDB.

```
                                  +-------------------+
                                  |      User         |
                                  |-------------------|
                                  | _id               |
                                  | email / phone     |
                                  | passwordHash      |
                                  | role (user/admin) |
                                  | verificationStatus|
                                  | documentDetails   |
                                  +---------+---------+
                                            |
                 +--------------------------+--------------------------+
                 | 1:N                      | 1:N                      | 1:N
                 v                          v                          v
      +--------------------+      +--------------------+      +--------------------+
      |       Report       |      |     SavedPlace     |      |   IdentityAudit    |
      |--------------------|      |--------------------|      |--------------------|
      | _id                |      | _id                |      | _id                |
      | reporterId (User)  |      | userId (User)      |      | userId (User)      |
      | category           |      | name               |      | action             |
      | location (2dsphere)|      | location (2dsphere)|      | performedBy (User) |
      | status             |      +--------------------+      | timestamp          |
      | confirmations      |                                  +--------------------+
      | disputes           |
      +---------+----------+
                |
        +-------+-------+
        | 1:N           | 1:N
        v               v
+---------------+ +------------------+
|    Comment    | |   Confirmation   |
|---------------| |------------------|
| _id           | | _id              |
| reportId      | | reportId         |
| authorId(User)| | userId (User)    |
| text          | | [UNIQUE COMPOUND]|
+---------------+ +------------------+
```

---

### A. `User.js` — Member & Administrator Accounts
* **Real-World Entity:** Represents a registered citizen, commuter, or safety administrator.
* **Key Fields:**
  * `name` (String, required, max 100): Full display name.
  * `email` (String, lowercase, trimmed, indexed, optional if phone used): Login and notification email.
  * `phone` (String, trimmed, optional if email used): Normalized E.164 phone number.
  * `passwordHash` (String, required, `select: false`): Bcrypt one-way hash with 10 salt rounds. Never returned in API queries by default.
  * `role` (String, enum: `["user", "admin"]`, default: `"user"`): Governs access to administrative portals.
  * `phoneVerified` (Boolean, default: `false`): True once SMS OTP is validated.
  * `verificationStatus` (String, enum: `["unverified", "pending", "pending_review", "verified", "rejected", "resubmission_required", "failed"]`, default: `"unverified"`): Tracks trusted identity verification.
  * `documentDetails` (Subdocument, `select: false` for storage path):
    * `originalName`: User-facing document filename (e.g. `Masked_Aadhaar.pdf`).
    * `storedName`: Unique UUID-based server disk filename (`userId_UUID.ext`).
    * `mimeType`: `application/pdf`, `image/png`, or `image/jpeg`.
    * `fileSize`: Size in bytes ($\le 5\text{ MB}$).
    * `storagePath`: Absolute path in private vault on server disk.
    * `sha256Hash`: 64-character hexadecimal SHA-256 integrity checksum.
    * `submittedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes`, `rejectionReason`.
  * `isActive` (Boolean, default: `true`).

---

### B. `Report.js` — Community Safety Incident Reports
* **Real-World Entity:** A community-submitted safety hazard, harassment occurrence, or infrastructure failure.
* **Key Fields:**
  * `category` (String, required, enum of 9 standard taxonomy categories):
    `"Poor Lighting Concern"`, `"Verbal Harassment"`, `"Stalking"`, `"Physical Harassment"`, `"Unsafe Public Area"`, `"Suspicious Activity"`, `"Public Transport Concern"`, `"Infrastructure Concern"`, `"Other Concern"`.
  * `description` (String, required, 5–5000 characters): Incident narrative.
  * `location` (GeoJSON Point, required):
    * `type`: Always `"Point"`.
    * `coordinates`: `[longitude, latitude]` in spherical WGS84 coordinates.
    * `label` (String, optional): Neighborhood or landmark name (e.g. `"Dadar West, Mumbai"`).
  * `status` (String, enum: `["Submitted", "Under Review", "Verified", "Resolved", "Flagged"]`, default: `"Submitted"`): Incident lifecycle stage.
  * `incidentAt` (Date, default: `Date.now`): When the incident physically took place.
  * `isAnonymousPublicly` (Boolean, default: `false`): When true, public endpoints strip reporter names.
  * `reporterId` (ObjectId referencing `User`, required): Secure internal audit trail.
  * `confirmations` (Number, default: `0`): Community corroboration count.
  * `disputes` (Number, default: `0`): Community dispute count.
  * `moderationNote` (String, optional): Internal notes recorded by administrators.
* **Indexes:**
  * `{ location: "2dsphere" }`: Critical index enabling MongoDB `$near` spherical distance queries within radius.
  * `{ status: 1, createdAt: -1 }`: Fast index for triage queries.

---

### C. `Confirmation.js` — Anti-Spam Community Confirmations
* **Real-World Entity:** A record that an authenticated user has corroborated a report.
* **Key Fields:**
  * `reportId` (ObjectId referencing `Report`, required).
  * `userId` (ObjectId referencing `User`, required).
  * `createdAt` (Date, default: `Date.now`).
* **Critical Index (Idempotency / Anti-Gaming):**
  * `{ reportId: 1, userId: 1 }` with `{ unique: true }`.
  * **Why it matters:** Guarantees at the database engine level that no user can confirm the same incident more than once. Attempting a duplicate confirmation throws MongoDB error code `11000` (handled by API returning `409 Conflict`).

---

### D. `Comment.js` — Community Context Notes
* **Real-World Entity:** Additions, follow-ups, or notes added by community members to a report.
* **Key Fields:**
  * `reportId` (ObjectId referencing `Report`, required).
  * `authorId` (ObjectId referencing `User`, required).
  * `text` (String, required, 2–2000 characters).
  * `moderationStatus` (String, enum: `["visible", "flagged", "removed"]`, default: `"visible"`).
* **Index:** `{ reportId: 1, createdAt: 1 }`.

---

### E. `EmailOtp.js` & `PhoneOtp.js` — Cryptographic One-Time Passcodes
* **Real-World Entity:** Temporary authentication challenge issued during signup or phone verification.
* **Key Fields:**
  * `email` or `phone` (String, indexed).
  * `otpHash` (String, required): Cryptographic HMAC-SHA256 hash of `email:otp` or `phone:otp`. Raw OTPs are never stored in the database.
  * `attemptsRemaining` (Number, default: `3`): Decremented on every invalid submission to prevent brute-force attacks.
  * `resendAvailableAt` (Date, required): Prevents SMS/email bombing; enforces a 60-second cooldown.
  * `expiresAt` (Date, required): Timestamp 10 minutes from generation.
* **Automatic Expiration Index:**
  * `{ expiresAt: 1 }` with `{ expireAfterSeconds: 0 }`.
  * **Why it matters:** MongoDB automatically purges expired OTP records from disk via an internal background TTL task.

---

### F. `Hotspot.js` — Safety Hotspot Clusters
* **Real-World Entity:** A geographic cluster flagged for heightened safety awareness.
* **Key Fields:**
  * `label` (String, max 250): Name of the area (e.g. `"Bandra Station East Cluster"`).
  * `center` (GeoJSON Point, required): `[longitude, latitude]`.
  * `score` (Number, min 0, max 100): Composite provisional score.
  * `state` (String, enum: `["candidate", "designated", "dismissed", "inactive"]`, default: `"candidate"`):
    * Only `designated` hotspots are publicly returned to the community map.
  * `evidenceReportIds` (Array of ObjectIds referencing `Report`).
  * `factors` (Mixed object): Feature breakdown (volume, recency, severity, confirmations, ML confidence).
  * `rationale` (String): Justification for designation.
  * `reviewedBy` (ObjectId referencing `User`, admin).
  * `reviewedAt` (Date).
* **Index:** `{ center: "2dsphere" }`.

---

### G. `SavedPlace.js` — Personalized User Locations
* **Real-World Entity:** Frequent commuter hubs (Home, Work, College, Gym).
* **Key Fields:**
  * `userId` (ObjectId referencing `User`, required).
  * `name` (String, required, max 100): E.g. `"Home"`.
  * `label` (String, max 250): Physical address or landmark.
  * `location` (GeoJSON Point, required): `[longitude, latitude]`.
* **Index:** `{ location: "2dsphere" }`, `{ userId: 1 }`.

---

### H. `IdentityAudit.js` — Statutory Compliance Trail
* **Real-World Entity:** Immutable log of every action taken on submitted identity documents.
* **Key Fields:**
  * `userId` (ObjectId referencing `User` whose document was acted upon).
  * `action` (String, enum: `["document_uploaded", "document_accessed", "decision_verified", "decision_rejected", "decision_resubmission", "document_deleted"]`).
  * `performedBy` (ObjectId referencing `User`).
  * `performedByRole` (String): E.g. `"admin"` or `"user"`.
  * `ipAddress` (String).
  * `notes` (String).
  * `createdAt` (Date, default: `Date.now`).

---

### I. `Escalation.js` — Civic & Emergency Records
* **Real-World Entity:** Administrative escalation to municipal or emergency authorities, or internal emergency SOS audit records.
* **Key Fields:**
  * `title` (String, required, max 250).
  * `summary` (String, required, max 5000).
  * `category` (String, optional): E.g. `"Emergency SOS"`, `"Infrastructure"`.
  * `status` (String, enum: `["draft", "under_review", "prepared_for_external_escalation", "closed"]`, default: `"draft"`).
  * `locationLabel` (String).
  * `evidenceContext` (String).
  * `adminNotes` (String).
  * `createdBy` (ObjectId referencing `User`).

---

## 2. Where Is Data Stored? (The 6 Storage Layers)

To answer viva questions accurately, understand that SHEQ stores data across **6 distinct layers**:

```
+------------------------------------------------------------------------------------+
| 1. React Component State (Memory)                                                  |
|    - Location: Browser RAM                                                         |
|    - Examples: Search input, modal toggle (sosModalOpen), activeTab                |
|    - Lifecycle: Destroyed on page refresh or route unmount                         |
+------------------------------------------------------------------------------------+
| 2. React Context (DataContext & AuthContext)                                       |
|    - Location: Browser RAM (Global frontend state)                                 |
|    - Examples: Active user, mock incident dataset, live calculated stats           |
|    - Lifecycle: Persists across page transitions; resets on browser refresh        |
+------------------------------------------------------------------------------------+
| 3. Browser localStorage                                                            |
|    - Location: Browser persistent disk storage                                    |
|    - Key: sheq_emergency_contacts                                                  |
|    - Lifecycle: Survives page refreshes and browser restarts                       |
+------------------------------------------------------------------------------------+
| 4. Backend In-Memory Cache (RAM)                                                   |
|    - Location: Node.js server RAM                                                  |
|    - Examples: 100 Random Forest decision trees, cached infrastructure GeoJSONs   |
|    - Lifecycle: Cleared if server restarts; instantly reloaded on demand          |
+------------------------------------------------------------------------------------+
| 5. MongoDB Database (sheq_dev)                                                     |
|    - Location: Persistent NoSQL database files (C:\data\db or MongoDB engine)      |
|    - Collections: users, reports, hotspots, phoneotps, emailotps, confirmations    |
|    - Lifecycle: Permanent; survives server and machine reboots                     |
+------------------------------------------------------------------------------------+
| 6. Private Server Document Vault                                                   |
|    - Location: backend/uploads/vault_documents/ (Local disk filesystem)            |
|    - Permissions: 0o600 (owner read/write only, outside public web directory)      |
|    - Lifecycle: Permanent until deleted via Right to Erasure action                |
+------------------------------------------------------------------------------------+
```

---

## 3. The Complete Incident Report Data Lifecycle

Trace how a single incident report moves through the entire system:

```
[ Step 1: User Submits ]
User fills form on /report -> selects "Poor Lighting Concern" -> clicks location on map ->
clicks "Submit Incident" -> handleCreateReport() in src/pages/ReportIncident.jsx runs.
         |
         v
[ Step 2: Frontend State Update ]
addReport() in src/context/DataContext.jsx is called ->
New report object prepended to reports array in DataContext ->
Stats useMemo() hook triggers: totalReports increments, stats recalculate instantly.
         |
         v
[ Step 3: Backend REST Persistence ]
Frontend reportService.js calls POST http://localhost:5000/api/reports with JSON payload ->
backend/src/middleware/auth.js verifies Bearer JWT token ->
backend/src/routes/reports.js validates coordinates and category via Zod ->
Report.create() stores document in MongoDB collection 'reports' with 2dsphere Point.
         |
         v
[ Step 4: Community Map & Incident Details ]
User navigates to /map -> SafetyMap.jsx queries DataContext reports ->
Leaflet creates customized SVG marker based on category color ->
Clicking marker opens sidebar with ReportCard.jsx ->
Clicking card navigates to /incident/:id ->
IncidentDetails.jsx loads incident, comments, confirmations, and StatusStepper.
         |
         v
[ Step 5: Community Engagement ]
Neighbor clicks "Confirm Report" ->
Frontend calls confirmReport() and POST /api/reports/:id/confirm ->
MongoDB atomically creates unique Confirmation record and increments confirmations counter.
         |
         v
[ Step 6: ML Hotspot Clustering & Admin Review ]
Admin opens /admin/hotspots ->
calculateHotspotCandidates() groups spatial grid (~220m) ->
mlHotspotInference.js scores candidate with 100-tree Random Forest ->
Admin reviews breakdown and clicks "Designate Hotspot" ->
PATCH /api/hotspots/:id/review updates state to 'designated' ->
Hotspot is now permanently active on the public community Safety Map.
```

---

## 4. What Happens During Failure Scenarios?

* **Scenario A: Browser is Refreshed (`F5`):**
  * `DataContext` memory resets to initial `mockData.js` values.
  * However, `contacts` are restored from `localStorage`.
  * `AuthContext` checks if a token exists in `localStorage`/`sessionStorage` and re-authenticates the session with `GET /api/auth/me`.
* **Scenario B: Backend Server Restarts (`node src/server.js` restarts):**
  * Express RAM cache clears.
  * All database records in MongoDB remain completely safe and intact.
  * In-memory ML trees reload in <1 millisecond upon the next candidate query.
  * Uploaded documents in `uploads/vault_documents/` remain completely safe on disk.
* **Scenario C: MongoDB Database Goes Down:**
  * `server.js` connection fails or drops.
  * Heartbeat `GET /api/health` returns HTTP `503 Service Unavailable` (`status: "degraded", database: "disconnected"`).
  * API endpoints return `500 Database operation failed`.
  * The frontend still renders its initial client view from `DataContext` mock data, demonstrating resilient offline/degraded operation.
