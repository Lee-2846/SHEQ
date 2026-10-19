# 02 — Complete File Map & "Where Is Everything Implemented?"

---

## 1. Complete Project Directory Tree

Below is the active, relevant file structure of the SHEQ repository (excluding `node_modules`, `dist`, and `.git`):

```
SHEQ/
├── index.html                           # Root HTML template for Vite frontend
├── package.json                         # Frontend dependencies and npm scripts
├── vite.config.js                       # Vite build configuration (React plugin)
├── PRD.md                               # Product Requirements Document
├── README.md                            # Quickstart instructions
│
├── datasets/                            # Ground-truth & demographic datasets
│   ├── demographic-data/                # Census population densities (Mumbai/Pune)
│   ├── geospatial-crime-data/           # Synthetic demonstration coordinates (SHEQ_dataset2)
│   ├── infrastructure-data/             # Mumbai police stations, streetlights & bus stops GeoJSON
│   └── official-crime-data/             # NCRB Table 3B crime statistics (municipal totals)
│
├── src/                                 # Frontend source code (React 19 + Vite)
│   ├── main.jsx                         # React DOM mount point
│   ├── App.jsx                          # Main routing, route protection & layout shell
│   ├── styles.css                       # Unified SHEQ luxury design system tokens & classes
│   │
│   ├── assets/                          # Static branding images (logos, hero illustrations)
│   ├── components/                      # Reusable UI components
│   │   ├── AdminRoute.jsx               # Route guard restricting access to role === "admin"
│   │   ├── AuthIllustration.jsx         # SVG safety art for login/signup sidebars
│   │   ├── DisputeModal.jsx             # Modal dialog for submitting community disputes
│   │   ├── Footer.jsx                   # Public footer with disclaimers and navigation links
│   │   ├── Navbar.jsx                   # Navigation bar with role badges, avatar, and language switcher
│   │   ├── ProtectedRoute.jsx           # Route guard redirecting unauthenticated users to /login
│   │   ├── ReportCard.jsx               # Compact card displaying incident summary & badge
│   │   ├── SOSModal.jsx                 # Full-screen emergency modal (Dialer, GPS, Direct SMS/WA)
│   │   ├── ScrollToTop.jsx              # Resets window scroll position upon route transition
│   │   ├── SectionTitle.jsx             # Section header with eyebrow styling
│   │   ├── StatCard.jsx                 # Dashboard metric card
│   │   └── StatusStepper.jsx            # 4-stage visual stepper for incident lifecycle
│   │
│   ├── context/                         # React Context state management
│   │   ├── AuthContext.jsx              # User session, JWT tokens, login, signup, OTP flows
│   │   ├── DataContext.jsx              # Incidents, hotspots, contacts, stats, saved places
│   │   └── LanguageContext.jsx          # Multi-language translation provider (EN, MR, HI)
│   │
│   ├── data/
│   │   └── mockData.js                  # Initial baseline incident reports and seed data
│   │
│   ├── hooks/
│   │   └── useReports.js                # Custom hook for filtering and querying incident reports
│   │
│   ├── pages/                           # Application route view pages
│   │   ├── About.jsx                    # About page explaining platform ethics & mission
│   │   ├── Alerts.jsx                   # Notification feed for area safety alerts
│   │   ├── Dashboard.jsx                # Member home screen with quick actions & metrics
│   │   ├── IncidentDetails.jsx          # Detailed view of an incident with comments & disputes
│   │   ├── Insights.jsx                 # City-wide aggregate safety trends & analytics
│   │   ├── Landing.jsx                  # Public landing hero page with call-to-action
│   │   ├── Login.jsx                    # Sign-in page supporting email, phone, and demo credentials
│   │   ├── Profile.jsx                  # Account settings, 5-stage identity verification & vault upload
│   │   ├── ReportIncident.jsx           # 3-step incident submission wizard with map placement
│   │   ├── SafetyMap.jsx                # Interactive map with markers, layer filters & incident sidebar
│   │   ├── Signup.jsx                   # Sign-up page with 2-step OTP registration
│   │   ├── SOS.jsx                      # Emergency contacts configuration & protocol settings
│   │   │
│   │   └── admin/                       # Administrative review and moderation sub-pages
│   │       ├── AdminDashboard.jsx       # Operations overview with triage metrics
│   │       ├── AdminEscalations.jsx     # External agency escalation logging & tracking
│   │       ├── AdminHotspots.jsx        # Hotspot candidate review & ML prediction breakdown
│   │       ├── AdminIdentity.jsx        # Private vault document viewer & eligibility decisions
│   │       ├── AdminIssues.jsx          # Civic complaints & infrastructure issue tracker
│   │       ├── AdminLayout.jsx          # Sub-navigation shell for /admin sub-routes
│   │       ├── AdminModeration.jsx      # Community comment & dispute moderation queue
│   │       └── AdminReports.jsx         # Incident verification & status lifecycle manager
│   │
│   ├── services/                        # API client communication layer
│   │   ├── api.js                       # Base fetch wrapper with Bearer token header injection
│   │   ├── authService.js               # Auth endpoints (signup, verify OTP, login, phone verify)
│   │   ├── identityService.js           # Vault endpoints (status, upload, admin review, blob fetch)
│   │   ├── reportService.js             # Incident endpoints (fetch reports, create report)
│   │   └── sosService.js                # Emergency endpoints (provider readiness, dispatch alert)
│   │
│   └── utils/                           # Client-side helper functions
│       ├── badgeHelpers.js              # CSS class resolver for status and category badges
│       ├── hotspotScoring.js            # Frontend multi-signal activity candidate calculator
│       └── validation.js                # Phone, email, and password sanitizers and validators
│
└── backend/                             # Express REST API & Machine Learning engine
    ├── package.json                     # Backend dependencies and test scripts
    ├── .env                             # Environment configuration (ports, secrets, DB URI)
    ├── .env.example                     # Environment template without credentials
    │
    ├── docs/                            # ML artifacts and compliance documentation
    │   ├── DATASET_AND_MODEL_REPORT.md  # Scientific limitations, evaluation metrics & training notes
    │   ├── hotspot_rf_model.joblib      # Serialized Scikit-Learn binary model artifact
    │   ├── hotspot_rf_model.json        # Serialized JSON model (100 decision trees for Node.js)
    │   └── model_evaluation_report.json # Exact measured metrics (accuracy, ROC-AUC, F1)
    │
    ├── scripts/                         # Database seed scripts & data pipeline
    │   ├── create-admin.js              # Interactive admin account generator
    │   ├── dataset_pipeline.py          # Python script to train Random Forest & export JSON
    │   ├── import-geojson.js            # Seeds infrastructure GeoJSON to MongoDB
    │   └── seed-admin.js                # Headless script creating default admin credentials
    │
    ├── src/
    │   ├── app.js                       # Express app configuration, CORS, rate limits & router mounts
    │   ├── server.js                    # Database connection starter & HTTP listener
    │   │
    │   ├── config/
    │   │   ├── db.js                    # Mongoose database connection wrapper
    │   │   └── env.js                   # Validates and exposes environment variables
    │   │
    │   ├── middleware/
    │   │   ├── auth.js                  # JWT verification (requireAuth, requireAdmin, optionalAuth)
    │   │   └── errors.js                # 404 handler and central 500 error middleware
    │   │
    │   ├── models/                      # Mongoose Database Models
    │   │   ├── Comment.js               # Community incident notes & discussion
    │   │   ├── Confirmation.js          # Unique user-to-report confirmations
    │   │   ├── EmailOtp.js              # Email registration OTPs with TTL expiry
    │   │   ├── Escalation.js            # Agency escalation & emergency audit records
    │   │   ├── Hotspot.js               # Candidate and designated official hotspots
    │   │   ├── IdentityAudit.js         # Audit trail for document vault access and reviews
    │   │   ├── InfrastructureFeature.js # Spatial layers for police stations & lighting
    │   │   ├── PhoneOtp.js              # Phone OTPs with timing-safe HMAC hashing & cooldowns
    │   │   ├── Report.js                # Community incident reports with 2dsphere GeoJSON point
    │   │   ├── SavedPlace.js            # User saved places (Home, Work, College)
    │   │   └── User.js                  # User accounts, verification states & vault metadata
    │   │
    │   ├── routes/                      # REST API Endpoint Routers
    │   │   ├── analytics.js             # /api/analytics (Admin aggregate statistics)
    │   │   ├── auth.js                  # /api/auth (Login, Signup, OTP, Phone verify, Me)
    │   │   ├── escalations.js           # /api/escalations (SOS alert dispatch & agency records)
    │   │   ├── health.js                # /api/health (Service & database heartbeat)
    │   │   ├── hotspots.js              # /api/hotspots (Live candidates & designated spots)
    │   │   ├── identity.js              # /api/identity (Private document vault & admin reviews)
    │   │   ├── infrastructure.js        # /api/infrastructure (Cached GeoJSON layers)
    │   │   ├── places.js                # /api/places (Saved locations & 2km radius insights)
    │   │   └── reports.js               # /api/reports (Incident creation, confirm, dispute)
    │   │
    │   ├── services/                    # Business logic and external service adapters
    │   │   ├── emailService.js          # SMTP & Resend email adapter with domain handling
    │   │   ├── hotspotService.js        # Candidate spatial clustering & scoring coordinator
    │   │   ├── mlHotspotInference.js    # 100-tree in-memory Random Forest engine in Node.js
    │   │   ├── smsService.js            # E.164 phone normalizer & Twilio/Fast2SMS adapter
    │   │   └── tokenService.js          # Signed JWT issue & verify utilities
    │   │
    │   └── utils/
    │       ├── asyncHandler.js          # Wraps async route handlers to forward errors to next()
    │       └── sanitize.js              # Strips password hashes and private vault paths
    │
    ├── tests/                           # Backend Node.js Test Suite (node --test)
    │   ├── auth.test.js                 # Password hashing, JWT issuance and payload tests
    │   ├── dataset_artifacts.test.js    # Verifies presence of crime datasets & ML artifacts
    │   ├── email_otp.test.js            # OTP generation, HMAC timing-safe hashing, SMTP tests
    │   ├── hotspotService.test.js       # Verifies candidate scoring and safety disclosures
    │   ├── identity_vault.test.js       # Magic bytes, MIME spoofing, vault privacy, erasure
    │   ├── ml_inference.test.js         # Artifact integrity, Haversine, tree traversal <5ms
    │   ├── phone_otp.test.js            # Phone normalization (E.164), rate limits, provider check
    │   ├── reports_validation.test.js   # Taxonomy validation & GeoJSON coordinate contracts
    │   └── sos_dispatch.test.js         # Coordinate boundaries, staleness tagging, URI fallbacks
    │
    └── uploads/
        └── vault_documents/             # Private server vault directory (0o600 restricted permissions)
```

---

## 2. "Where Is Everything Implemented?" Master Index

This table is your quick-navigation guide during code demonstration and viva questions.

| Feature / Concept | Exact File | Function / Component / Symbol | What Happens Here | Connected Files |
| :--- | :--- | :--- | :--- | :--- |
| **Login Handler (Frontend)** | `src/pages/Login.jsx` | `handleSubmit()` | Validates identifier & password, calls `loginUser` or `loginAdmin`, redirects to `/admin` or `/dashboard`. | `src/context/AuthContext.jsx`, `src/services/authService.js` |
| **Login API Endpoint (Backend)** | `backend/src/routes/auth.js` | `POST /login` | Normalizes email/phone, looks up user, compares password via `bcrypt.compare`, signs JWT token. | `backend/src/models/User.js`, `backend/src/services/tokenService.js` |
| **Signup Initiation (Backend)** | `backend/src/routes/auth.js` | `handleSignupInitiation()` | Validates password complexity, creates HMAC-SHA256 hashed OTP, attempts SMS or SMTP email delivery. | `backend/src/models/EmailOtp.js`, `backend/src/models/PhoneOtp.js`, `backend/src/services/emailService.js` |
| **OTP Verification (Backend)** | `backend/src/routes/auth.js` | `POST /signup/verify` | Compares OTP hash with timing-safe check, decrements attempt counter, activates user account, issues JWT. | `backend/src/models/User.js`, `backend/src/services/tokenService.js` |
| **Password Complexity Rule** | `backend/src/routes/auth.js` | `signupSchema` (Zod) | Enforces $\ge 10$ characters, $\le 128$ characters, and at least one special symbol (`[!@#$%^&*...]`). | `src/utils/validation.js` |
| **JWT Generation & Verification** | `backend/src/services/tokenService.js` | `issueAccessToken()`, `verifyToken()` | Signs payload `{ sub: user._id, role: user.role }` with 7-day expiry using `env.jwtSecret`. | `backend/src/middleware/auth.js` |
| **Authentication Middleware** | `backend/src/middleware/auth.js` | `requireAuth()`, `requireAdmin()` | Extracts `Authorization: Bearer <token>`, verifies JWT, loads active user from DB, checks `role === 'admin'`. | `backend/src/routes/*.js` |
| **Route Protection (Frontend)** | `src/components/ProtectedRoute.jsx` | `<ProtectedRoute />` | Inspects `isAuthenticated` from `AuthContext`; redirects unauthorized visitors to `/login`. | `src/App.jsx`, `src/context/AuthContext.jsx` |
| **Admin Route Protection** | `src/components/AdminRoute.jsx` | `<AdminRoute />` | Verifies `user?.role === 'admin'`; redirects standard members away from `/admin`. | `src/App.jsx`, `src/pages/admin/AdminLayout.jsx` |
| **Incident Creation (Frontend)** | `src/pages/ReportIncident.jsx` | `handleSubmit()` | 3-step wizard collecting category, coordinates, date, description, photo preview, and anonymous toggle. | `src/context/DataContext.jsx`, `src/services/reportService.js` |
| **Incident Creation (Backend)** | `backend/src/routes/reports.js` | `POST /api/reports` | Validates spherical coordinates (`[-180, 180]`, `[-90, 90]`), creates GeoJSON Point, strips reporter ID on public view. | `backend/src/models/Report.js`, `backend/src/utils/sanitize.js` |
| **Anonymous Reporting Privacy** | `backend/src/utils/sanitize.js` | `publicReport()` | Protects reporter identity: if `isAnonymousPublicly: true`, omits reporter name and displays "SHEQ Member (Anonymous)". | `backend/src/routes/reports.js` |
| **Community Confirmations** | `backend/src/routes/reports.js` | `POST /:id/confirm` | Ensures 1 confirmation per user via unique compound index `{ reportId: 1, userId: 1 }` on Confirmation model; increments counter. | `backend/src/models/Confirmation.js`, `backend/src/models/Report.js` |
| **Community Disputes** | `backend/src/routes/reports.js` | `POST /:id/dispute` | Validates dispute reason, logs dispute note, and increments report disputes counter for admin triage. | `backend/src/models/Report.js`, `src/components/DisputeModal.jsx` |
| **Incident Status Lifecycle** | `src/components/StatusStepper.jsx` | `<StatusStepper />` | Renders 4 lifecycle stages: `Submitted -> Under Review -> Verified -> Resolved`. | `src/pages/IncidentDetails.jsx`, `src/pages/admin/AdminReports.jsx` |
| **Safety Map View** | `src/pages/SafetyMap.jsx` | `<SafetyMap />` | Interactive Leaflet/OSM map displaying incident markers, active designated hotspots, and search controls. | `src/context/DataContext.jsx`, `src/utils/badgeHelpers.js` |
| **Masked Aadhaar Upload (Frontend)**| `src/pages/Profile.jsx` | `handleDocumentUpload()` | File input accepting PDF/PNG/JPEG up to 5MB, masking guidelines, statutory consent checkbox, sends multipart request. | `src/services/identityService.js`, `src/styles.css` |
| **Document Vault Upload (Backend)** | `backend/src/routes/identity.js` | `POST /upload-document` | Inspects magic bytes, computes SHA-256 hash, saves to `uploads/vault_documents/` with `0o600` mode, logs IdentityAudit. | `backend/src/models/User.js`, `backend/src/models/IdentityAudit.js` |
| **Document Streaming (Backend)** | `backend/src/routes/identity.js` | `GET /document/:userId` | Strict authorization (owner or admin only), streams document with `X-Content-Type-Options: nosniff` and no-cache headers. | `backend/src/routes/identity.js` |
| **Admin Identity Review Console** | `src/pages/admin/AdminIdentity.jsx`| `AdminIdentity()` | Admin queue displaying pending submissions, document viewer launcher, decision modal (`verified`/`rejected`), audit trail. | `src/services/identityService.js` |
| **Right to Erasure (Document Delete)**| `backend/src/routes/identity.js`| `DELETE /document` | Unlinks file from disk vault, resets user status to `unverified`, nullifies metadata, records deletion in audit log. | `src/pages/Profile.jsx` |
| **ML Model Training Pipeline** | `backend/scripts/dataset_pipeline.py`| `train_hotspot_model()` | Trains Random Forest with 100 trees, 80/20 stratified split, 5-fold CV, exports `.joblib` binary and `.json` tree structure. | `backend/docs/hotspot_rf_model.json` |
| **ML Inference Engine (Node.js)** | `backend/src/services/mlHotspotInference.js`| `scoreCandidateWithModel()`| Loads 100 trees into memory, computes Haversine proximities to police stations & streetlights, evaluates probability in <1ms. | `backend/src/services/hotspotService.js` |
| **Hotspot Candidate Calculation** | `backend/src/services/hotspotService.js`| `calculateHotspotCandidates()`| Clusters reports by grid (~220m), aggregates volume, recency, severity, evaluates ML model, returns candidates for admin. | `backend/src/routes/hotspots.js` |
| **Hotspot Promotion / Designation** | `backend/src/routes/hotspots.js` | `PATCH /:id/review` | Admin review gate: transitions hotspot state from `candidate` to `designated`, activating it on the public Safety Map. | `backend/src/models/Hotspot.js`, `src/pages/admin/AdminHotspots.jsx` |
| **Emergency SOS Modal** | `src/components/SOSModal.jsx` | `<SOSModal />` | Full-screen emergency modal: telephone dialer (`tel:`), GPS retrieval with staleness indicator, and direct SMS/WhatsApp fallbacks. | `src/services/sosService.js`, `src/context/DataContext.jsx` |
| **SOS Alert Dispatch API** | `backend/src/routes/escalations.js`| `POST /sos-alert` | Validates coordinates & staleness (>60s), attempts delivery via Twilio/WhatsApp, records Escalation, returns prefilled links. | `backend/src/services/smsService.js`, `backend/src/models/Escalation.js` |
| **Saved Places & 2km Insights** | `backend/src/routes/places.js` | `GET /:id/insights` | Queries MongoDB 2dsphere index for incidents within 2000m of saved place, calculates 30-day activity count. | `backend/src/models/SavedPlace.js`, `backend/src/models/Report.js` |
| **Admin Operations Dashboard** | `src/pages/admin/AdminDashboard.jsx`| `<AdminDashboard />` | Triage cards showing pending incident reviews, active hotspots, unreviewed identity submissions, and system health. | `src/services/api.js`, `backend/src/routes/analytics.js` |
