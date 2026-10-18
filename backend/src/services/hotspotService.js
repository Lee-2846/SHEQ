import Report from "../models/Report.js";

/**
 * Transparent activity-scoring baseline, NOT a validated ML model.
 * It proposes candidate areas for admin review; it never predicts that an area is dangerous.
 * Synthetic demo reports are excluded.
 */
export async function calculateHotspotCandidates({ days = 30, limit = 100 } = {}) {
  const since = new Date(Date.now() - days * 86400000);
  const reports = await Report.find({ createdAt: { $gte: since }, status: { $ne: "Flagged" }, sourceType: { $ne: "synthetic_demo" } })
    .select("location category confirmations createdAt sourceType").limit(10000).lean();
  const cells = new Map();
  for (const report of reports) {
    if (!report.location?.coordinates || report.location.coordinates.length !== 2) continue;
    const [lon, lat] = report.location.coordinates;
    // Coarse grid used as a transparent prototype parameter, not a calibrated risk threshold.
    const key = `${Math.round(lon * 1000) / 1000}:${Math.round(lat * 1000) / 1000}`;
    const cell = cells.get(key) || { lon: 0, lat: 0, count: 0, recent: 0, confirmations: 0, categories: new Set(), ids: [] };
    cell.lon += lon; cell.lat += lat; cell.count++;
    if (report.createdAt >= new Date(Date.now() - 7 * 86400000)) cell.recent++;
    cell.confirmations += report.confirmations || 0;
    cell.categories.add(report.category);
    cell.ids.push(report._id);
    cells.set(key, cell);
  }
  return [...cells.values()].filter(c => c.count >= 2).map(c => ({
    label: "High report activity — review required",
    center: { type: "Point", coordinates: [c.lon / c.count, c.lat / c.count] },
    score: Math.min(100, Math.round(Math.min(c.count, 20) * 2.5 + Math.min(c.recent, 10) * 3 + Math.min(c.confirmations, 20) * 0.75 + Math.min(c.categories.size, 5) * 2)),
    factors: { reportCount: c.count, recentReportCount: c.recent, confirmations: c.confirmations, categoryMix: c.categories.size },
    evidenceReportIds: c.ids,
    rationale: "Explainable activity score from report volume, recency, community confirmations, and category variety. It is not a danger prediction; administrator review is required.",
    algorithmVersion: "transparent-baseline-v1"
  })).sort((a, b) => b.score - a.score).slice(0, limit);
}
