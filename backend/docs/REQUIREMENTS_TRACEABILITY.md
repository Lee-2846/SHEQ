# Four-point requirements traceability

| Requirement | Included here | Still requires |
|---|---|---|
| Aadhaar identity verification | Secure provider integration boundary; disabled-by-default endpoint; no Aadhaar/OTP collection | Authorized provider, provider-specific adapter, consent flow, credentials, legal/security review |
| Connect frontend to backend | REST API, auth middleware, integration plan and service mapping | Local DB setup and reviewed edits to frontend service files |
| ML for hotspot provisional areas | Explainable activity baseline, candidate persistence/review/admin designation | Quality real-world data, model selection/training/validation and bias evaluation |
| Database and data/dataset integration | MongoDB models, GeoJSON import script, database-derived analytics, synthetic-data exclusion from hotspot scoring | Configure Atlas, review/import exact datasets, map data fields to UI, data quality and retention decisions |
