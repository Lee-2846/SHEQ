# SHEQ Dataset Audit and Machine Learning Evaluation Report
**Date:** 2026-10-18
**Status:** Evaluation-Ready (Reproducible Pipeline)

---

## 1. Dataset Audit and Provenance Summary

| Dataset File | Rows / Features | Geographic Coverage | Intended Role in SHEQ | Limitations & Unsuitability |
|---|---|---|---|---|
| `TABLE3B13.xlsx` to `TABLE3B43.xlsx` | 34–43 rows each | 34 Metropolitan Cities | Macro municipal context & chargesheeting benchmarks | **Unsuitable for point ML:** Aggregated city-level counts, no street/ward coordinates. |
| `SHEQ_Dataset4_Mumbai_Ward_Population_2011.csv` | 24 wards | Greater Mumbai (Wards A–T) | Administrative ward demographic context & slum ratio | **Historical Census 2011:** Baseline population, not dynamic real-time density. |
| `A-1_NO_OF_VILLAGES_TOWNS...xlsx` | 12,000+ rows | All India (District/Sub-district) | National reference demographics | **Unsuitable for local Mumbai analysis:** Too coarse geographic scale. |
| `PCA11-UA-0000.xlsx` | 9,000+ rows | All India Urban Agglomerations | Urban agglomeration baseline | **Unsuitable for local Mumbai analysis:** Too coarse geographic scale. |
| `mumbai_navi_mumbai_police_stations_expanded.geojson` | 175 Points | Mumbai & Navi Mumbai | Proximity context (distance to nearest station) | Community-mapped OSM points; coverage and operational response times not verified. |
| `mumbai_navi_mumbai_streetlights_expanded.geojson` | 673 Points | Mumbai & Navi Mumbai | Lighting infrastructure context | Community-mapped points; functional bulb status not guaranteed. |
| `mumbai_bus_stops.geojson` | 163 Points | Mumbai / Navi Mumbai | Public transit access context | Bus schedule or driver presence not captured. |
| `mumbai_roads_paths.geojson` | 3,980 Lines/Polygons | Mumbai | Road layout & pedestrian path network | Large vector dataset; used as map context. |
| `SHEQ_dataset2_SYNTHETIC_demo.csv` | 500 rows | Mumbai (Fabricated coords) | **ML Algorithm Demonstration Only** | **Synthetic Demo Only:** Must not be published as real incidents or real safety outcomes. |

---

## 2. Machine Learning Hotspot Model Evaluation

### Training Setup:
- **Dataset:** `datasets/geospatial-crime-data/SHEQ_dataset2_SYNTHETIC_demo.csv` (500 records)
- **Train/Test Split:** Stratified 80% Train (80% train (400 samples)), 20% Held-Out Test ( 20% test (101 samples))
- **Target Variable:** High-Priority Safety Candidate Designation (Binary)
- **Spatial Features Joined:** Distance to nearest police station (km), distance to nearest streetlight (km), hour, day of week, weekend indicator, night indicator, and incident category.

### Measured Results on Held-Out Test Set:

| Metric | Random Forest (100 Trees) | Logistic Regression Baseline |
|---|---|---|
| **Accuracy** | **74.00%** | 78.00% |
| **Precision** | **63.64%** | N/A |
| **Recall** | **43.75%** | N/A |
| **F1-Score** | **51.85%** | 62.07% |
| **ROC-AUC** | **0.7509** | 0.7661 |
| **5-Fold Cross-Validation AUC** | **0.6838 (+/- 0.0471)** | N/A |

### Confusion Matrix (Test Set, N=101):
- True Negatives: **60**
- False Positives: **8**
- False Negatives: **18**
- True Positives: **14**

### Top Feature Importances:
- **is_night:** 19.62%
- **hour:** 18.56%
- **dist_nearest_streetlight_km:** 14.25%
- **latitude:** 12.67%
- **longitude:** 12.42%
- **dist_nearest_police_km:** 9.68%

---

## 3. Honest Scientific Disclosures & Limitations
1. **Synthetic Data Constraint:** The model above is trained on `SHEQ_dataset2_SYNTHETIC_demo.csv`. It serves as a working, defensible proof-of-concept for geospatial and temporal machine learning. These metrics do NOT represent real-world incident prevention.
2. **Official NCRB Data Limitation:** Official NCRB crime tables (`TABLE3B13`–`TABLE3B43`) contain city-level aggregated counts. They do NOT contain street-level coordinates, so training a spatial machine-learning model on NCRB tables alone is mathematically impossible.
3. **Operational Separation:** In the live SHEQ platform, candidate hotspots are surfaced using an explainable spatial clustering baseline (`hotspotService.js`), and **never become official hotspots without authorized administrator review and designation**.
