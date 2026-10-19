import { useState, useEffect } from "react";
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  AlertCircle,
  Download,
  Info,
  Clock,
  History
} from "lucide-react";
import {
  getPendingIdentityReviews,
  reviewIdentitySubmission,
  fetchDocumentBlob,
  getIdentityAuditLogs
} from "../../services/identityService";

export default function AdminIdentity() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [activeReview, setActiveReview] = useState(null);
  const [decision, setDecision] = useState("verified");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingIdentityReviews();
      setSubmissions(data);
    } catch (err) {
      setError(err.message || "Failed to load document submissions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDocument(userId, fileName) {
    try {
      const blob = await fetchDocumentBlob(userId);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        // Fallback to direct download
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "submitted_document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      alert(`Could not open document: ${err.message}`);
    }
  }

  async function handleDecisionSubmit(e) {
    e.preventDefault();
    if (!activeReview) return;

    if ((decision === "rejected" || decision === "resubmission_required") && !rejectionReason.trim()) {
      alert("Please enter a rejection or resubmission reason for the member.");
      return;
    }

    setSubmittingDecision(true);
    try {
      await reviewIdentitySubmission(activeReview.id, {
        decision,
        notes: reviewNotes.trim(),
        rejectionReason: rejectionReason.trim()
      });

      setActionSuccess(`Submission for ${activeReview.name} updated to ${decision.toUpperCase()}.`);
      setActiveReview(null);
      setReviewNotes("");
      setRejectionReason("");
      await loadSubmissions();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to submit review decision.");
    } finally {
      setSubmittingDecision(false);
    }
  }

  async function handleToggleAuditLogs() {
    if (showAuditLogs) {
      setShowAuditLogs(false);
      return;
    }

    setShowAuditLogs(true);
    setLoadingAudit(true);
    try {
      const logs = await getIdentityAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.warn("Could not load audit logs:", err.message);
    } finally {
      setLoadingAudit(false);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "verified":
        return <span className="badge badge-status-verified">Verified</span>;
      case "pending_review":
      case "pending":
        return <span className="badge badge-status-review">Pending Review</span>;
      case "rejected":
        return <span className="badge badge-danger">Rejected</span>;
      case "resubmission_required":
        return <span className="badge badge-signal-attention">Resubmission Required</span>;
      default:
        return <span className="badge badge-status-submitted">{status || "Unverified"}</span>;
    }
  }

  return (
    <div className="admin-identity-page">
      {/* Notice & Policy Header */}
      <div className="provisional-scoring-banner" style={{ marginBottom: "16px" }}>
        <ShieldCheck size={22} className="text-berry" />
        <div>
          <strong>Private Document Vault & Eligibility Review</strong>
          <p>
            Review user-submitted eligibility documents (e.g., Masked Aadhaar) held in the private server vault.
            Documents are encrypted at rest outside public web directories. No biometric extraction or automated UIDAI API access is performed.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-banner-success" style={{ margin: "16px 0" }}>
          <CheckCircle2 size={16} /> {actionSuccess}
        </div>
      )}

      {error && (
        <div className="form-error" style={{ margin: "16px 0" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Review Queue Card */}
      <div className="detail-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div className="eyebrow">IDENTITY VERIFICATION QUEUE</div>
            <h3>Submitted Documents for Administrative Decision</h3>
            <p className="card-sub-copy">
              Verify that the document contains the member's name and has the first 8 digits masked.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleToggleAuditLogs}
            >
              <History size={14} /> {showAuditLogs ? "Hide Audit Logs" : "View Access Audit"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadSubmissions}
            >
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Audit Log Panel */}
        {showAuditLogs && (
          <div style={{ margin: "16px 0", padding: "16px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <div className="eyebrow">COMPLIANCE & ACCESS AUDIT TRAIL</div>
            <h4 style={{ margin: "4px 0 10px" }}>Recent Document Actions</h4>
            {loadingAudit ? (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>Loading audit records...</p>
            ) : auditLogs.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>No audit records logged yet.</p>
            ) : (
              <div style={{ maxHeight: "200px", overflowY: "auto", fontSize: "12px" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Subject</th>
                      <th>Operator</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(l => (
                      <tr key={l._id}>
                        <td>{new Date(l.createdAt).toLocaleString()}</td>
                        <td><code>{l.action}</code></td>
                        <td>{l.userId?.name || l.userId?.email || "User"}</td>
                        <td>{l.performedBy?.name || "System"} ({l.performedByRole})</td>
                        <td>{l.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Submissions Table */}
        <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Contact</th>
                <th>Submitted Document</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>
                    No pending document verification requests in the queue.
                  </td>
                </tr>
              ) : (
                submissions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <small style={{ display: "block", color: "var(--muted)" }}>Role: {s.role}</small>
                    </td>
                    <td>
                      <div>{s.email || "No email"}</div>
                      <small style={{ color: "var(--muted)" }}>{s.phone || "No phone"}</small>
                    </td>
                    <td>
                      {s.document ? (
                        <div>
                          <FileText size={13} style={{ display: "inline", marginRight: "4px" }} />
                          <strong>{s.document.originalName}</strong>
                          <small style={{ display: "block", color: "var(--muted)" }}>
                            {Math.round((s.document.fileSize || 0) / 1024)} KB · {s.document.mimeType}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted-sm">No file metadata</span>
                      )}
                    </td>
                    <td>
                      {s.document?.submittedAt ? (
                        <>
                          <div>{new Date(s.document.submittedAt).toLocaleDateString()}</div>
                          <small style={{ color: "var(--muted)" }}>
                            {new Date(s.document.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </small>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{getStatusBadge(s.verificationStatus)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => handleViewDocument(s.id, s.document?.originalName)}
                          title="Open private document stream"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-berry btn-xs"
                          onClick={() => {
                            setActiveReview(s);
                            setDecision(s.verificationStatus === "verified" ? "verified" : "verified");
                            setReviewNotes(s.document?.reviewNotes || "");
                            setRejectionReason(s.document?.rejectionReason || "");
                          }}
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {activeReview && (
        <div className="modal-backdrop" onClick={() => setActiveReview(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <div className="eyebrow">ADMINISTRATIVE ELIGIBILITY DECISION</div>
            <h3>Reviewing Document: {activeReview.name}</h3>
            <p className="card-sub-copy">
              Document: <code>{activeReview.document?.originalName}</code>
            </p>

            <div style={{ margin: "12px 0 16px" }}>
              <button
                type="button"
                className="btn btn-outline btn-sm w-100"
                onClick={() => handleViewDocument(activeReview.id, activeReview.document?.originalName)}
              >
                <Eye size={14} /> Open Document in Secure Viewer
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit}>
              <div className="form-field-label">
                <label>Review Decision</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "6px" }}>
                  <button
                    type="button"
                    className={`method-pill ${decision === "verified" ? "selected" : ""}`}
                    onClick={() => setDecision("verified")}
                    style={{ justifyContent: "center" }}
                  >
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button
                    type="button"
                    className={`method-pill ${decision === "resubmission_required" ? "selected" : ""}`}
                    onClick={() => setDecision("resubmission_required")}
                    style={{ justifyContent: "center" }}
                  >
                    <RotateCcw size={13} /> Resubmit
                  </button>
                  <button
                    type="button"
                    className={`method-pill ${decision === "rejected" ? "selected" : ""}`}
                    onClick={() => setDecision("rejected")}
                    style={{ justifyContent: "center" }}
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>

              {(decision === "rejected" || decision === "resubmission_required") && (
                <div className="form-field-label" style={{ marginTop: "12px" }}>
                  <label htmlFor="rejection-reason">Reason for {decision === "rejected" ? "Rejection" : "Resubmission"} *</label>
                  <input
                    id="rejection-reason"
                    type="text"
                    className="form-input"
                    placeholder="e.g. First 8 digits were not masked / Document image was illegible"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    required
                  />
                  <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                    This reason will be visible to the user on their profile verification tab.
                  </small>
                </div>
              )}

              <div className="form-field-label" style={{ marginTop: "12px" }}>
                <label htmlFor="internal-notes">Internal Administrator Notes (Optional)</label>
                <textarea
                  id="internal-notes"
                  className="form-input"
                  rows={3}
                  placeholder="Internal audit notes regarding name matching, document readability, etc."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="submit"
                  className="btn btn-berry btn-sm"
                  style={{ flex: 1 }}
                  disabled={submittingDecision}
                >
                  {submittingDecision ? "Saving Decision..." : "Apply Decision"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveReview(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
