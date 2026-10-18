# SHEQ — Women's Safety Community Reporting Platform

**SHEQ** is an end-to-end community reporting and safety intelligence platform designed to empower women with verified community incident reporting, geo-located safety map visualization, provisional hotspot candidate analysis, and administrative moderation workflows.

---

## 1. System Architecture

```
SHEQ Platform
├── Frontend (Client SPA)
│   ├── React 19 + Vite 7
│   ├── React-Leaflet + Leaflet (Interactive Safety Map)
│   ├── Framer Motion + Bootstrap 5 (Custom Design System)
│   └── Contexts (AuthContext, DataContext, LanguageContext)
│
├── Backend (RESTful API Service)
│   ├── Node.js 20+ / Express 4
│   ├── MongoDB Atlas / Mongoose 8
│   ├── JWT Token Authentication (Bearer Auth + Bcrypt password hashing)
│   ├── Strict Server-Side Validation (Zod schemas)
│   └── Security: Helmet, Rate Limiting, CORS, Identity Seam Boundary
│
└── Data Science & ML Pipeline
    ├── Python 3.13 / Scikit-Learn 1.9 / Pandas / NumPy
    ├── Spatial Analysis (Haversine distances to Police Stations & Streetlights)
    ├── Machine Learning Classifier (Random Forest 100 Trees + Logistic Regression)
    └── Official Datasets Audit (NCRB Tables, Mumbai Ward Demographics, GeoJSON Infrastructure)
```

---

## 2. Prerequisites & Runtime Requirements

- **Node.js:** v20.0.0 or higher (v24 LTS recommended)
- **Python:** v3.10+ (for dataset preprocessing & ML evaluation; `scikit-learn`, `pandas`, `numpy`)
- **Database:** MongoDB Atlas connection string or local MongoDB instance (`mongodb://127.0.0.1:27017/sheq_dev`)

---

## 3. Environment Configuration

### Backend (`backend/.env`):
Create `backend/.env` by copying `backend/.env.example`:
```env
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/sheq_db?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12

# Identity Verification Provider Boundary (Keep disabled until provider contract is active)
IDENTITY_PROVIDER=disabled
IDENTITY_VERIFICATION_ENABLED=false
IDENTITY_PROVIDER_BASE_URL=
IDENTITY_PROVIDER_API_KEY=

# Optional GeoJSON import path
GEOJSON_IMPORT_PATH=
```

### Frontend (`.env`):
```env
VITE_API_BASE_URL=http://localhost:4000/api
```
*(Frontend variables are public in the client bundle; never place backend secrets in Vite files).*

---

## 4. Startup & Running Locally

### A. Start the Backend API:
```bash
cd backend
npm install
node src/server.js
```
The server will start on `http://localhost:4000`. Verify health:
```bash
curl http://localhost:4000/api/health
# Response: {"status":"ok","service":"sheq-api","database":"connected"}
```

### B. Start the Frontend Development Server:
```bash
# In the project root (C:\Users\pleen\SHEQ)
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Verification, Builds, and Automated Tests

### Run Backend Unit & Integration Tests (12 Tests):
```bash
cd backend
node --test
```
Verifies:
- Password hashing & bcrypt verification
- JWT issuance, payload security, and expiration
- User sanitization (strips `passwordHash`, private provider keys)
- Anonymous reporting privacy (strips `reporterId` and `moderationNote`)
- Dataset schema validation & presence
- ML model evaluation report generation
- Hotspot scoring contracts & coordinate validation

### Run Machine Learning Training & Dataset Pipeline:
```bash
python backend/scripts/dataset_pipeline.py
```
Outputs verified metrics and saves `backend/docs/model_evaluation_report.json` and `backend/docs/DATASET_AND_MODEL_REPORT.md`.

### Run Frontend Production Build:
```bash
npm.cmd run build
```

---

## 6. Datasets Overview & Provenance

All raw datasets are preserved in `datasets/`:

| Dataset | Format | Coverage | Purpose in SHEQ |
|---|---|---|---|
| `official-crime-data/TABLE3B13-43.xlsx` | XLSX | 34 Metropolitan Cities | Macro municipal historical context & chargesheeting benchmarks (2022–2024). *City aggregates only; no street coordinates.* |
| `demographic-data/SHEQ_Dataset4_Mumbai_Ward_Population_2011.csv` | CSV | 24 Greater Mumbai Wards | Ward population (12.44M total, 6.53M slum population) context. |
| `infrastructure-data/mumbai_navi_mumbai_police_stations_expanded.geojson` | GeoJSON | Mumbai & Navi Mumbai | 175 Police Station points used for spatial distance features. |
| `infrastructure-data/mumbai_navi_mumbai_streetlights_expanded.geojson` | GeoJSON | Mumbai & Navi Mumbai | 673 Streetlight points used for lighting infrastructure analysis. |
| `infrastructure-data/mumbai_bus_stops.geojson` | GeoJSON | Mumbai / Navi Mumbai | 163 Bus stop transit nodes. |
| `infrastructure-data/mumbai_roads_paths.geojson` | GeoJSON | Mumbai | 3,980 road and path vector geometries. |
| `geospatial-crime-data/SHEQ_dataset2_SYNTHETIC_demo.csv` | CSV | Fabricated coordinates | 500 records used **strictly for ML model demonstration**. Accompanied by disclaimer README. |

---

## 7. Machine Learning Hotspot Model

- **Model Architecture:** Random Forest Classifier (100 estimators, max depth 6)
- **Features Extracted:** Incident hour, day of week, night indicator (`20:00–05:00`), distance to nearest police station (km), distance to nearest streetlight (km), latitude, longitude, and category one-hot encoding.
- **Evaluation Split:** Stratified 80% train / 20% test split with fixed seed (`random_state=42`).
- **Measured Metrics (Held-out Test Set):**
  - **Accuracy:** 74.00%
  - **Precision:** 63.64%
  - **Recall:** 43.75%
  - **F1-Score:** 51.85%
  - **ROC-AUC:** 0.7509
  - **5-Fold Cross-Validation AUC:** 0.6838
- **Top Features:** `is_night` (19.6%), `hour` (18.6%), `dist_nearest_streetlight_km` (14.3%), `latitude` (12.7%), `longitude` (12.4%).
- **Transparent Limitation:** The ML model is benchmarked on the synthetic demo dataset because official NCRB records do not provide street-level incident coordinates. In live operations, candidate hotspots use transparent explainable clustering and **always require administrator review and designation before becoming official hotspots**.

---

## 8. Aadhaar & Identity Verification

- **Architectural Seam:** Ordinary account authentication (email/phone + password) is kept strictly separate from identity verification.
- **Data Minimization:** Under UIDAI regulations and the IT Act, SHEQ does **not** collect, store, or log raw 12-digit Aadhaar numbers or OTPs.
- **Verification States:** `unverified`, `pending`, `verified`, `failed`.
- **Truthful Status:** Accounts remain truthfully marked `unverified` until an authorized UIDAI-licensed ASA/KUA provider (e.g. Setu, Digilocker, or Karza) is contracted with an approved hosted eKYC redirect workflow.
- **Demo Verification Boundary:** A demo sandbox test is provided in **Profile → Account & Privacy** which demonstrates the UI state flow without falsely asserting official government verification.

---

## 9. API Routes Reference

### Authentication & Identity
- `POST /api/auth/signup` — Register regular user account
- `POST /api/auth/login` — Login user or admin, returns signed JWT
- `GET /api/auth/me` — Authenticated profile (requires Bearer token)
- `GET /api/auth/identity/status` — Query identity verification provider state
- `POST /api/auth/identity/demo-verify` — Test demo verification sandbox boundary
- `POST /api/auth/identity/start` — Provider initiation seam (returns 503 until provider configured)

### Community Reports
- `GET /api/reports` — Fetch reports (supports category/status filters and geo-queries)
- `POST /api/reports` — Submit new incident report (anonymity flag supported)
- `POST /api/reports/:id/confirm` — Confirm observed report (one confirmation per user)
- `POST /api/reports/:id/comments` — Add context comment
- `GET /api/reports/:id/comments` — Fetch comments
- `POST /api/reports/:id/dispute` — Flag factual inaccuracy / dispute
- `PATCH /api/reports/:id/moderation` — Admin-only lifecycle moderation (`Submitted` → `Under Review` → `Verified` → `Resolved` → `Flagged`)

### Hotspots & Safety Intelligence
- `GET /api/hotspots` — Fetch officially designated hotspots
- `GET /api/hotspots/candidates` — Admin-only explainable activity candidate proposals
- `POST /api/hotspots/candidates/save` — Admin-only candidate saving
- `PATCH /api/hotspots/:id/review` — Admin-only official hotspot designation / deactivation

### Municipal & User Features
- `GET /api/places`, `POST /api/places`, `DELETE /api/places/:id` — User saved places
- `GET /api/escalations`, `POST /api/escalations`, `PATCH /api/escalations/:id` — Admin authority dossiers
- `GET /api/analytics/admin` — Database-derived operational statistics

---

## 10. Step-by-Step Evaluation Walkthrough

### Scenario A: Regular User Flow
1. Open `http://localhost:5173/login`.
2. Log in using `riyas@gmail.com` or create a new account via `/signup`.
3. Check **Profile → Account & Privacy**: inspect truthful `unverified` status, click **Query Provider Boundary** (`/api/auth/identity/status` returns 503 Service Unavailable / Safe Integration Seam), and test the demo verification boundary.
4. Navigate to **Report an Incident** (`/report`):
   - Select Category: e.g. `Poor Lighting`.
   - Select Location: e.g. `Bandra West, Mumbai`.
   - Add Description.
   - Toggle **Submit anonymously** ON.
   - Submit the report.
5. Navigate to **Safety Map** (`/map`): see your newly submitted report with the anonymity flag preserved (reporter name hidden).
6. Click into **Incident Details** (`/incident/:id`):
   - Click "I experienced / observed this too" to record a community confirmation.
   - Add a context comment ("Maintenance ticket submitted").
   - Click "Dispute / flag inaccuracy" to test the community dispute modal.

### Scenario B: Administrator Flow
1. Open `http://localhost:5173/login` and switch to the **Admin Portal** tab.
2. Log in using authorized admin credentials:
   - **Email:** `admin@sheq.app`
   - **Password:** `AdminSecure123!`
3. Notice you are authenticated with a real backend JWT token (`role: admin`).
4. In **Admin Control Center**:
   - **Overview (`/admin`):** Review live database-derived metrics.
   - **Reports Moderation (`/admin/reports`):** Locate the submitted report. Change status from `Submitted` to `Under Review` or `Verified`. Inspect the report in the modal.
   - **Hotspot Analysis (`/admin/hotspots`):** Inspect the **Machine Learning Model Benchmark Card** displaying the Random Forest test set metrics (74.00% Accuracy, 0.7509 ROC-AUC). Review candidate areas and click **Designate Hotspot** to promote a candidate to an official active hotspot.
   - **Dispute Log (`/admin/moderation`):** Review flagged community disputes.
   - **External Escalations (`/admin/escalations`):** Log an authority escalation dossier for municipal or police liaison.
5. Refresh the page: confirm all changes persist in MongoDB Atlas.
