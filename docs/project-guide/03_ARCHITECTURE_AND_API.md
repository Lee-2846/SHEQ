# 03 — Application Architecture & Backend API Reference

---

## 1. How SHEQ Works From Start to Finish (The Airport Analogy)

To explain SHEQ's architecture simply in a viva, use the **Airport Analogy**:

1. **The Passenger (User Browser):** A commuter opens the SHEQ website on their phone or laptop.
2. **The Terminal Gate (React Frontend / Vite):** Displays screens (Landing, Safety Map, Report Incident). React renders the visual interface and captures clicks or form inputs.
3. **The Airport Security & Customs (Express Middleware):** When the passenger wants to do something sensitive (like report an incident or view private documents), their request must pass security checkpoints:
   * **CORS Middleware:** Ensures the passenger came from an approved origin.
   * **Rate Limiter:** Ensures one person isn't flooding the gate with 500 requests a second.
   * **Authentication Middleware (`requireAuth`):** Checks their passport/boarding pass (the **JWT Bearer Token**). If valid, lets them through; if missing or forged, returns `401 Unauthorized`.
4. **The Flight Attendant / Gate Agent (Route Handler & Controller):** Receives the validated request, inspects the payload using strict schema rules (**Zod**), and tells the kitchen or luggage department what to do.
5. **The Specialized Ground Crew (Services):**
   * **Email/SMS Service:** Sends one-time passcodes via SMTP or Twilio.
   * **ML Inference Service:** Evaluates 100 decision trees to assess spatial proximity and risk patterns.
6. **The Vault & Baggage Handling (MongoDB & File System):**
   * MongoDB stores structured records (users, incidents, coordinates, confirmations).
   * The private server vault stores encrypted identity documents outside public web access.
7. **The Return Journey (HTTP Response):** The server sends back clean JSON data. React receives the JSON, updates its component state, and the screen smoothly updates without a full page reload.

---

## 2. Component Concepts: Route vs Controller vs Service vs Model vs Middleware

| Concept | What It Does | Analogy | Where to Find in SHEQ |
| :--- | :--- | :--- | :--- |
| **Frontend Route** | Maps a browser URL (`/map`, `/profile`) to a React page component. | Choosing which TV channel to watch. | `src/App.jsx` |
| **Backend API Route** | Maps an HTTP method + URL (`POST /api/reports`) to a server handler function. | A receptionist directing a visitor to an office desk. | `backend/src/routes/*.js` |
| **Middleware** | A function that inspects or alters a request before the main handler runs (e.g. checking auth, rate limiting). | Airport security scanner checking tickets before boarding. | `backend/src/middleware/auth.js` |
| **Controller / Handler** | Extracts inputs from `req.body` or `req.params`, orchestrates business logic, and sends the HTTP response (`res.json()`). | The office manager completing a task and handing you a receipt. | Handler functions in `backend/src/routes/*.js` |
| **Service** | A specialized, reusable module that does heavy lifting (e.g. ML inference, SMS dispatch, SMTP delivery). | A specialized technician called in by the office manager. | `backend/src/services/*.js` |
| **Database Model** | Defines the structure, data types, validation rules, and indexes of documents in MongoDB. | The official blueprint and schema form for records in a filing cabinet. | `backend/src/models/*.js` |

---

## 3. Master Backend API Directory

All backend endpoints are mounted under the `/api` prefix by `backend/src/app.js`.

### A. Health & System Status (`/api/health`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | `routes/health.js` | Inline router | No | None | Returns `{ status: "ok", service: "sheq-api", database: "connected" }` with 200 or 503 status code. |

---

### B. Authentication & User Profile (`/api/auth`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup/initiate` | `routes/auth.js` | `handleSignupInitiation` | No (Rate-limited) | JSON `{ name, email, phone, password }` | Validates complexity, hashes OTP with HMAC-SHA256, sends OTP via SMTP/SMS, saves to EmailOtp/PhoneOtp. |
| `POST` | `/api/auth/signup/verify` | `routes/auth.js` | Inline router | No | JSON `{ email/phone, otp, name, password }` | Compares OTP hash, creates new `User` document in MongoDB, issues 7-day signed JWT token. |
| `POST` | `/api/auth/signup/resend-otp` | `routes/auth.js` | Inline router | No | JSON `{ email/phone }` | Checks 60s cooldown timestamp, generates new OTP, updates pending record, resends message. |
| `POST` | `/api/auth/login` | `routes/auth.js` | Inline router | No (Rate-limited) | JSON `{ identifier, password }` | Queries user by lowercase email or normalized phone, verifies password via `bcrypt.compare`, returns JWT. |
| `POST` | `/api/auth/phone/initiate` | `routes/auth.js` | Inline router | Yes (`requireAuth`) | JSON `{ phone }` | Generates 6-digit SMS OTP, hashes via HMAC-SHA256, saves to PhoneOtp collection, dispatches SMS via provider. |
| `POST` | `/api/auth/phone/verify` | `routes/auth.js` | Inline router | Yes (`requireAuth`) | JSON `{ phone, otp }` | Compares OTP hash, updates `user.phoneVerified = true` and `user.phone`, returns updated sanitized user. |
| `POST` | `/api/auth/phone/resend` | `routes/auth.js` | Inline router | Yes (`requireAuth`) | JSON `{ phone }` | Re-checks cooldown, generates new OTP code, attempts carrier transmission. |
| `GET` | `/api/auth/phone/status` | `routes/auth.js` | Inline router | No | None | Returns SMS provider readiness diagnostics (`{ configured: boolean, provider: string, notice: string }`). |
| `GET` | `/api/auth/me` | `routes/auth.js` | Inline router | Yes (`requireAuth`) | Header `Authorization: Bearer <jwt>` | Returns sanitized profile for currently authenticated user (`publicUser(user)`). |
| `PATCH` | `/api/auth/me` | `routes/auth.js` | Inline router | Yes (`requireAuth`) | JSON `{ name, phone, language }` | Updates profile details and returns sanitized updated user record. |
| `POST` | `/api/auth/logout` | `routes/auth.js` | Inline router | Yes (`requireAuth`) | None | Stateless acknowledgment confirming client session termination. |

---

### C. Community Incident Reports (`/api/reports`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | `routes/reports.js` | Inline router | Optional (`optionalAuth`) | Query params `status, category, nearLon, nearLat, maxDistance, limit` | Returns filtered reports. Strips internal moderation notes and reporter ID from public view. Supports MongoDB `$near` 2dsphere spatial search. |
| `POST` | `/api/reports` | `routes/reports.js` | Inline router | Yes (`requireAuth`) | JSON `{ category, description, longitude, latitude, locationLabel, incidentAt, isAnonymousPublicly }` | Validates category against standard 9 taxonomy, creates GeoJSON Point report, stores `reporterId: req.user._id`. |
| `GET` | `/api/reports/:id/comments` | `routes/reports.js` | Inline router | Yes (`requireAuth`) | URL param `:id` | Returns all visible comments for report, sorted chronologically. Strips author ID for privacy. |
| `POST` | `/api/reports/:id/comments` | `routes/reports.js` | Inline router | Yes (`requireAuth`) | JSON `{ text }` (2–2000 chars) | Creates `Comment` document linked to report and authenticated user. |
| `POST` | `/api/reports/:id/confirm` | `routes/reports.js` | Inline router | Yes (`requireAuth`) | URL param `:id` | Atomically creates unique `Confirmation` record (rejects duplicate confirms with 409), increments `confirmations` counter. |
| `POST` | `/api/reports/:id/dispute` | `routes/reports.js` | Inline router | Yes (`requireAuth`) | JSON `{ reason, details }` | Increments `disputes` counter on report, saves dispute for admin review. |
| `PATCH` | `/api/reports/:id/moderation` | `routes/reports.js` | Inline router | Yes (`requireAdmin`) | JSON `{ status, moderationNote }` | Admin-only triage: updates status (`Submitted`, `Under Review`, `Verified`, `Resolved`, `Flagged`). |

---

### D. Private Identity Document Vault (`/api/identity`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/identity/my-status` | `routes/identity.js` | Inline router | Yes (`requireAuth`) | None | Returns user's verification status, phone verified flag, review notes, and legal compliance disclosure. |
| `POST` | `/api/identity/upload-document` | `routes/identity.js` | `upload.single("document")` | Yes (`requireAuth`) | Multipart Form-Data `document` (PDF/PNG/JPEG $\le 5$MB) + `consent: true` | Validates magic bytes, computes SHA-256 hash, saves file to private vault (`uploads/vault_documents/`) with `0o600` permissions, sets status to `pending_review`, creates `IdentityAudit` entry. |
| `GET` | `/api/identity/document/:userId` | `routes/identity.js` | Inline router | Yes (Owner or Admin) | URL param `:userId` | Validates owner or admin identity, logs access in `IdentityAudit`, streams file with `nosniff` and no-cache headers. Zero public static access. |
| `GET` | `/api/identity/pending` | `routes/identity.js` | Inline router | Yes (`requireAdmin`) | None | Admin review queue: lists members awaiting identity review with metadata and submission dates. |
| `PATCH` | `/api/identity/review/:userId` | `routes/identity.js` | Inline router | Yes (`requireAdmin`) | JSON `{ decision, notes, rejectionReason }` | Updates user `verificationStatus` to `verified`, `rejected`, or `resubmission_required`, records decision in audit log. |
| `DELETE` | `/api/identity/document` | `routes/identity.js` | Inline router | Yes (`requireAuth`) | None | **Right to Erasure:** Deletes stored document from server disk vault, resets user status to `unverified`, nullifies metadata, records deletion in audit log. |
| `GET` | `/api/identity/audit-logs` | `routes/identity.js` | Inline router | Yes (`requireAdmin`) | None | Returns compliance audit trail showing all document uploads, views, decisions, and deletions. |

---

### E. Hotspots & Machine Learning Candidates (`/api/hotspots`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/hotspots/benchmark` | `routes/hotspots.js` | `getHotspotBenchmark()` | No | None | Returns ML model evaluation metrics (74.0% accuracy, 0.7509 ROC-AUC, 100 trees, scientific limitations). |
| `GET` | `/api/hotspots` | `routes/hotspots.js` | Inline router | Optional (`optionalAuth`) | None | Returns officially designated active hotspots (`state: "designated"`). Only these appear on the public Safety Map. |
| `GET` | `/api/hotspots/candidates` | `routes/hotspots.js` | `calculateHotspotCandidates()` | Yes (`requireAdmin`) | Query param `days` (default 30) | Runs spatial grid clustering on reports, invokes in-memory Random Forest model, computes Haversine proximities, returns provisional candidates. |
| `POST` | `/api/hotspots/candidates/save` | `routes/hotspots.js` | Inline router | Yes (`requireAdmin`) | JSON candidate payload | Saves candidate cluster as a `Hotspot` record with `state: "candidate"`. |
| `PATCH` | `/api/hotspots/:id/review` | `routes/hotspots.js` | Inline router | Yes (`requireAdmin`) | JSON `{ state: "designated" / "dismissed" / "inactive", rationale }` | **Administrative Promotion Gate:** Formally promotes candidate to official public hotspot. |

---

### F. Emergency Escalations & SOS (`/api/escalations`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/escalations/sos-status` | `routes/escalations.js` | Inline router | No | None | Returns server SMS provider status, WhatsApp readiness, and emergency disclaimers. |
| `POST` | `/api/escalations/sos-alert` | `routes/escalations.js` | Inline router | Yes (`requireAuth`) | JSON `{ coordinates: { lat, lng, accuracy }, isStale, contacts: [{ name, phone }] }` | Validates coordinates, appends `[Cached/Stale GPS]` if coordinates >60s old, dispatches SMS via Twilio if configured, records internal `Escalation` audit entry, returns prefilled direct `sms:` and WhatsApp links. |
| `GET` | `/api/escalations` | `routes/escalations.js` | Inline router | Yes (`requireAdmin`) | None | Returns agency escalation records (police, municipal, medical) sorted by date. |
| `POST` | `/api/escalations` | `routes/escalations.js` | Inline router | Yes (`requireAdmin`) | JSON `{ title, summary, category, locationLabel, evidenceContext }` | Records new external escalation log for administrative agency tracking. |
| `PATCH` | `/api/escalations/:id` | `routes/escalations.js` | Inline router | Yes (`requireAdmin`) | JSON `{ status, adminNotes }` | Updates escalation status (`draft`, `under_review`, `prepared_for_external_escalation`, `closed`). |

---

### G. Saved Places & Localized Insights (`/api/places`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/places` | `routes/places.js` | Inline router | Yes (`requireAuth`) | None | Returns all saved places (Home, College, Work) created by the logged-in user. |
| `POST` | `/api/places` | `routes/places.js` | Inline router | Yes (`requireAuth`) | JSON `{ name, label, longitude, latitude }` | Saves a new location with 2dsphere GeoJSON point. |
| `DELETE` | `/api/places/:id` | `routes/places.js` | Inline router | Yes (`requireAuth`) | URL param `:id` | Deletes saved place belonging to the authenticated user. |
| `GET` | `/api/places/:id/insights` | `routes/places.js` | Inline router | Yes (`requireAuth`) | URL param `:id` | Queries MongoDB for reports within 2000m ($2\text{ km}$) radius in the last 30 days, returns count and breakdown. |

---

### H. Infrastructure Context Layers (`/api/infrastructure`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/infrastructure/summary` | `routes/infrastructure.js`| Inline router | No | None | Returns total counts of mapped police stations, streetlights, and bus stops in Mumbai & Navi Mumbai. |
| `GET` | `/api/infrastructure/police-stations`| `routes/infrastructure.js`| Inline router | No | None | Returns GeoJSON FeatureCollection of Mumbai police stations from in-memory cached file. |
| `GET` | `/api/infrastructure/streetlights` | `routes/infrastructure.js`| Inline router | No | None | Returns GeoJSON FeatureCollection of mapped streetlights. |
| `GET` | `/api/infrastructure/bus-stops` | `routes/infrastructure.js`| Inline router | No | None | Returns GeoJSON FeatureCollection of bus stops. |

---

### I. Analytics & Metrics (`/api/analytics`)

| HTTP Method | Full Path | Route File | Handler | Auth Required? | Input | Output / Side Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/admin` | `routes/analytics.js` | Inline router | Yes (`requireAdmin`) | None | Runs MongoDB `$group` aggregation pipeline: returns total reports, reports in last 30 days, breakdown by status, breakdown by category, visible comments, and active hotspots. |
