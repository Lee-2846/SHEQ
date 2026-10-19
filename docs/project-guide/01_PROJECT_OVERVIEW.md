# 01 — SHEQ Project Overview & Master Architecture

---

## 1. What Problem Does SHEQ Solve? (In Simple Words)

In many urban areas, women and community members face everyday safety challenges—such as broken streetlights, deserted bus stops, harassment on specific routes, and poorly patrolled alleys. 

However, current safety solutions have significant flaws:
1. **Official police crime records (NCRB)** are published only once a year as high-level city aggregates. They do not tell a college student or commuter which specific street corner is pitch dark tonight.
2. **Social media posts** about safety concerns are scattered, unverified, quickly buried, and lack geospatial coordinates.
3. **Emergency apps** often either trigger accidental police calls or make unrealistic claims that automated dispatch will immediately rescue someone without active device confirmation or network connectivity.

**SHEQ** (Safety, Health, Equity, Quality) bridges this gap. It is a **community-powered safety intelligence web platform** designed for urban cities (with an initial operational focus on the Mumbai and Pune Metropolitan Regions). 

SHEQ allows verified and anonymous citizens to report hyper-local safety concerns (like broken lighting or stalking), view live geospatial maps with safety markers, dispatch emergency alerts to their trusted circles, and enables municipal administrators to review clusters and designate official safety hotspots using **hybrid Machine Learning and community evidence**.

---

## 2. Who Are the Users of SHEQ?

The application is architected around two primary user personas:

### A. Community Members (Citizens / Students / Commuters)
* **Anonymous & Verified Incident Reporting:** Report safety incidents with exact coordinates, photos, timestamps, and standardized categories without exposing real names to the public.
* **Interactive Safety Map:** Inspect incidents, confirmed hazards, and active designated hotspots before traveling through unfamiliar areas.
* **Emergency SOS Protocol:** Obtain device GPS coordinates, trigger one-tap phone dialers to primary contacts or emergency helpline 112, and dispatch emergency alerts to trusted contacts via automated gateways or instant prefilled device links.
* **Saved Places & Insights:** Save frequent locations (Home, College, Work) and receive localized safety insights and active hotspot alerts within a 2 km radius.
* **Identity & Trust Verification:** Verify phone numbers via SMS OTP and submit a **Masked Aadhaar** document to a private server vault to achieve "Verified Member" trusted-contributor status.

### B. Safety Administrators (Operations & Municipal Reviewers)
* **Administrative Moderation Queue:** Review, verify, flag, or resolve community incident reports.
* **Identity Verification Console:** Access the private server vault to inspect submitted Masked Aadhaar documents, verify that the first 8 digits are masked, approve trusted badges, or request resubmission with specific notes.
* **Hotspot Candidate Review:** Inspect candidate clusters flagged by the **Random Forest Machine Learning model** and community evidence scores, and make the final human-governed decision to promote candidates to official public hotspots.
* **Issue & Escalation Tracking:** Manage civic maintenance requests (e.g. municipal lighting) and log official escalation records for external agency coordination.

---

## 3. Technology Stack & Technical Rationale

| Layer | Technologies Used | Exact Version / Spec | Why This Choice? |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | `v19.0.0` (via Vite `v7.3.6`) | Component-driven reactivity, fast virtual DOM diffing, and declarative UI states. |
| **Frontend Build Tool** | Vite | `v7.3.6` | Sub-second Hot Module Replacement (HMR) and fast Rollup-based production bundling. |
| **Styling & Design System** | Vanilla CSS (`styles.css`) | Custom HSL Design Tokens | Clean, bespoke luxury design with zero heavy CSS framework bloat (no Tailwind overhead). Uses consistent tokens: `--berry` (`#6c2f41`), `--sand`, `--ivory`. |
| **Icons & Visuals** | Lucide React | `v0.475.0` | Clean, accessible SVG iconography with zero runtime overhead. |
| **Animation** | Framer Motion | `v12.4.7` | Smooth page route transitions and presence management without layout thrashing. |
| **Backend Runtime** | Node.js (ES Modules) | `>=20.0.0` (tested on Node `v24.19.0`) | Single-threaded non-blocking asynchronous event loop, optimal for high-concurrency I/O and REST APIs. |
| **Web Server Framework** | Express.js | `v4.21.2` | Minimalist, unopinionated routing framework with standard middleware chaining. |
| **Database & ODM** | MongoDB with Mongoose | Mongoose `v8.9.5` | Document-oriented NoSQL storage supporting native **2dsphere geospatial indexing** (`$near`, GeoJSON Point format). |
| **Data Validation** | Zod | `v3.24.1` | Static TypeScript/JavaScript schema validation enforcing strict boundaries at all API entry points. |
| **Authentication & Tokens** | JWT & Bcrypt.js | `jsonwebtoken v9.0.2`, `bcryptjs v2.4.3` | Stateless signed HMAC-SHA256 bearer tokens and one-way password hashing (10 salt rounds). |
| **File Upload Handling** | Multer | `v2.4.0` | Streaming multipart form-data inspection with strict in-memory buffer analysis before disk persistence. |
| **Email Transport** | Nodemailer | `v10.1.7` | Universal SMTP transport supporting standard mail relays and honest Resend free-tier domain verification handling. |
| **Machine Learning Pipeline** | Python & Scikit-Learn | Python `3.14`, Scikit-Learn `v1.8.0` | Model training, 80/20 stratified split, 5-fold cross validation, and dual-format serialization (`.joblib` and `.json`). |
| **Live In-App Inference** | Pure Node.js Tree Engine | Custom `mlHotspotInference.js` | Zero-latency evaluation of all 100 decision trees in memory (<1ms) without spawning expensive Python child processes. |

---

## 4. High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                       |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  |                             REACT APPLICATION (SPA)                               |  |
|  |                                                                                   |  |
|  |  [ Pages ]                                                                        |  |
|  |  Landing, Login, Signup, SafetyMap, ReportIncident, IncidentDetails, SOS, Profile  |  |
|  |  Admin Pages: Dashboard, Identity, Reports, Hotspots, Issues, Escalations           |  |
|  |                                                                                   |  |
|  |  [ Context Providers (State Management) ]                                         |  |
|  |  - AuthContext (JWT token, user profile, login/logout, OTP start & verify)        |  |
|  |  - DataContext (Mock incidents, active hotspots, stats, saved places, contacts)   |  |
|  |  - LanguageContext (i18n translation: English, Marathi, Hindi)                    |  |
|  |                                                                                   |  |
|  |  [ Frontend Services (API Client) ]                                               |  |
|  |  - api.js (Base fetch wrapper with Authorization Bearer header injection)        |  |
|  |  - authService.js, identityService.js, reportService.js, sosService.js           |  |
|  +-----------------------------------------------------------------------------------+  |
+--------------------------------------------|--------------------------------------------+
                                             | HTTP Requests (JSON / Multipart)
                                             | Base: http://localhost:5000/api
                                             v
+-----------------------------------------------------------------------------------------+
|                                    EXPRESS BACKEND                                      |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  |  Global Middleware Stack:                                                         |  |
|  |  1. cors()             -> Restricts origins to localhost:5173                     |  |
|  |  2. helmet()           -> Sets secure HTTP response headers                       |  |
|  |  3. express.json(1mb)  -> Parses incoming JSON request payloads                   |  |
|  |  4. rateLimit()        -> 120 requests/min per IP protection                      |  |
|  +-----------------------------------------------------------------------------------+  |
|                                            |
|                                            v
|  +-----------------------------------------------------------------------------------+  |
|  |  Router Mounting & Route-Level Security:                                          |  |
|  |  - /api/auth           -> auth.js (Public, Rate-limited, Phone & Email OTP)       |  |
|  |  - /api/reports        -> reports.js (Public read, Protected create, Admin patch) |  |
|  |  - /api/identity       -> identity.js (Private Vault, Magic Bytes, Admin review)   |  |
|  |  - /api/hotspots       -> hotspots.js (Public read, Admin candidate calculation)  |  |
|  |  - /api/escalations    -> escalations.js (SOS dispatch, Admin civic records)      |  |
|  |  - /api/places         -> places.js (Protected saved locations & 2km radius)     |  |
|  |  - /api/infrastructure -> infrastructure.js (GeoJSON police & streetlight layers) |  |
|  |  - /api/analytics      -> analytics.js (Admin aggregate counts)                  |  |
|  |  - /api/health         -> health.js (Database connectivity probe)                 |  |
|  +-----------------------------------------------------------------------------------+  |
|                                            |
|                        +-------------------+-------------------+
|                        |                                       |
|                        v                                       v
|  +-------------------------------------+   +---------------------------------------+
|  |   INTERNAL SERVICES & ENGINES       |   |       DATA PERSISTENCE & STORAGE      |
|  |                                     |   |                                       |
|  |  - mlHotspotInference.js            |   |  - MongoDB (sheq_dev database)        |
|  |    * 100 Decision Trees evaluated   |   |    * Users, Reports, EmailOtps        |
|  |    * Haversine Spatial Proximities  |   |    * PhoneOtps, Hotspots, Escalations |
|  |  - emailService.js                  |   |    * SavedPlaces, IdentityAudits      |
|  |    * SMTP / Resend honest errors    |   |                                       |
|  |  - smsService.js                    |   |  - Private Server Vault Disk Storage  |
|  |    * E.164 phone normalization      |   |    * uploads/vault_documents/         |
|  |    * Twilio / Fast2SMS adapters     |   |    * 0o600 restricted file mode       |
|  |  - tokenService.js                  |   |    * Outside public web root          |
|  |    * Signed JWT creation & verify   |   |                                       |
|  +-------------------------------------+   +---------------------------------------+
+-----------------------------------------------------------------------------------------+
```

---

## 5. Scope & Current Boundaries

To answer viva questions with complete academic honesty, you must know what is fully operational versus where the system has clear architectural boundaries:

1. **Community Reports vs Official Hotspots:**
   * An individual report never becomes an official hotspot automatically.
   * Hotspots require an explicit administrative gate: `Report Activity Cluster -> Candidate -> ML/Signal Score -> Admin Review -> Official Designated Hotspot`.
2. **Real vs Synthetic Demonstration Data:**
   * The ML benchmark model is trained on `datasets/geospatial-crime-data/SHEQ_dataset2_SYNTHETIC_demo.csv` (500 records) because official NCRB records lack street-level coordinates.
   * Synthetic demo data is strictly excluded (`sourceType: { $ne: "synthetic_demo" }`) from live community candidate generation.
3. **Emergency SOS Delivery:**
   * Activating SOS connects directly to the device dialer via the standard `tel:` protocol.
   * Location sharing generates instant verified Google Maps links and prefilled fallback URLs (`sms:` and `https://wa.me/?text=...`) that work 100% of the time, regardless of whether backend external SMS provider credentials are configured.
4. **Document Vault Security:**
   * Uploaded identity documents are stored in an isolated private directory on the server (`uploads/vault_documents/`) with `0o600` permissions.
   * They are never exposed through static web serving (e.g. `express.static`). Document access is guarded by an authenticated streaming controller that verifies owner or admin identity before piping bytes.
