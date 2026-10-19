import { useState } from "react";
import { Flame, CheckCircle2, Info, ShieldCheck, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useData } from "../../context/DataContext";

export default function AdminHotspots() {
  const { hotspotCandidates, hotspots, promoteHotspotCandidate, toggleHotspotActive } = useData();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [designationReason, setDesignationReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);

  function handlePromote(candidate) {
    promoteHotspotCandidate(candidate, {
      reason: designationReason || `Designated by SHEQ admin review based on ${candidate.reportCount} reports and ${candidate.totalConfirmations} confirmations.`,
      adminNotes: adminNotes || "Official SHEQ Hotspot verified."
    });
    setSelectedCandidate(null);
    setDesignationReason("");
    setAdminNotes("");
    setSuccessMessage(`"${candidate.place}" successfully designated as SHEQ Hotspot.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  }

  return (
    <div className="admin-hotspots-page">
      {/* Notice Banner */}
      <div className="provisional-scoring-banner">
        <Info size={20} className="text-berry" />
        <div>
          <strong>Modular Multi-Signal Hotspot Scoring & Offline ML Evaluation</strong>
          <p>
            The candidate list below surfaces potential hotspot areas using an explainable multi-signal baseline
            (report volume, recency, category severity, community confirmations, and night-time concentration).
            Scores are provisional signals for administrative review, not scientifically validated risk probabilities.
          </p>
        </div>
      </div>

      {/* Machine Learning Model Benchmark Card */}
      <div className="detail-card" style={{ marginTop: "16px", background: "#fcf8f9", border: "1px solid rgba(108, 47, 65, 0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--berry)" }}>EVALUATION BENCHMARK: MACHINE LEARNING MODEL</div>
            <h4 style={{ margin: "4px 0" }}>Random Forest Classifier (Scikit-Learn, 100 Trees)</h4>
            <p className="card-sub-copy" style={{ margin: "2px 0 10px" }}>
              Trained on <code>SHEQ_dataset2_SYNTHETIC_demo.csv</code> with 80/20 stratified train/test split (Random Seed: 42).
            </p>
          </div>
          <span className="badge badge-category" style={{ fontSize: "11px" }}>
            scikit-learn 1.9.1 · Seed: 42
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginTop: "10px" }}>
          <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <small style={{ color: "var(--muted)", display: "block" }}>Accuracy</small>
            <strong style={{ fontSize: "16px", color: "var(--berry)" }}>74.00%</strong>
          </div>
          <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <small style={{ color: "var(--muted)", display: "block" }}>Precision</small>
            <strong style={{ fontSize: "16px", color: "var(--berry)" }}>63.64%</strong>
          </div>
          <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <small style={{ color: "var(--muted)", display: "block" }}>Recall</small>
            <strong style={{ fontSize: "16px", color: "var(--berry)" }}>43.75%</strong>
          </div>
          <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <small style={{ color: "var(--muted)", display: "block" }}>F1-Score</small>
            <strong style={{ fontSize: "16px", color: "var(--berry)" }}>51.85%</strong>
          </div>
          <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <small style={{ color: "var(--muted)", display: "block" }}>ROC-AUC</small>
            <strong style={{ fontSize: "16px", color: "var(--berry)" }}>0.7509</strong>
          </div>
          <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <small style={{ color: "var(--muted)", display: "block" }}>5-Fold CV AUC</small>
            <strong style={{ fontSize: "16px", color: "var(--berry)" }}>0.6838</strong>
          </div>
        </div>

        <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--line)", paddingTop: "8px", lineHeight: "1.5" }}>
          <strong>Top Feature Importances:</strong> Night-time incident (19.6%) · Incident hour (18.6%) · Distance to nearest streetlight (14.3%) · Latitude (12.7%) · Longitude (12.4%) · Distance to police station (9.7%).
          <br />
          <strong>Scientific Limitations & Data Provenance:</strong> The benchmark above is trained on synthetic demo coordinates (<code>SHEQ_dataset2_SYNTHETIC_demo.csv</code>). Official NCRB Table 3B records are municipal aggregate counts without street coordinates. Operational hotspot designation requires human administrator review.
        </div>
      </div>

      {successMessage && (
        <div className="alert-banner-success" style={{ margin: "16px 0" }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {/* Section 1: Hotspot Candidates (Awaiting Review) */}
      <div className="detail-card" style={{ marginTop: "20px" }}>
        <div className="eyebrow">STEP 1: HOTSPOT CANDIDATES</div>
        <h3>Provisional Candidates Flagged for Admin Review</h3>
        <p className="card-sub-copy">
          The candidate workflow enforces: <code>Hotspot Candidate → Admin Review → SHEQ Hotspot</code>.
          Candidates are provisional signals and will not appear on the community Safety Map until formally designated by an administrator.
        </p>

        <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Location / Cluster</th>
                <th>Report Volume</th>
                <th>Community Confirmations</th>
                <th>Contributing Signals</th>
                <th>Provisional Score</th>
                <th>Review Status</th>
                <th>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {hotspotCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>
                    No areas currently meet the candidate activity threshold.
                  </td>
                </tr>
              ) : (
                hotspotCandidates.map(c => {
                  const alreadyHotspot = hotspots.some(h => h.place === c.place && h.active);
                  const isExpanded = expandedCandidateId === c.id;

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.place}</strong>
                        <small style={{ display: "block", color: "var(--muted)" }}>{c.city}</small>
                        <button
                          type="button"
                          className="text-btn-accent"
                          style={{ fontSize: "11px", marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "2px" }}
                          onClick={() => setExpandedCandidateId(isExpanded ? null : c.id)}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? "Hide ML & Signals" : "View ML & Signal Breakdown"}
                        </button>

                        {isExpanded && (
                          <div style={{ margin: "8px 0", padding: "10px", background: "#f8f9fa", borderRadius: "8px", fontSize: "11px", border: "1px solid var(--line)", lineHeight: 1.5 }}>
                            {/* ML Model Engine Details */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                              <span className="badge badge-category" style={{ fontSize: "10px" }}>
                                {c.isFallback ? "Heuristic Fallback" : (c.algorithmVersion || "ml-random-forest-v1")}
                              </span>
                              {c.rawMlProbability != null && (
                                <strong style={{ color: "var(--berry)" }}>
                                  {(c.rawMlProbability * 100).toFixed(1)}% ML Priority Probability
                                </strong>
                              )}
                            </div>

                            {/* Score Breakdown (ML vs Evidence) */}
                            <div style={{ padding: "6px 8px", background: "#fff", borderRadius: "6px", border: "1px solid var(--line)", marginBottom: "6px" }}>
                              <div><strong>Score Formula:</strong> ML Points ({c.mlScoreContribution ?? 0}/50) + Evidence Points ({c.evidenceScoreContribution ?? 0}/50) = <strong>{c.provisionalScore || c.score}/100</strong></div>
                              {c.featuresUsed && (
                                <div style={{ color: "var(--muted)", marginTop: "2px", fontSize: "10px" }}>
                                  Infrastructure Haversine Proximities: Police Station ~{Math.round(c.featuresUsed.dist_police_station_m || 0)}m · Streetlight ~{Math.round(c.featuresUsed.dist_streetlight_m || 0)}m
                                </div>
                              )}
                            </div>

                            <div><strong>Severity Index:</strong> {c.factors?.severityIndex || "1.0"}x</div>
                            <div><strong>Night Concentration:</strong> {c.factors?.nightIncidentRatio || "0%"}</div>
                            <div><strong>Recent Activity:</strong> {c.factors?.recentReportCount || c.recentCount || 0} reports in last 7 days</div>
                            <div><strong>Category Mix:</strong> {c.factors?.categoryMix || 1} distinct categories (Top: {c.factors?.topCategory || "General"})</div>

                            <div style={{ color: "var(--ink)", marginTop: "6px", fontStyle: "italic", fontSize: "11px" }}>
                              {c.rationale}
                            </div>
                            <div style={{ color: "var(--muted)", marginTop: "4px", fontSize: "10px" }}>
                              <em>{c.disclaimer}</em>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-status-submitted">{c.reportCount} reports</span>
                        {c.recentCount > 0 && (
                          <small style={{ display: "block", color: "var(--berry)", fontSize: "11px", marginTop: "2px" }}>
                            {c.recentCount} recent
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-status-verified">{c.totalConfirmations} confirmations</span>
                        {c.totalDisputes > 0 && (
                          <small style={{ display: "block", color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>
                            {c.totalDisputes} disputes
                          </small>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", display: "block" }}>
                          Night: <strong>{c.factors?.nightIncidentRatio || "Standard"}</strong>
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          Sev: {c.factors?.severityIndex || "1.0"}x
                        </span>
                      </td>
                      <td>
                        <div className="score-cell">
                          <strong style={{ fontSize: "16px", color: "var(--berry)" }}>{c.provisionalScore}</strong>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}> / 100</span>
                        </div>
                      </td>
                      <td>
                        {alreadyHotspot ? (
                          <span className="badge badge-signal-attention">Already Designated</span>
                        ) : (
                          <span className="badge badge-status-review">Pending Review</span>
                        )}
                      </td>
                      <td>
                        {alreadyHotspot ? (
                          <span className="text-muted-sm">Designated Active</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-berry btn-xs"
                            onClick={() => setSelectedCandidate(c)}
                          >
                            <Flame size={12} /> Designate Hotspot
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Designated SHEQ Hotspots */}
      <div className="detail-card" style={{ marginTop: "24px" }}>
        <div className="eyebrow">STEP 2: ACTIVE SHEQ HOTSPOTS</div>
        <h3>Officially Designated SHEQ Hotspots ({hotspots.filter(h => h.active).length} active)</h3>
        <p className="card-sub-copy">
          Designated hotspots are displayed on the community Safety Map and highlighted in personalized safety alerts for users with saved places.
        </p>

        <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hotspot Location</th>
                <th>Designated Date</th>
                <th>Reason / Focus</th>
                <th>Supporting Reports</th>
                <th>Active Status</th>
                <th>Toggle Active</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map(h => (
                <tr key={h.id}>
                  <td>
                    <strong>{h.place}</strong>
                    <small style={{ display: "block", color: "var(--muted)" }}>{h.city}</small>
                  </td>
                  <td>
                    <small>{h.designatedDate}</small>
                  </td>
                  <td>
                    <p style={{ margin: 0, fontSize: "13px" }}>{h.reason}</p>
                    {h.adminNotes && <small style={{ color: "var(--muted)" }}>Note: {h.adminNotes}</small>}
                  </td>
                  <td>
                    <span className="badge badge-status-verified">{h.supportingReportsCount || 1} reports</span>
                  </td>
                  <td>
                    <span className={`badge ${h.active ? "badge-status-verified" : "badge-status-submitted"}`}>
                      {h.active ? "Active Hotspot" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => toggleHotspotActive(h.id)}
                    >
                      {h.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Designation Modal */}
      {selectedCandidate && (
        <div className="modal-backdrop" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="eyebrow">ADMIN HOTSPOT DESIGNATION</div>
              <h2>Designate "{selectedCandidate.place}" as SHEQ Hotspot</h2>
              <p>
                Based on {selectedCandidate.reportCount} community reports, {selectedCandidate.totalConfirmations} confirmations, and a provisional multi-factor score of <strong>{selectedCandidate.provisionalScore}/100</strong>.
              </p>
            </div>

            <div className="modal-body">
              <label>
                Designation Reason (shown to community)
                <input
                  type="text"
                  placeholder="e.g. Concentrated late-evening concerns & lighting infrastructure defects"
                  value={designationReason}
                  onChange={e => setDesignationReason(e.target.value)}
                />
              </label>

              <label style={{ marginTop: "14px" }}>
                Admin Notes (Internal tracking & liaison)
                <textarea
                  rows="3"
                  placeholder="Internal notes regarding ward notifications, municipal coordination..."
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                />
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-berry"
                onClick={() => handlePromote(selectedCandidate)}
              >
                Confirm Hotspot Designation →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
