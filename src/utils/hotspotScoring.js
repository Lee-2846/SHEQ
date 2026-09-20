/**
 * SHEQ Hotspot Candidate Scoring Utility (Provisional Prototype)
 *
 * NOTE: This is an isolated modular prototype scoring mechanism for Phase 1.
 * It is NOT a scientifically validated safety score, risk probability, or prediction.
 * All weights are configurable and explicitly provisional.
 * No arbitrary category-specific weights are applied.
 *
 * Flow:
 *   Community Reports
 *          │
 *          ▼
 *   Hotspot Candidate (Provisional)
 *          │
 *   (Admin Review)
 *          │
 *          ▼
 *     SHEQ Hotspot
 */

export const PROVISIONAL_CONFIG = {
  // Score threshold required for a cluster/area to be flagged as a Hotspot Candidate
  candidateThreshold: 35,
  // Weight per report in the area
  reportWeight: 8,
  // Weight per community confirmation
  confirmationWeight: 1.5,
  // Multiplier for reports submitted recently (e.g. today or yesterday)
  recencyMultiplier: 1.25
};

/**
 * Calculates provisional candidate scores for geographic clusters or areas.
 * @param {Array} reports - List of incident reports
 * @param {Object} config - Configurable scoring parameters
 * @returns {Array} - Array of hotspot candidate objects for Admin review
 */
export function calculateHotspotCandidates(reports, config = PROVISIONAL_CONFIG) {
  if (!reports || reports.length === 0) return [];

  // Group reports by location/place name
  const clusters = {};

  reports.forEach(report => {
    const key = report.place || "Unknown Location";
    if (!clusters[key]) {
      clusters[key] = {
        place: key,
        city: report.city || "Pune",
        lat: report.lat,
        lng: report.lng,
        reports: [],
        totalConfirmations: 0,
        recentCount: 0
      };
    }

    clusters[key].reports.push(report);
    clusters[key].totalConfirmations += (report.confirmations || 0);

    const dateStr = (report.date || "").toLowerCase();
    if (dateStr.includes("today") || dateStr.includes("yesterday")) {
      clusters[key].recentCount += 1;
    }
  });

  // Calculate provisional score for each cluster
  const candidates = Object.values(clusters).map(cluster => {
    const reportCount = cluster.reports.length;
    const baseScore = reportCount * config.reportWeight;
    const confirmationScore = cluster.totalConfirmations * config.confirmationWeight;
    const recencyBonus = cluster.recentCount > 0 ? (cluster.recentCount * config.reportWeight * (config.recencyMultiplier - 1)) : 0;

    // Total raw provisional score capped at 100
    const rawScore = Math.min(100, Math.round(baseScore + confirmationScore + recencyBonus));

    const isCandidate = rawScore >= config.candidateThreshold || reportCount >= 2;

    return {
      id: `candidate-${cluster.place.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      place: cluster.place,
      city: cluster.city,
      lat: cluster.lat,
      lng: cluster.lng,
      reportCount,
      totalConfirmations: cluster.totalConfirmations,
      recentCount: cluster.recentCount,
      provisionalScore: rawScore,
      isCandidate,
      reports: cluster.reports,
      status: isCandidate ? "Candidate for Review" : "Standard Activity",
      disclaimer: "Provisional prototype candidate score based on community activity. Not a validated risk score."
    };
  });

  return candidates.filter(c => c.isCandidate);
}
