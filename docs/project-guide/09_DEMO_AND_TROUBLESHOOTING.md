# 09 — Live Demonstration Script & Troubleshooting Guide

---

## 1. Live Demonstration Step-by-Step Script (For Viva Presentation)

Follow this structured 9-step demonstration sequence during your project evaluation:

```
[ Step 1: Public Landing Page ]
- URL: http://localhost:5173
- What to Click: Scroll through hero section, explain the three pillars (Community Reporting, ML Hotspots, Emergency SOS).
- Technical Point: Explain Single Page Application (SPA) architecture and luxury vanilla CSS design tokens.
- File Reference: src/pages/Landing.jsx

[ Step 2: Member Authentication ]
- What to Click: Click "Sign In", click "Use Demo User" (or log in with registered email/phone).
- What Happens: Form populates demo credentials, calls POST /api/auth/login, receives JWT, stores in localStorage.
- Technical Point: Explain Bcrypt 10-round hashing and stateless signed JWT Bearer authentication.
- File Reference: src/pages/Login.jsx, backend/src/routes/auth.js

[ Step 3: Interactive Safety Map ]
- What to Click: Click "Safety Map" in top navigation bar.
- What Happens: Leaflet map renders with custom color-coded incident markers and designated hotspots in Mumbai/Pune.
- What to Click: Click on a marker -> incident sidebar highlights -> click "Poor Lighting Concern" category filter.
- Technical Point: Explain WGS84 coordinates, 2dsphere indexing, and client-side reactive filtering.
- File Reference: src/pages/SafetyMap.jsx

[ Step 4: Submitting an Incident Report ]
- What to Click: Click "Report Incident" in top navigation bar.
- What to Click:
  1. Select Category: "Poor Lighting Concern".
  2. Step 2: Enter location "Bandra Station West" and click on map to set GPS coordinates.
  3. Step 3: Enter narrative description, toggle "Submit anonymously", click "Submit Incident".
- What Happens: Incident is created with status "Submitted", anonymous public protection is applied, and dashboard stats increment.
- File Reference: src/pages/ReportIncident.jsx, backend/src/routes/reports.js

[ Step 5: Incident Corroboration & Discussion ]
- What to Click: Click on the newly submitted report to open Incident Details.
- What to Click: Click "Confirm Report" button.
- What Happens: Confirmation counter increments. Explain that duplicate confirms are rejected by MongoDB unique compound index.
- Technical Point: Show the 4-stage lifecycle StatusStepper: Submitted -> Under Review -> Verified -> Resolved.
- File Reference: src/pages/IncidentDetails.jsx, src/components/StatusStepper.jsx

[ Step 6: Member Identity & Masked Aadhaar Vault ]
- What to Click: Click Profile avatar -> Select "Identity & Verification" tab.
- What Happens: Renders 5-stage progress indicator:
  1. Email Verified -> 2. Phone OTP -> 3. Profile Info -> 4. Masked Aadhaar -> 5. Admin Review.
- What to Show:
  - Phone verification sub-flow (SMS OTP simulation with 60s cooldown).
  - Masked Aadhaar upload zone with masking guidelines (first 8 digits hidden, PDF/PNG/JPEG under 5MB).
  - Explicit DPDP statutory consent checkbox and "Submit to Private Vault" action.
  - "Delete Document (Right to Erasure)" button.
- Technical Point: Explain 0o600 restricted file permissions, SHA-256 checksums, and non-public streaming.
- File Reference: src/pages/Profile.jsx, backend/src/routes/identity.js

[ Step 7: Administrative Review Queue ]
- What to Click: Sign out -> Log in as Admin (click "Use Demo Admin" on login screen) -> Navigate to /admin.
- What to Show:
  - Operations Dashboard with triage stats.
  - Reports tab: Update an incident status from "Submitted" to "Verified".
  - Identity tab: View the submitted Masked Aadhaar in the review queue, click "View Document" (opens secure binary stream), and record an approval or resubmission decision.
- File Reference: src/pages/admin/AdminDashboard.jsx, src/pages/admin/AdminIdentity.jsx

[ Step 8: Machine Learning Hotspot Benchmark & Candidates ]
- What to Click: In Admin Portal, click "Hotspot Candidates" (/admin/hotspots).
- What to Show:
  - The Evaluation Benchmark Card: 74.00% accuracy, 0.7509 ROC-AUC, 100 decision trees.
  - Expand a candidate row: Point out the ML Priority Probability, the balanced score formula (ML points /50 + Evidence points /50 = Score /100), and the Haversine distances to nearest police stations and streetlights.
  - Explain the Administrative Promotion Gate: Candidates remain invisible to the public until the Admin clicks "Designate Hotspot".
- File Reference: src/pages/admin/AdminHotspots.jsx, backend/src/services/mlHotspotInference.js

[ Step 9: Emergency SOS Protocol ]
- What to Click: Click red "SOS" button in navigation.
- What Happens: Full-screen modal activates:
  1. Primary Contact: Displays telephone dialer button (opens device tel: protocol).
  2. 112 Helpline: Direct dialer action.
  3. GPS Sharing: One-shot acquisition with 60-second staleness tracking.
  4. Dispatch Alert: Attempts backend gateway or displays instant direct device fallback links (SMS and WhatsApp).
- File Reference: src/components/SOSModal.jsx, backend/src/routes/escalations.js
```

---

## 2. Configuration & Execution Commands

### A. How to Run the Full Application Locally

1. **Start MongoDB:**
   Ensure MongoDB service is running locally on port `27017` (default: `mongodb://127.0.0.1:27017/sheq_dev`).
   ```bash
   mongod --dbpath "C:\data\db"
   ```

2. **Start the Express Backend API (Port 5000):**
   ```bash
   cd c:\Users\DELL\Desktop\SHEQ\backend
   npm run dev
   ```
   *Terminal will output:*
   `SHEQ API listening on http://localhost:5000 (development). MongoDB connected: mongodb://127.0.0.1:27017/sheq_dev`

3. **Start the React Frontend (Port 5173):**
   ```bash
   cd c:\Users\DELL\Desktop\SHEQ
   npm run dev
   ```
   *Terminal will output:*
   `VITE v7.3.6 ready in ... ms. Local: http://localhost:5173/`

4. **Run the Backend Test Suite:**
   ```bash
   cd c:\Users\DELL\Desktop\SHEQ\backend
   npm test
   ```
   *Runs all 42 automated tests via Node.js native test runner.*

5. **Build the Frontend Production Bundle:**
   ```bash
   cd c:\Users\DELL\Desktop\SHEQ
   npm run build
   ```
   *Compiles production assets into `dist/` in ~5.5s.*

---

## 3. Environment Variables Reference (`backend/.env`)

| Variable Name | Purpose | Default / Example | Required? |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP port for Express server | `5000` | Optional (defaults to 5000) |
| `NODE_ENV` | Environment mode | `development` | Optional |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/sheq_dev` | Required |
| `JWT_SECRET` | Secret key for signing bearer tokens | Minimum 32-character string | Required |
| `OTP_SECRET` | Secret key for HMAC-SHA256 OTP hashing | Minimum 32-character string | Required |
| `CLIENT_ORIGINS` | Permitted origins for CORS | `http://localhost:5173` | Required |
| `SMTP_HOST` | Outgoing SMTP mail server | `smtp.example.com` | Optional (SMTP fallback) |
| `SMTP_PORT` | Outgoing SMTP mail port | `587` | Optional |
| `SMTP_USER` | SMTP username | Account username | Optional |
| `SMTP_PASS` | SMTP password | Account password | Optional |
| `RESEND_API_KEY` | Resend email delivery API key | `re_...` | Optional |
| `TWILIO_ACCOUNT_SID`| Twilio telephony account identifier | `AC...` | Optional (SMS fallback) |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | Secret string | Optional |
| `TWILIO_FROM_PHONE` | Twilio registered sender number | `+1...` | Optional |
| `DOCUMENTS_STORAGE_PATH`| Directory for private vault storage | `uploads/vault_documents` | Optional |

---

## 4. Troubleshooting Common Issues

### Issue 1: `EADDRINUSE: address already in use :::5000`
* **Cause:** A previous Node.js server instance is still running in the background.
* **Fix (Windows PowerShell):**
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
  ```

### Issue 2: Frontend displays "Server is unreachable"
* **Check 1:** Verify the backend is running by opening `http://localhost:5000/api/health` in your browser. It should return `{"status":"ok"}`.
* **Check 2:** Check MongoDB status. If MongoDB is down, `health` returns `503` with `database: "disconnected"`.

### Issue 3: Resend free-tier domain warning
* **Behavior:** When registering with an email other than the account owner, `backend` logs:
  `Resend delivery failed: You can only send testing emails to your own email address...`
* **Why it happens:** Resend's free tier sandbox (`onboarding@resend.dev`) restricts recipients.
* **How SHEQ handles it:** `emailService.js` catches this cleanly and returns `{ delivered: false, notice: "..." }`. In development, developers can view the generated OTP in server console logs via the Dev OTP listener.
