# 06 — Safety Map, Emergency SOS & Machine Learning Hotspots

---

## 1. Safety Map & Geolocation Implementation

### A. Core Mapping Architecture
* **Frontend Component:** `src/pages/SafetyMap.jsx`
* **Underlying Engine:** Leaflet.js with OpenStreetMap (OSM) tile layers.
* **Coordinate Standard:** WGS84 standard spherical coordinates (`[latitude, longitude]` for Leaflet display, `[longitude, latitude]` for MongoDB GeoJSON storage).

### B. Map Interaction Flow
```
User inputs location search -> Leaflet centers coordinates ->
Reports queried from DataContext / REST API (GET /api/reports?nearLon=...&nearLat=...) ->
Leaflet renders SVG pin markers color-coded by incident category:
  - Red / Berry: Physical Harassment, Stalking, Verbal Harassment
  - Amber / Gold: Poor Lighting, Infrastructure Concern, Unsafe Area
  - Slate / Blue: Public Transport, Suspicious Activity, Other
        |
        v
User clicks map marker ->
Sidebar highlights active Incident Card ->
User clicks "View Incident Details" -> Navigates to /incident/:id.
```

### C. Geolocation Privacy Contract
* **One-Shot Authorization:** Geolocation is strictly **user-initiated and one-shot** via `navigator.geolocation.getCurrentPosition()`.
* **Zero Background Tracking:** SHEQ never runs continuous, background GPS tracking or stores breadcrumb trails of member travel routes.

---

## 2. Emergency SOS Protocol & Trusted Circles

### A. The 3 Emergency Actions in `SOSModal.jsx`
When a user clicks the persistent "SOS" button or visits `/sos`:

1. **Direct Phone Call Action (`tel:` protocol):**
   * Primary Contact or National Emergency (112).
   * **How it works:** Triggers `window.location.href = "tel:" + number`. This immediately opens the device's native telephone dialer with the target number pre-filled.
   * **Honest viva explanation:** The web browser cannot silently complete phone calls without carrier dialer interaction on the physical phone.
2. **One-Shot GPS Acquisition & Staleness Flagging:**
   * Acquires coordinates with high accuracy (`accuracy` in meters).
   * **Staleness Tracking:** If the user retrieved coordinates more than 60 seconds ago (`Date.now() - locTimestamp > 60000`), the UI displays an amber badge: `Stale GPS (>60s old)` and the backend tags the alert message with `[Cached/Stale GPS]`.
3. **Automated Server Dispatch vs Direct Client Fallbacks:**
   * **Automated Server Dispatch (`POST /api/escalations/sos-alert`):** If server SMS credentials (Twilio) or WhatsApp Cloud API tokens are configured in `backend/.env`, the server attempts live carrier delivery.
   * **Instant Client Fallbacks:** If external providers are unconfigured or fail, the modal generates prefilled direct device links that work 100% of the time:
     * **Direct SMS:** `sms:+919876543210,+919876543211?body=EMERGENCY%20SOS...`
     * **Direct WhatsApp:** `https://wa.me/?text=EMERGENCY%20SOS...`
     * **Clipboard Copy:** Copies coordinates and Google Maps link with one tap.

---

## 3. Machine Learning Hotspot Scoring (The Random Forest Engine)

### A. Simple Analogy: The Committee of 100 Experts
Imagine you want to know if an alleyway in Mumbai should be flagged for safety review. Instead of asking one person, you consult a **committee of 100 safety experts (Decision Trees)**:
* Expert #1 asks: *"Is it past 10 PM?"* $\rightarrow$ If yes: *"Is the nearest streetlight more than 500 meters away?"*
* Expert #2 asks: *"Is the incident category stalking?"* $\rightarrow$ If yes: *"Is the distance to a police station over 2 kilometers?"*
* Each of the 100 experts makes an independent assessment.
* At the end, you count the votes: if 72 out of 100 experts vote "High Priority", your **Random Forest probability is 72%**.

---

### B. Machine Learning Architecture: Training vs Live In-Memory Inference

A frequent mistake in viva examinations is claiming that the server runs Python during live user web requests. In SHEQ, the architecture is far more elegant:

```
[ OFFLINE TRAINING (Python 3.14 + Scikit-Learn) ]
File: backend/scripts/dataset_pipeline.py
- Reads: datasets/geospatial-crime-data/SHEQ_dataset2_SYNTHETIC_demo.csv (500 records)
- Feature Engineering: 12 features extracted (Haversine distances, time, one-hot categories)
- Stratified 80/20 train/test split (Random Seed: 42)
- Trains: RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
- Exports:
  1. backend/docs/hotspot_rf_model.joblib (Scikit-learn binary)
  2. backend/docs/hotspot_rf_model.json   (Full tree structure with thresholds & leaf values)
  3. backend/docs/model_evaluation_report.json (Measured scientific metrics)
                               |
                               v
[ LIVE IN-APP INFERENCE (Pure Node.js Engine) ]
File: backend/src/services/mlHotspotInference.js
- Boots: Reads hotspot_rf_model.json into memory (Cached in RAM)
- Reads: Mumbai police stations & streetlights GeoJSONs
- On Candidate Query (calculateHotspotCandidates in hotspotService.js):
  1. Computes spherical Haversine distances to nearest police station & streetlight in meters
  2. Constructs 12-dimensional feature vector
  3. Traverses all 100 decision trees in pure JavaScript (Takes < 1 millisecond!)
  4. Averages tree leaf class distributions -> rawMlProbability (0.0 to 1.0)
  5. Combines with community evidence to compute balanced Provisional Score.
```

---

### C. The 12 Training Features

| Index | Feature Name | Description |
| :---: | :--- | :--- |
| `0` | `latitude` | Spatial coordinate (e.g. `19.0760`). |
| `1` | `longitude` | Spatial coordinate (e.g. `72.8777`). |
| `2` | `hour` | Hour of the incident ($0 \text{ to } 23$). |
| `3` | `dayofweek` | Day of the week ($0 = \text{Monday to } 6 = \text{Sunday}$). |
| `4` | `is_weekend` | Binary flag ($1 \text{ if Saturday/Sunday, else } 0$). |
| `5` | `is_night` | Binary flag ($1 \text{ if between 8 PM and 5 AM, else } 0$). |
| `6` | `dist_nearest_police_km` | Haversine distance in km to nearest mapped police station. |
| `7` | `dist_nearest_streetlight_km`| Haversine distance in km to nearest mapped streetlight. |
| `8` | `cat_poor_lighting_concern` | One-hot encoded category flag. |
| `9` | `cat_stalking` | One-hot encoded category flag. |
| `10` | `cat_unsafe_public_area` | One-hot encoded category flag. |
| `11` | `cat_verbal_harassment` | One-hot encoded category flag. |

---

### D. Measured Scientific Metrics (From `model_evaluation_report.json`)

* **Model Type:** Scikit-Learn `RandomForestClassifier` (100 Trees, Max Depth 6)
* **Training Dataset:** `SHEQ_dataset2_SYNTHETIC_demo.csv` (500 records)
* **Validation Strategy:** Stratified 80/20 train/test split + 5-Fold Cross Validation
* **Exact Test Set Metrics:**
  * **Accuracy:** `74.00%`
  * **Precision:** `63.64%` (Of all areas flagged as high priority, 63.6% were true high-risk clusters)
  * **Recall:** `43.75%` (The model captured 43.8% of all true high-risk occurrences)
  * **F1-Score:** `51.85%` (Harmonic mean of precision and recall)
  * **ROC-AUC:** `0.7509` (Area Under Receiver Operating Characteristic Curve)
  * **5-Fold Cross-Validation AUC:** `0.6838` ($\pm 0.048$)
* **Top Feature Importances:**
  1. Night-time concentration: `19.6%`
  2. Incident hour: `18.6%`
  3. Distance to nearest streetlight: `14.3%`
  4. Latitude: `12.7%`
  5. Longitude: `12.4%`
  6. Distance to nearest police station: `9.7%`

---

### E. The Balanced Candidate Scoring Formula

To ensure safety decisions are explainable and never blindly dictated by an AI black-box, SHEQ enforces a **50/50 balanced scoring formula**:

$$\text{Provisional Score (0–100)} = \text{ML Component (0–50 pts)} + \text{Evidence Component (0–50 pts)}$$

Where:
* **ML Component (0–50 pts):** $\text{rawMlProbability} \times 50$.
* **Community Evidence Component (0–50 pts):**
  * **Volume Points (0–20 pts):** Scaled by total reports in the cluster.
  * **Recency Points (0–15 pts):** Exponential time decay favoring reports in the last 7 days.
  * **Corroboration Points (0–15 pts):** Net community confirmations minus disputes.

---

### F. Mandatory Administrative Gate (Human-in-the-Loop)

```
[ Spatial Clustering Grid (~220m) ]
                |
                v
[ 100-Tree Random Forest + Evidence Scoring ]
                |
                v
[ Status: "candidate" (Awaiting Review) ]
* NOTE: Candidates are STRICTLY HIDDEN from the public Safety Map.
                |
                v
[ Administrator Opens /admin/hotspots ]
Inspects ML confidence, evidence reports, severity index, night concentration ->
Clicks "Designate Hotspot"
                |
                v
[ Status: "designated" (Official SHEQ Hotspot) ]
* NOW VISIBLE to the public on the Safety Map and generates localized alerts.
```
