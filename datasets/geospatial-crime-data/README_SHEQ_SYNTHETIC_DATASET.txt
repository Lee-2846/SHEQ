SHEQ Dataset 2 — SYNTHETIC DEMO DATA
=====================================

Purpose
-------
Fabricated test data for SHEQ's geospatial ingestion, cleaning, API, map
rendering, and prototype hotspot pipeline.

IMPORTANT LIMITATIONS
---------------------
- None of these records describe real incidents.
- Coordinates are randomly generated around broad Mumbai map reference points
  only to exercise map functionality; they do NOT indicate unsafe places.
- Do not publish these records as real incidents or claim they show danger.
- This dataset is not evidence that a model can predict actual incidents.
- For meaningful evaluation, use legally usable, documented, appropriately
  geocoded data and carefully anonymized SHEQ reports, with time-separated
  validation.
- Verification labels are synthetic demonstration labels.

Schema
------
incident_id: synthetic identifier
incident_datetime: fabricated date/time
latitude, longitude: fabricated map-test coordinates
city: explicitly labelled synthetic
incident_category: fabricated category
report_channel: fabricated channel
verification_status: fabricated demo status
source_type: synthetic_generated
is_synthetic: always True
training_note: warning attached to each record

Recommended use
---------------
Keep outside the Git repository initially. Preserve the synthetic flag.
Do not display these rows as real community reports in production.
