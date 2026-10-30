# 08 — Master Viva Question Bank & Code Proofs

---

## Topic 1: Project Overview & Objectives

### Q1: What problem does SHEQ solve and why is it necessary?
* **Short Answer:** SHEQ provides a hyper-local, community-driven safety intelligence platform that captures everyday urban safety hazards (broken streetlights, harassment, unsafe alleys) in real-time with geospatial coordinates, bridging the gap between annual municipal crime totals and immediate commuter needs.
* **Simple Explanation:** Official police reports only tell you how many crimes occurred in Mumbai last year. They don't tell a woman walking home at 10 PM whether the streetlights on her route are broken tonight. SHEQ provides that ground-level information.
* **Technical Explanation:** It integrates citizen reporting with OpenStreetMap geospatial visualization, multi-signal spatial clustering, in-memory Random Forest machine learning inference, and privacy-preserving document verification under Indian DPDP principles.
* **Code Proof:** Open `PRD.md` and `src/pages/Landing.jsx`.
* **Faculty Follow-up:** *"How do you prevent false reports or spam from ruining the data?"*
* **Follow-up Answer:** *"Through a multi-layered trust model: duplicate confirmations are blocked by unique compound database indexes, disputes are tracked, verified members undergo Masked Aadhaar review, and provisional hotspot candidates require human administrator designation before appearing publicly."*

---

### Q2: What is the primary architectural stack of SHEQ?
* **Short Answer:** A MERN-aligned single-page web architecture: React 19 frontend bundled with Vite, an Express.js Node.js REST API, MongoDB with Mongoose for spatial document persistence, and an in-memory 100-tree Random Forest inference engine.
* **Code Proof:** `package.json` (frontend) and `backend/package.json`.

---

## Topic 2: Frontend & React Architecture

### Q3: Why did you choose React over plain HTML/JavaScript?
* **Short Answer:** React's component-based virtual DOM architecture allows real-time reactive UI updates (like map pin filtering, live incident voting, and form stepper wizards) without full-page reloads, providing a smooth app-like commuter experience.
* **Simple Explanation:** With plain HTML, submitting a report or filtering markers requires refreshing the entire screen. With React, only the specific card or badge re-renders.
* **Technical Explanation:** React maintains an in-memory Virtual DOM. When state changes in `DataContext`, React computes the minimal reconciliation diff and updates only the altered DOM nodes.
* **Code Proof:** Open `src/App.jsx` and `src/context/DataContext.jsx`.
* **Faculty Follow-up:** *"What is the difference between props and state in React?"*
* **Follow-up Answer:** *"Props are immutable parameters passed down from a parent component to a child (like passing report data to `<ReportCard report={r} />`). State is internal, mutable data managed by the component itself using `useState` (like toggling an SOS modal open or closed)."*

---

### Q4: How does route protection work in your frontend?
* **Short Answer:** Using custom wrapper components (`<ProtectedRoute />` and `<AdminRoute />`) in React Router that inspect `AuthContext` state and redirect unauthorized visitors to `/login` or `/dashboard`.
* **Technical Explanation:** When a user navigates to `/admin`, `AdminRoute` reads `user.role` from `useAuth()`. If `role !== "admin"`, it returns `<Navigate to="/dashboard" replace />`, blocking the render of admin sub-pages before any DOM elements mount.
* **Code Proof:** `src/components/AdminRoute.jsx` and `src/components/ProtectedRoute.jsx`.

---

## Topic 3: Backend & API Architecture

### Q5: Why is Node.js suitable for this application?
* **Short Answer:** Node.js uses an event-driven, non-blocking asynchronous I/O model that excels at concurrent REST API operations, geospatial queries, and real-time alert dispatches without the thread-overhead of multi-threaded servers.
* **Code Proof:** `backend/src/server.js` and `backend/src/app.js`.
* **Faculty Follow-up:** *"If Node.js is single-threaded, how does it handle CPU-heavy tasks like password hashing?"*
* **Follow-up Answer:** *"Node.js offloads CPU-intensive operations (like `bcrypt.hash` and crypto HMAC generation) to its background worker thread pool managed by `libuv`, keeping the main event loop completely unblocked."*

---

### Q6: What is middleware in Express and why does its order matter?
* **Short Answer:** Middleware functions execute sequentially during the HTTP request-response cycle, with access to `req`, `res`, and `next`. Order matters because security checks, body parsing, and authentication must occur before route handlers execute.
* **Technical Explanation:** In `backend/src/app.js`, `cors()` and `helmet()` execute first to establish security headers. `express.json()` parses the raw body stream into a JavaScript object. Then router middleware mounts. Finally, `notFound` and `errorHandler` catch unhandled errors at the bottom.
* **Code Proof:** `backend/src/app.js` (Lines 21–56).

---

## Topic 4: Database & Mongoose

### Q7: Why did you choose MongoDB instead of MySQL/PostgreSQL?
* **Short Answer:** MongoDB provides native support for GeoJSON spherical geometries and high-performance `2dsphere` spatial indexing, allowing instant `$near` distance queries within specified radii without complex relational joins.
* **Technical Explanation:** In `Report.js`, locations are modeled as `{ type: "Point", coordinates: [longitude, latitude] }` indexed with `{ location: "2dsphere" }`. This allows queries like `filter.location = { $near: { $geometry: point, $maxDistance: 2000 } }` to run in sub-millisecond time.
* **Code Proof:** `backend/src/models/Report.js` and `backend/src/routes/reports.js`.

---

### Q8: How do you prevent users from spamming confirmations on an incident?
* **Short Answer:** We enforce a database-level unique compound index on the `Confirmation` model: `{ reportId: 1, userId: 1 }` with `{ unique: true }`.
* **Technical Explanation:** Even if a user sends 20 concurrent HTTP requests, MongoDB's storage engine enforces uniqueness across the compound key. Any duplicate attempt throws error code `11000`, which our route handler catches and returns as HTTP `409 Conflict: You have already confirmed this report`.
* **Code Proof:** `backend/src/models/Confirmation.js` and `backend/src/routes/reports.js` (Lines 56–66).

---

## Topic 5: Authentication & Security

### Q9: How are One-Time Passcodes (OTPs) secured in the database?
* **Short Answer:** Raw OTPs are never stored in the database. Instead, they are hashed using HMAC-SHA256 with a server-side secret key and compared using constant-time buffer comparisons.
* **Technical Explanation:** When an OTP is generated (`crypto.randomInt(100000, 1000000)`), the backend hashes it via `crypto.createHmac("sha256", env.otpSecret).update(`${identifier}:${otp}`).digest("hex")`. When the user enters their code, `crypto.timingSafeEqual()` compares the buffers to eliminate timing-attack vulnerabilities.
* **Code Proof:** `backend/src/routes/auth.js` (`hashOtp`, `hashPhoneOtp`).

---

### Q10: What is the purpose of JWT and what does it contain?
* **Short Answer:** A signed JSON Web Token allows stateless authentication; the client stores the token and transmits it in the `Authorization: Bearer` header, allowing the backend to verify the user without maintaining server-side session memory.
* **Technical Explanation:** The payload contains `{ sub: user._id, role: user.role }` signed with `HMAC-SHA256` using `env.jwtSecret` with a 7-day expiration.
* **Code Proof:** `backend/src/services/tokenService.js`.

---

## Topic 6: Identity Verification & Masked Aadhaar Vault

### Q11: Where are submitted identity documents stored and are they safe?
* **Short Answer:** Uploaded documents are stored in an isolated private vault on the server disk (`backend/uploads/vault_documents/`) with restricted `0o600` permissions. They are completely outside public web directories and can only be streamed by the owner or an authenticated admin.
* **Technical Explanation:** Access is guarded by `GET /api/identity/document/:userId`. The endpoint verifies JWT role permissions, logs an immutable event in `IdentityAudit`, and pipes the file stream directly with `X-Content-Type-Options: nosniff`. There is zero static web hosting.
* **Code Proof:** `backend/src/routes/identity.js` (Lines 168–206).

---

### Q12: How do you prevent users from uploading malicious executable files?
* **Short Answer:** Through binary magic-byte inspection on the raw buffer before any file is written to disk.
* **Technical Explanation:** In `backend/src/routes/identity.js`, `validateMagicBytes()` reads the first 4 bytes of the binary buffer. It strictly verifies that PDF starts with `%PDF` (`0x25 0x50 0x44 0x46`), PNG starts with `0x89 0x50 0x4E 0x47`, and JPEG starts with `0xFF 0xD8 0xFF`. Spoofed file extensions (e.g. an `.exe` renamed to `.png`) are immediately rejected.
* **Code Proof:** `backend/src/routes/identity.js` (Lines 36–55) and `backend/tests/identity_vault.test.js`.

---

## Topic 7: Machine Learning & Hotspots

### Q13: Why did you choose Random Forest instead of a Deep Neural Network?
* **Short Answer:** Random Forest provides high accuracy on tabular geospatial data, handles non-linear interactions between infrastructure distances and time, resists overfitting on small-to-medium datasets, and provides transparent feature importances required for explainable civic decisions.
* **Simple Explanation:** A deep neural network is a complete "black box" that requires millions of rows of data. A Random Forest is an ensemble of explainable decision trees where we can inspect exactly which features (like streetlight distance or night hours) influenced the decision.
* **Code Proof:** `backend/scripts/dataset_pipeline.py` and `backend/docs/DATASET_AND_MODEL_REPORT.md`.

---

### Q14: How does live ML inference run without slowing down the server?
* **Short Answer:** The trained model's 100 decision trees were serialized into a clean JSON structure (`hotspot_rf_model.json`). Node.js loads this once into RAM and executes the tree traversals in pure JavaScript in under 1 millisecond.
* **Technical Explanation:** Spawning Python child processes during live web requests introduces massive overhead (500–1000ms latency). Our custom Node.js engine (`mlHotspotInference.js`) traverses the tree nodes using array indexes in memory, delivering 100% mathematical parity to Scikit-Learn's `predict_proba` with zero external runtime dependencies.
* **Code Proof:** `backend/src/services/mlHotspotInference.js`.

---

### Q15: What are the exact evaluation metrics of your ML model?
* **Short Answer:** Evaluated on an 80/20 stratified test split: **Accuracy: 74.00%**, **Precision: 63.64%**, **Recall: 43.75%**, **F1-Score: 51.85%**, and **ROC-AUC: 0.7509** (5-Fold Cross-Validation AUC: 0.6838).
* **Code Proof:** `backend/docs/model_evaluation_report.json`.

---

### Q16: Can a machine learning model prediction directly declare an area a public hotspot?
* **Short Answer:** **NO.** By deliberate ethical design, ML scores are provisional candidate signals only. Promoting a candidate to an official public SHEQ Hotspot requires human review and designation by an authorized safety administrator.
* **Code Proof:** `backend/src/routes/hotspots.js` (`/candidates` vs `/:id/review`).

---

## Topic 8: Emergency SOS & Geolocation

### Q17: When someone activates SOS, does the web app automatically call the police?
* **Short Answer:** No. Web browsers do not have permission to silently initiate phone calls. Instead, SHEQ uses the standard `tel:` protocol to open the device's native telephone dialer to primary contacts or 112 for immediate user confirmation.
* **Code Proof:** `src/components/SOSModal.jsx` (`handleTriggerCall`).

---

### Q18: What happens if an external SMS provider (like Twilio) is unconfigured or fails during SOS?
* **Short Answer:** The system falls back to instant client-assisted transmission. The modal generates prefilled direct device links (`sms:` and `https://wa.me/?text=...`) containing verified coordinates and emergency text, allowing the user to transmit the alert directly from their phone with one tap.
* **Code Proof:** `src/components/SOSModal.jsx` and `backend/src/routes/escalations.js`.
