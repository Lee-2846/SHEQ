/**
 * SHEQ Hotspot Candidate Scoring Utility (Modular Multi-Signal Architecture)
 *
 * NOTE: This is an explainable activity scoring baseline, NOT a scientifically
 * validated probability of crime or danger.
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

const SEVERITY_WEIGHTS = {
  "Harassment": 1.5,
  "Stalking": 1.5,
  "Theft": 1.4,
  "Unsafe Transport": 1.3,
  "Suspicious Activity": 1.2,
  "Unsafe / Isolated Area": 1.2,
  "Poor Lighting": 1.0,
  "Broken CCTV": 1.0,
  "Infrastructure Concern": 1.0,
  "Other": 1.0
};

export const PROVISIONAL_CONFIG = {
  candidateThreshold: 30,
  minReportsThreshold: 2
};

/**
 * Calculates modular multi-signal candidate scores for clusters of reports.
 *
 * @param {Array} reports - List of incident reports
 * @param {Object} [config] - Configurable scoring parameters
 * @returns {Array} - Array of hotspot candidate objects for Admin review
 */
export function calculateHotspotCandidates(reports, config = PROVISIONAL_CONFIG) {
  if (!reports || reports.length === 0) return [];

  // Group reports by location/place name or coarse coordinates
  const clusters = {};

  reports.forEach(report => {
    // Exclude synthetic demo records if flagged
    if (report.sourceType === "synthetic_demo" || report.status === "Flagged") return;

    const key = report.place || "Unknown Location";
    if (!clusters[key]) {
      clusters[key] = {
        place: key,
        city: report.city || "Pune",
        lat: report.lat,
        lng: report.lng,
        reports: [],
        totalConfirmations: 0,
        totalDisputes: 0,
        recentCount: 0,
        nightCount: 0,
        severitySum: 0,
        categories: new Set()
      };
    }

    const c = clusters[key];
    c.reports.push(report);
    c.totalConfirmations += (report.confirmations || 0);
    c.totalDisputes += (report.disputes || 0);

    const dateStr = (report.date || "").toLowerCase();
    const isRecent = dateStr.includes("today") || dateStr.includes("yesterday") || dateStr.includes("sep 2026");
    if (isRecent) {
      c.recentCount += 1;
    }

    const timeStr = (report.time || "").toLowerCase();
    const isNight = timeStr.includes("night") || timeStr.includes("evening") || timeStr.includes("pm") || timeStr.includes("2") || timeStr.includes("0");
    if (isNight) {
      c.nightCount += 1;
    }

    const sev = SEVERITY_WEIGHTS[report.category] || 1.0;
    c.severitySum += sev;
    c.categories.add(report.category || "General");
  });

  // Calculate provisional multi-signal score for each cluster
  const candidates = Object.values(clusters).map(cluster => {
    const count = cluster.reports.length;
    const avgSeverity = count > 0 ? (cluster.severitySum / count) : 1.0;
    const nightRatio = count > 0 ? (cluster.nightCount / count) : 0;
    const netConfirmations = Math.max(0, cluster.totalConfirmations - (cluster.totalDisputes * 1.5));

    // Factor 1: Report Volume (up to 35 points)
    const volumeScore = Math.min(35, count * 3.5);

    // Factor 2: Recency (up to 25 points)
    const recencyScore = Math.min(25, cluster.recentCount * 7.5);

    // Factor 3: Incident Severity (up to 15 points)
    const severityScore = Math.min(15, (avgSeverity - 1.0) * 30);

    // Factor 4: Community Confirmations (up to 15 points)
    const confirmationScore = Math.min(15, netConfirmations * 1.5);

    // Factor 5: Night Concentration (up to 10 points)
    const nightScore = nightRatio * 10;

    const rawScore = Math.min(100, Math.round(volumeScore + recencyScore + severityScore + confirmationScore + nightScore));
    const isCandidate = rawScore >= config.candidateThreshold || count >= config.minReportsThreshold;

    return {
      id: `candidate-${cluster.place.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      place: cluster.place,
      city: cluster.city,
      lat: cluster.lat,
      lng: cluster.lng,
      reportCount: count,
      totalConfirmations: cluster.totalConfirmations,
      totalDisputes: cluster.totalDisputes,
      recentCount: cluster.recentCount,
      provisionalScore: rawScore,
      factors: {
        reportCount: count,
        recentReportCount: cluster.recentCount,
        severityIndex: Math.round(avgSeverity * 100) / 100,
        netConfirmations: Math.round(netConfirmations * 10) / 10,
        nightIncidentRatio: `${Math.round(nightRatio * 100)}%`,
        categoryMix: cluster.categories.size
      },
      isCandidate,
      reports: cluster.reports,
      status: "Candidate for Review",
      reviewStatus: "Pending Review",
      disclaimer: "Provisional multi-signal activity score from volume, recency, severity, confirmations, and night-time distribution. Administrator review is required before designation."
    };
  });

  return candidates
    .filter(c => c.isCandidate)
    .sort((a, b) => b.provisionalScore - a.provisionalScore);
}
