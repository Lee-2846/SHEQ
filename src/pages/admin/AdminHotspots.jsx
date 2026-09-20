import { useState } from "react";
import { Flame, CheckCircle2, Info } from "lucide-react";
import { useData } from "../../context/DataContext";

export default function AdminHotspots() {
  const { hotspotCandidates, hotspots, promoteHotspotCandidate, toggleHotspotActive } = useData();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [designationReason, setDesignationReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
          <strong>Provisional Prototype Hotspot Scoring</strong>
          <p>
            The scoring below surfaces Hotspot Candidates based on report count, recency, and community confirmations.
            Scores are provisional prototype signals for administrative review, not scientifically validated risk probabilities.
          </p>
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
        <h3>Provisional Candidates Flagged for Review</h3>
        <p className="card-sub-copy">
          Review community evidence. Once verified by an authorized administrator, candidates can be designated as official SHEQ Hotspots.
        </p>

        <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Location / Area</th>
                <th>Reports Count</th>
                <th>Community Confirmations</th>
                <th>Recent Reports</th>
                <th>Provisional Score</th>
                <th>Candidate Status</th>
                <th>Admin Review</th>
              </tr>
            </thead>
            <tbody>
              {hotspotCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>
                    No areas currently meet the candidate threshold.
                  </td>
                </tr>
              ) : (
                hotspotCandidates.map(c => {
                  const alreadyHotspot = hotspots.some(h => h.place === c.place && h.active);

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.place}</strong>
                        <small style={{ display: "block", color: "var(--muted)" }}>{c.city}</small>
                      </td>
                      <td>
                        <span className="badge badge-status-submitted">{c.reportCount} reports</span>
                      </td>
                      <td>
                        <span className="badge badge-status-verified">{c.totalConfirmations} confirmations</span>
                      </td>
                      <td>{c.recentCount > 0 ? `${c.recentCount} recent` : "Standard"}</td>
                      <td>
                        <div className="score-cell">
                          <strong>{c.provisionalScore}</strong> / 100
                        </div>
                      </td>
                      <td>
                        {alreadyHotspot ? (
                          <span className="badge badge-signal-attention">Already Designated</span>
                        ) : (
                          <span className="badge badge-status-review">Candidate for Review</span>
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
          Hotspots are visible on the Safety Map and highlighted in personalized safety insights for users with saved places.
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
                Based on {selectedCandidate.reportCount} community reports and {selectedCandidate.totalConfirmations} confirmations.
              </p>
            </div>

            <div className="modal-body">
              <label>
                Designation Reason (shown to community)
                <input
                  type="text"
                  placeholder="e.g. Concentrated lighting & late evening concerns"
                  value={designationReason}
                  onChange={e => setDesignationReason(e.target.value)}
                />
              </label>

              <label style={{ marginTop: "14px" }}>
                Admin Notes (Internal tracking)
                <textarea
                  rows="3"
                  placeholder="Internal notes regarding municipal liaison, ward notification..."
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
