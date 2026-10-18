import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asyncHandler } from "../utils/asyncHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const infraDir = path.resolve(__dirname, "../../../datasets/infrastructure-data");

const router = Router();

// In-memory cache for fast, zero-database-overhead delivery
const cache = new Map();

async function loadGeoJson(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const filePath = path.join(infraDir, filename);
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  cache.set(filename, data);
  return data;
}

router.get("/summary", asyncHandler(async (req, res) => {
  const [ps, bs, sl] = await Promise.all([
    loadGeoJson("mumbai_navi_mumbai_police_stations_expanded.geojson").catch(() => null),
    loadGeoJson("mumbai_bus_stops.geojson").catch(() => null),
    loadGeoJson("mumbai_navi_mumbai_streetlights_expanded.geojson").catch(() => null)
  ]);

  return res.json({
    summary: {
      policeStations: ps?.features?.length || 0,
      busStops: bs?.features?.length || 0,
      streetlights: sl?.features?.length || 0,
      region: "Mumbai & Navi Mumbai",
      coordinateSystem: "WGS84 (EPSG:4326) [longitude, latitude]",
      sourceNote: "OpenStreetMap community-mapped geospatial infrastructure context. Infrastructure locations are NOT incident reports and do not imply active police presence or functioning lighting."
    }
  });
}));

router.get("/police-stations", asyncHandler(async (req, res) => {
  const data = await loadGeoJson("mumbai_navi_mumbai_police_stations_expanded.geojson");
  return res.json(data);
}));

router.get("/bus-stops", asyncHandler(async (req, res) => {
  const data = await loadGeoJson("mumbai_bus_stops.geojson");
  return res.json(data);
}));

router.get("/streetlights", asyncHandler(async (req, res) => {
  const data = await loadGeoJson("mumbai_navi_mumbai_streetlights_expanded.geojson");
  return res.json(data);
}));

export default router;
