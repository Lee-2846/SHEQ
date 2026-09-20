import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, ShieldCheck } from "lucide-react";
import { useData } from "../../context/DataContext";
import { getStatusBadgeClass } from "../../utils/badgeHelpers";

export default function AdminModeration() {
  const { reports, updateReportStatus } = useData();
  const [resolvedDisputes, setResolvedDisputes] = useState([]);
  const [actionSuccess, setActionSuccess] = useState("");

  const disputedReports = reports.filter(
    r => r.disputes > 0 || (r.disputeNotes && r.disputeNotes.length > 0)
  );

  function handleMarkReviewed(reportId) {
    setResolvedDisputes(prev => [...prev, reportId]);
    setActionSuccess(`Report #${reportId} disputes marked as reviewed by moderator.`);
    setTimeout(() => setActionSuccess(""), 3000);
  }

  function handleSetResolved(reportId) {
    updateReportStatus(reportId, "Resolved");
    setActionSuccess(`Report #${reportId} status updated to Resolved.`);
    setTimeout(() => setActionSuccess(""), 3000);
  }

  return (
    <div className="admin-moderation-page">
      <div className="detail-card">
        <div className="eyebrow">CONTENT ACCURACY & MODERATION</div>
        <h3>Dispute Log & Inaccuracy Review</h3>
        <p className="card-sub-copy">
          Review community dispute notes to maintain data reliability and prevent misinformation.
        </p>

        {actionSuccess && (
          <div className="alert-banner-success" style={{ margin: "16px 0" }}>
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}

        <div className="disputes-list" style={{ marginTop: "20px" }}>
          {disputedReports.length === 0 ? (
            <div className="empty-state-card">
              <ShieldCheck size={36} className="text-berry" style={{ margin: "0 auto 12px" }} />
              <p>No active disputes or inaccuracy flags in the queue.</p>
            </div>
          ) : (
            disputedReports.map(r => {
              const isReviewed = resolvedDisputes.includes(r.id);

              return (
                <div key={r.id} className="moderation-item-card">
                  <div className="mod-head">
                    <div>
                      <span className="badge badge-category">{r.category}</span>
                      <strong style={{ marginLeft: "8px", fontSize: "16px" }}>{r.place}</strong>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                      Status: {r.status}
                    </span>
                  </div>

                  <p className="mod-desc">
                    <strong>Report:</strong> "{r.description}"
                  </p>

                  <div className="mod-disputes-box">
                    <div className="eyebrow" style={{ color: "var(--danger)" }}>
                      LOGGED DISPUTE NOTES ({r.disputeNotes?.length || r.disputes})
                    </div>
                    {r.disputeNotes && r.disputeNotes.length > 0 ? (
                      r.disputeNotes.map(d => (
                        <div key={d.id} className="dispute-entry">
                          <strong>{d.reason}:</strong> <span>"{d.details}"</span>
                          <small style={{ display: "block", color: "var(--muted)", marginTop: "2px" }}>
                            Logged {d.time}
                          </small>
                        </div>
                      ))
                    ) : (
                      <p style={{ margin: 0, fontSize: "13px" }}>
                        Community flagged {r.disputes} inaccuracy instance(s).
                      </p>
                    )}
                  </div>

                  <div className="mod-actions">
                    <Link to={`/incident/${r.id}`} className="btn btn-outline btn-xs">
                      <Eye size={13} /> View Full Report
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => handleSetResolved(r.id)}
                    >
                      <CheckCircle2 size={13} /> Mark Report as Resolved
                    </button>
                    {!isReviewed ? (
                      <button
                        type="button"
                        className="btn btn-berry btn-xs"
                        onClick={() => handleMarkReviewed(r.id)}
                      >
                        <ShieldCheck size={13} /> Mark Dispute Reviewed
                      </button>
                    ) : (
                      <span className="badge badge-status-verified">Reviewed</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
