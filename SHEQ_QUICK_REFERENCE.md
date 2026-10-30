# SHEQ — Complete Quick Reference & Viva Cheat Sheet

> **One-Page Master Cheat Sheet** for the SHEQ (Safety, Health, Equity & Quality) Women & Commuter Safety Platform.  
> Keep this document open on your screen during your project presentation and viva examination.

---

## 1. Complete Architecture in One Diagram

```
+-------------------------------------------------------------------------------------------------------------+
|                                              BROWSER CLIENT                                                 |
|                                                                                                             |
|  [React 19 SPA + Vite 7]                    [React Router v7]                      [React Context API]       |
|  - Index.html (Vite entry)                  - Public: /, /login, /signup           - AuthContext (JWT, user)|
|  - App.jsx (Route definitions)              - User: /dashboard, /map, /report, /sos- DataContext (Reports)  |
|  - Leaflet Map (OSM tiles)                  - Admin: /admin, /admin/hotspots       - ThemeContext (Styling) |
+-------------------------------------------------------------------------------------------------------------+
                                                     |
                     HTTP / JSON REST API Calls (Axios / Fetch) -> http://localhost:5000/api
                                                     |
+-------------------------------------------------------------------------------------------------------------+
|                                          EXPRESS 4.21 BACKEND                                               |
|                                                                                                             |
|  [Entry Point: src/server.js -> src/app.js]                                                                 |
|  Middleware Pipeline:                                                                                       |
|  1. helmet()                 -> Security HTTP response headers                                              |
|  2. cors()                   -> Cross-Origin Resource Sharing (port 5173 / 3000)                            |
|  3. express.json({limit: 1mb})-> Parses incoming JSON request bodies                                        |
|  4. rateLimit()              -> Brute-force & DDoS rate limiting                                            |
|                                                                                                             |
|  [Route Controllers & Mounting]:                                                                            |
|  /api/auth          -> auth.js          -> Bcrypt + JWT + HMAC OTP + Resend Email API                       |
|  /api/reports       -> reports.js       -> Geospatial CRUD + Confirmations + Disputes                      |
|  /api/identity      -> identity.js      -> Multer Magic-Byte Validation + Private File Vault               |
|  /api/hotspots      -> hotspots.js      -> Candidate Scoring (50% ML + 50% Community) + Admin Approval      |
|  /api/escalations   -> escalations.js   -> Internal Audit Logging of NGO / Municipal Escalations           |
|  /api/places        -> places.js        -> Saved User Safe Locations                                        |
|  /api/infrastructure-> infrastructure.js-> Transit, Hospital & Police Station GeoJSON Feeds                |
|  /api/analytics     -> analytics.js     -> Dashboard KPI Aggregations & Category Breakdowns                 |
|  /api/health        -> health.js        -> Process Liveness & MongoDB Heartbeat                             |
|                                                                                                             |
|  Global Error Handler Middleware (src/middleware/errorHandler.js)                                           |
+-------------------------------------------------------------------------------------------------------------+
        |                                       |                                         |
        v                                       v                                         v
+-----------------------+           +-----------------------+                 +-----------------------+
|   MONGODB DATABASE    |           | PRIVATE SECURE VAULT  |                 |  IN-MEMORY ML ENGINE  |
|                       |           |                       |                 |                       |
|  Mongoose 8.9 Models: |           | Path: backend/uploads/|                 | Pure Node.js Runtime  |
|  - User               |           |       vault_documents/|                 | - mlHotspotInference  |
|  - IncidentReport     |           | - Strictly off web    |                 | - 100 Decision Trees  |
|    (2dsphere Index)   |           | - Magic byte verified |                 | - Scikit-Learn export |
|  - Confirmation       |           | - 0o600 OS permissions|                 | - Latency < 1ms       |
|    (Unique Compound)  |           | - SHA-256 Checksummed |                 | - 12 Feature Vectors  |
|  - HotspotZone        |           | - Streamed to Admin   |                 +-----------------------+
|  - EscalationLog      |           +-----------------------+
|  - AuditLog           |
+-----------------------+
```

---

## 2. The 20 Most Important Files to Memorize

| # | Exact File Path | Layer | What It Does & Why You Should Open It |
|---|---|---|---|
| 1 | [src/main.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/main.jsx) | Frontend | Root React entry point; mounts `<App />` into the DOM. |
| 2 | [src/App.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/App.jsx) | Frontend | Main router; defines all 13 routes and wraps them with `<ProtectedRoute>` and `<AdminRoute>`. |
| 3 | [src/context/AuthContext.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/context/AuthContext.jsx) | Frontend | Manages login state, JWT storage in memory/storage, and user profile data. |
| 4 | [src/context/DataContext.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/context/DataContext.jsx) | Frontend | State store for incident reports, optimistic confirmation updates, and mock fallbacks. |
| 5 | [src/pages/SafetyMap.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/pages/SafetyMap.jsx) | Frontend | Interactive Leaflet map rendering incident pins, danger circles, and search geocoding. |
| 6 | [src/pages/ReportIncident.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/pages/ReportIncident.jsx) | Frontend | 4-step report submission wizard (category, location, evidence, anonymous toggle). |
| 7 | [src/pages/SOS.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/pages/SOS.jsx) | Frontend | Emergency dispatch; acquires one-shot GPS and builds SMS/WhatsApp/Call deep links. |
| 8 | [src/pages/admin/AdminDashboard.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/pages/admin/AdminDashboard.jsx) | Frontend | Admin moderation hub; review reports, approve hotspot candidates, and inspect vault docs. |
| 9 | [backend/src/server.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/server.js) | Backend | Server entry point; initializes MongoDB connection, starts Express on port 5000. |
| 10 | [backend/src/app.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/app.js) | Backend | Express application factory; configures CORS, Helmet, JSON parsing, and mounts all routes. |
| 11 | [backend/src/routes/auth.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/routes/auth.js) | Backend | Authentication endpoints (Signup, Login, OTP generate, OTP verify, Phone OTP). |
| 12 | [backend/src/routes/reports.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/routes/reports.js) | Backend | Geospatial CRUD for incidents, community confirmations, dispute handling, and filtering. |
| 13 | [backend/src/routes/identity.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/routes/identity.js) | Backend | Upload handler for Aadhaar PNG/PDF; validates file bytes and streams securely to Admin. |
| 14 | [backend/src/routes/hotspots.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/routes/hotspots.js) | Backend | Triggers candidate scoring, returns active hotspots, and processes Admin approvals. |
| 15 | [backend/src/services/identityVaultService.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/identityVaultService.js) | Backend | Private file vault manager; checks magic bytes, SHA-256 hash, and enforces `0o600` access. |
| 16 | [backend/src/services/mlHotspotInference.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/mlHotspotInference.js) | Backend | Pure JavaScript Random Forest inference engine; evaluates 100 decision trees in <1ms. |
| 17 | [backend/src/services/hotspotCandidateService.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/hotspotCandidateService.js) | Backend | Balanced scoring formula: combines 50 pts ML probability + 50 pts community evidence. |
| 18 | [backend/src/services/emailService.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/emailService.js) | Backend | Email dispatcher using Resend API with timing-safe error handling and dev console fallback. |
| 19 | [backend/src/utils/security.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/utils/security.js) | Backend | Cryptographic utilities: Bcrypt hashing, HMAC-SHA256 OTP hashing, and `timingSafeEqual`. |
| 20 | [backend/src/models/IncidentReport.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/models/IncidentReport.js) | Database | Primary Mongoose schema with GeoJSON Point coordinates and `2dsphere` index. |

---

## 3. The 15 Most Important Functions & Components

| # | Symbol Name | File Path | What It Does |
|---|---|---|---|
| 1 | `<ProtectedRoute>` | [src/App.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/App.jsx) | Checks if user is authenticated; redirects unauthenticated visitors to `/login`. |
| 2 | `<AdminRoute>` | [src/App.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/App.jsx) | Verifies user has `role === 'admin'`; redirects standard users to `/dashboard`. |
| 3 | `handleQuickSOS` | [src/pages/Dashboard.jsx](file:///c:/Users/DELL/Desktop/SHEQ/src/pages/Dashboard.jsx) | Reads emergency contacts from `localStorage`, fetches current GPS, and sends alerts. |
| 4 | `storeDocumentSecurely` | [backend/src/services/identityVaultService.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/identityVaultService.js) | Inspects magic bytes, calculates SHA-256 checksum, saves file to private vault with `0o600`. |
| 5 | `predictHotspotProbability` | [backend/src/services/mlHotspotInference.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/mlHotspotInference.js) | Executes in-memory traversal across 100 decision trees to return risk probability [0, 1]. |
| 6 | `calculateCandidateScore` | [backend/src/services/hotspotCandidateService.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/hotspotCandidateService.js) | Combines ML risk score (0-50 pts) with community reports (0-50 pts) to produce total score. |
| 7 | `hashOtp` | [backend/src/utils/security.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/utils/security.js) | Converts plaintext OTP to HMAC-SHA256 digest so raw OTPs are never stored. |
| 8 | `verifyOtpHash` | [backend/src/utils/security.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/utils/security.js) | Performs constant-time comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks. |
| 9 | `publicReport` | [backend/src/utils/privacy.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/utils/privacy.js) | Redacts reporter personal details (`userId`, `name`, `phone`) when `isAnonymous` is true. |
| 10 | `sendOtpEmail` | [backend/src/services/emailService.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/emailService.js) | Sends HTML email via Resend API; prints OTP to terminal console in development. |
| 11 | `authenticate` | [backend/src/middleware/auth.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/middleware/auth.js) | Validates Bearer JWT header and attaches decoded user payload to `req.user`. |
| 12 | `requireAdmin` | [backend/src/middleware/auth.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/middleware/auth.js) | Rejects non-admin requests with HTTP 403 Forbidden. |
| 13 | `formatE164IndianMobile` | [backend/src/services/smsService.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/smsService.js) | Normalizes Indian 10-digit mobile numbers into international `+91` format. |
| 14 | `haversineDistanceMeters` | [backend/src/services/mlHotspotInference.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/services/mlHotspotInference.js) | Mathematical formula calculating great-circle distance between two GPS coordinates. |
| 15 | `errorHandler` | [backend/src/middleware/errorHandler.js](file:///c:/Users/DELL/Desktop/SHEQ/backend/src/middleware/errorHandler.js) | Catches unhandled errors, formats JSON response, and prevents server crashes. |

---

## 4. API Base URL & Essential Endpoints

- **Base URL:** `http://localhost:5000/api`
- **Default Frontend Port:** `http://localhost:5173`

| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register-request` | No | Validates signup info, stores pending user with hashed password, sends OTP. |
| `POST` | `/api/auth/register-verify` | No | Validates OTP hash; activates user in MongoDB and issues JWT token. |
| `POST` | `/api/auth/login` | No | Compares bcrypt password; returns signed JWT and user profile. |
| `GET` | `/api/auth/me` | Bearer JWT | Returns current authenticated user profile. |
| `GET` | `/api/reports` | Optional | Fetches incident reports filtered by category, status, or bounding box. |
| `POST` | `/api/reports` | Bearer JWT | Creates new incident report with GeoJSON coordinates. |
| `POST` | `/api/reports/:id/confirm` | Bearer JWT | Upvotes/confirms incident report (atomic `$inc` with duplicate protection). |
| `POST` | `/api/reports/:id/dispute` | Bearer JWT | Registers community dispute with reason text. |
| `POST` | `/api/identity/upload-document`| Bearer JWT | Uploads masked Aadhaar PNG/PDF to private vault. |
| `GET` | `/api/identity/document/:userId`| Admin Only | Streams private identity document to Admin for verification. |
| `GET` | `/api/hotspots/candidates` | Bearer JWT | Returns algorithmic hotspot proposals (ML + Community score). |
| `POST` | `/api/hotspots/designate` | Admin Only | Officially designates a high-risk zone and assigns police beats. |
| `GET` | `/api/health` | No | Liveness probe; returns server uptime and database connection status. |

---

## 5. Exact Terminal Commands

```bash
# 1. Start Backend Server (runs on http://localhost:5000 with auto-reload)
cd backend
npm run dev

# 2. Start Frontend Server (runs on http://localhost:5173 with Vite HMR)
cd ..
npm run dev

# 3. Run Backend Automated Test Suite (runs 42 tests across 9 test files)
cd backend
npm test

# 4. Seed Admin Account (creates admin user if not already existing)
cd backend
npm run seed:admin

# 5. Import Mumbai Infrastructure GeoJSON (Transit, police stations, hospitals)
cd backend
npm run import:geojson

# 6. Train Machine Learning Model (re-generates hotspot_rf_model.json)
cd backend
npm run pipeline:datasets
```

---

## 6. Top 10 High-Impact Viva Facts to Memorize

1. **Why Pure Node.js ML Inference?** We avoid spawning slow Python child processes (`child_process.exec`) during live HTTP requests. Scikit-Learn exports 100 decision trees to JSON, and Node.js traverses array pointers in RAM in under 1 millisecond.
2. **How is Aadhaar Protected?** It is stored in `backend/uploads/vault_documents/` completely outside the public web root. OS file permissions are locked to `0o600` (read/write only by the process owner). Files are never accessible via static URLs; they are streamed through an Admin-authenticated Express route.
3. **Magic Byte Security:** Attackers cannot upload `.exe` or `.js` files renamed to `.png`. The backend inspects the first 4–8 bytes of the binary buffer (`\x89PNG`, `%PDF`, `\xFF\xD8\xFF`) before writing anything to disk.
4. **Candidate-Only ML Contract:** The ML algorithm **never** marks an area as an official danger zone automatically. It produces a "candidate proposal". An Admin must review community context and officially designate it to prevent false panic.
5. **Balanced Hotspot Formula:** 50 points from the Random Forest probability score (infrastructure proximity, crime trends) + 50 points from live community evidence (report frequency, community confirmations). Total: 0–100 score.
6. **Timing Attack Protection:** OTP verification uses `crypto.timingSafeEqual` instead of `===`. A standard string comparison exits early on the first mismatched character, allowing hackers to deduce digits by measuring nanosecond response times.
7. **One-Shot GPS Contract:** SHEQ does **not** track users continuously in the background (which drains battery and violates privacy). GPS is accessed once when the user opens the SOS or Report Incident page via `navigator.geolocation.getCurrentPosition`.
8. **Double-Confirmation Prevention:** MongoDB enforces a unique compound index on `{ reportId: 1, userId: 1 }` in the `Confirmation` collection. A user can never artificially inflate report counts by clicking "Confirm" multiple times.
9. **Anonymous Reporting Reality:** When `isAnonymous` is checked, the backend strips `userId`, `name`, `phone`, and `email` before returning the document to frontend clients. The report displays as `"Anonymous Citizen"`.
10. **Resend Email Sandbox Reality:** Resend limits free test accounts to sending emails only to the account owner (`kotkar.au@gmail.com`). To prevent testing deadlocks, SHEQ catches the delivery error and prints the generated OTP directly to the backend terminal console.

---

## 7. Known Limitations & Honest Academic Scope

- **Synthetic ML Training Data:** The model was trained on 500 synthetic records calibrated against Mumbai Police statistics. Real street-level FIRs are not publicly accessible due to Indian privacy regulations.
- **Client-Assisted SOS vs Government CAD:** In this academic version, SOS dispatches via mobile URI links (`sms:`, `tel:`, `wa.me`). Direct integration with Dial 112 CAD requires government agency memorandum of understanding (MoU).
- **Local Disk Vault vs Cloud KMS:** Identity documents are currently saved to the local server disk vault (`0o600`). In city-wide production, this will be migrated to AWS S3 with KMS client-side envelope encryption.

---

## 8. Complete Project Guide Navigation

For full, in-depth explanations, open the comprehensive guides inside `docs/project-guide/`:

1. [01_PROJECT_OVERVIEW.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/01_PROJECT_OVERVIEW.md) — Platform purpose, commuter/admin personas, full tech stack.
2. [02_COMPLETE_FILE_MAP.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/02_COMPLETE_FILE_MAP.md) — Directory tree and 29-row "Where Is Everything?" index.
3. [03_ARCHITECTURE_AND_API.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/03_ARCHITECTURE_AND_API.md) — Complete REST API reference, middleware order, controller flows.
4. [04_DATABASE_AND_DATA_FLOW.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/04_DATABASE_AND_DATA_FLOW.md) — Mongoose schemas, 2dsphere indexing, 6 storage layers.
5. [05_AUTH_SECURITY_AND_IDENTITY.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/05_AUTH_SECURITY_AND_IDENTITY.md) — Bcrypt, HMAC OTP, JWT, and 10-point Aadhaar vault audit.
6. [06_MAP_SOS_AND_HOTSPOTS.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/06_MAP_SOS_AND_HOTSPOTS.md) — Leaflet mapping, one-shot GPS, Random Forest, 74% accuracy metrics.
7. [07_CODE_CONCEPTS_FOR_VIVA.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/07_CODE_CONCEPTS_FOR_VIVA.md) — Async/await, Promises, React hooks, SPA routing, HTTP codes.
8. [08_VIVA_QUESTION_BANK.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/08_VIVA_QUESTION_BANK.md) — 9 topic sections with short answers, technical proofs, and follow-ups.
9. [09_DEMO_AND_TROUBLESHOOTING.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/09_DEMO_AND_TROUBLESHOOTING.md) — 9-step live demo sequence, env variables, diagnostic fixes.
10. [10_IMPLEMENTATION_GAPS_AND_TEST_STATUS.md](file:///c:/Users/DELL/Desktop/SHEQ/docs/project-guide/10_IMPLEMENTATION_GAPS_AND_TEST_STATUS.md) — Feature status matrix, 42 passing tests, roadmap.
