import fs from "node:fs/promises";
import path from "node:path";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import InfrastructureFeature from "../src/models/InfrastructureFeature.js";

const file = env.geoJsonImportPath;
if (!file) {
  console.error("Set GEOJSON_IMPORT_PATH in backend/.env to a reviewed GeoJSON file.");
  process.exit(1);
}
const datasetName = path.basename(file);
try {
  await connectDatabase(env.mongoUri);
  const raw = JSON.parse(await fs.readFile(file, "utf8"));
  if (raw.type !== "FeatureCollection" || !Array.isArray(raw.features)) throw new Error("Expected a GeoJSON FeatureCollection.");
  let imported = 0, skipped = 0;
  for (const [index, feature] of raw.features.entries()) {
    if (!feature.geometry?.type || !feature.geometry?.coordinates) { skipped++; continue; }
    const properties = feature.properties || {};
    const sourceId = String(properties["@id"] || properties.id || `${datasetName}:${index}`);
    await InfrastructureFeature.updateOne({ sourceId }, { $set: {
      sourceId, sourceDataset: datasetName,
      featureType: String(properties.amenity || properties.highway || properties.power || feature.geometry.type),
      label: String(properties.name || properties.ref || "").slice(0, 250),
      geometry: feature.geometry, properties, sourceNote: "Imported GeoJSON; community mapping may be incomplete and does not establish service availability."
    } }, { upsert: true });
    imported++;
  }
  console.log(`GeoJSON import complete: ${imported} upserted, ${skipped} skipped from ${datasetName}.`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
