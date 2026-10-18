import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");

test("Datasets Audit: official crime and demographic files exist on disk", async () => {
  const officialCrimeDir = path.join(PROJECT_ROOT, "datasets/official-crime-data");
  const files = await fs.readdir(officialCrimeDir);
  assert.ok(files.includes("TABLE3B13.xlsx"));
  assert.ok(files.includes("TABLE3B23.xlsx"));
  assert.ok(files.includes("TABLE3B33.xlsx"));
  assert.ok(files.includes("TABLE3B43.xlsx"));
});

test("Datasets Audit: synthetic demo dataset is present and accompanied by disclosure README", async () => {
  const synthDir = path.join(PROJECT_ROOT, "datasets/geospatial-crime-data");
  const files = await fs.readdir(synthDir);
  assert.ok(files.includes("SHEQ_dataset2_SYNTHETIC_demo.csv"));
  assert.ok(files.includes("README_SHEQ_SYNTHETIC_DATASET.txt"));

  const readme = await fs.readFile(path.join(synthDir, "README_SHEQ_SYNTHETIC_DATASET.txt"), "utf8");
  assert.match(readme, /SYNTHETIC DEMO DATA/);
  assert.match(readme, /None of these records describe real incidents/);
});

test("Datasets Audit: Mumbai infrastructure GeoJSON files exist and contain features", async () => {
  const infraDir = path.join(PROJECT_ROOT, "datasets/infrastructure-data");
  const files = await fs.readdir(infraDir);
  assert.ok(files.includes("mumbai_navi_mumbai_police_stations_expanded.geojson"));
  assert.ok(files.includes("mumbai_navi_mumbai_streetlights_expanded.geojson"));
  assert.ok(files.includes("mumbai_bus_stops.geojson"));

  const psData = JSON.parse(await fs.readFile(path.join(infraDir, "mumbai_navi_mumbai_police_stations_expanded.geojson"), "utf8"));
  assert.equal(psData.type, "FeatureCollection");
  assert.ok(psData.features.length >= 100);
});

test("ML Model Evaluation Report: artifact exists with measured scientific metrics", async () => {
  const reportPath = path.join(PROJECT_ROOT, "backend/docs/model_evaluation_report.json");
  const exists = await fs.stat(reportPath).then(() => true).catch(() => false);
  assert.equal(exists, true, "model_evaluation_report.json must be generated");

  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  assert.ok(report.random_forest_metrics);
  assert.ok(report.random_forest_metrics.accuracy > 0);
  assert.ok(report.random_forest_metrics.roc_auc > 0);
  assert.ok(report.random_forest_metrics.confusion_matrix);
  assert.ok(Array.isArray(report.random_forest_metrics.top_features));
  assert.ok(Array.isArray(report.honest_ml_limitations));
});
