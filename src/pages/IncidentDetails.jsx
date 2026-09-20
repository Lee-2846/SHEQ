import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Flag,
  Users,
  Send
} from "lucide-react";
import { getSignalBadgeClass, getStatusBadgeClass } from "../utils/badgeHelpers";
import StatusStepper from "../components/StatusStepper";
import DisputeModal from "../components/DisputeModal";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function IncidentDetails() {
  const { id } = useParams();
  const { reports, confirmReport, addReportComment, disputeReport } = useData();
  const { user } = useAuth();

  const report = reports.find(r => String(r.id) === String(id));

  const [confirmed, setConfirmed] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  if (!report) {
    return (
      <div className="container page-container">
        <h1>Report not found.</h1>
        <p>This report may have been removed or does not exist.</p>
        <Link to="/map" className="btn btn-outline mt-3">
          Back to Safety Map
        </Link>
      </div>
    );
  }

  function handleConfirm() {
    if (confirmed) return;
    setConfirmed(true);
    confirmReport(report.id);
  }

  function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addReportComment(report.id, commentText, user?.name || "SHEQ Member");
    setCommentText("");
  }

  function handleDisputeSubmit(reportId, disputeData) {
    disputeReport(reportId, disputeData);
  }

  return (
    <div className="container page-container narrow">
      <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        reportId={report.id}
        onDisputeSubmitted={handleDisputeSubmit}
      />

      <Link to="/map" className="back-link">
        <ArrowLeft size={16} /> Back to Safety Map
      </Link>

      <div className="incident-head">
        <div className="incident-badges">
          <span className="badge badge-category">{report.category}</span>
          {report.signal && (
            <span className={`badge ${getSignalBadgeClass(report.signal)}`}>{report.signal}</span>
          )}
          {report.status && (
            <span className={`badge ${getStatusBadgeClass(report.status)}`}>{report.status}</span>
          )}
        </div>
        <h1>{report.place}</h1>
        <p>
          {report.city} · {report.date} · {report.time} ·{" "}
          <span>{report.anonymous ? "Anonymous Report" : `Reported by ${report.authorName || "Member"}`}</span>
        </p>
      </div>

      {/* 4-Step Lifecycle Status Stepper */}
      <div className="detail-card stepper-card">
        <div className="eyebrow">REPORT LIFECYCLE (4-STEP STATUS)</div>
        <StatusStepper currentStatus={report.status} />
      </div>

      <div className="incident-grid">
        <main>
          {/* What was reported */}
          <div className="detail-card">
            <div className="eyebrow">WHAT WAS REPORTED</div>
            <p className="detail-copy">{report.description}</p>

            {/* Photo preview if present */}
            {report.photoPreview && (
              <div className="incident-photo-wrapper">
                <img src={report.photoPreview} alt="Attached incident evidence" className="incident-photo-img" />
                <small>User-submitted evidence thumbnail</small>
              </div>
            )}
          </div>

          {/* Distinct Community Confirmation Action */}
          <div className="detail-card">
            <div className="eyebrow">COMMUNITY CHECK</div>
            <div className="verification-row">
              <div className="verification-big">{report.confirmations || 0}</div>
              <div>
                <strong>People confirmed this report</strong>
                <p>
                  Community confirmations help surface active patterns. Confirming means you have directly observed
                  or experienced this concern.
                </p>
              </div>
            </div>
            <div className="verification-actions">
              <button
                type="button"
                onClick={handleConfirm}
                className="btn btn-berry"
                disabled={confirmed}
              >
                <CheckCircle2 size={17} />
                {confirmed ? "Confirmed by you" : "I experienced / observed this too"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDisputeModalOpen(true)}
              >
                <Flag size={16} /> Dispute / flag inaccuracy
              </button>
            </div>
          </div>

          {/* Community Context & Comments Stream */}
          <div className="detail-card">
            <div className="eyebrow">COMMUNITY CONTEXT & UPDATES</div>
            <h3>Notes shared by members</h3>
            <p className="context-desc">
              Add helpful details like lighting changes, timing notes, or whether conditions have improved.
            </p>

            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                placeholder="Add context or notes about this location..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-berry btn-sm" disabled={!commentText.trim()}>
                <Send size={14} /> Add Context
              </button>
            </form>

            <div className="comments-list">
              {(!report.comments || report.comments.length === 0) ? (
                <div className="empty-comments-note">
                  No additional context notes yet. Be the first to share an update.
                </div>
              ) : (
                report.comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-top">
                      <strong>{c.author}</strong>
                      <small>{c.time}</small>
                    </div>
                    <p>{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Display Dispute Notes if any */}
            {report.disputeNotes && report.disputeNotes.length > 0 && (
              <div className="dispute-notes-section">
                <div className="eyebrow">COMMUNITY DISPUTE LOG</div>
                {report.disputeNotes.map(d => (
                  <div key={d.id} className="dispute-log-card">
                    <div className="dispute-top">
                      <span className="badge badge-signal-attention">Dispute: {d.reason}</span>
                      <small>{d.time}</small>
                    </div>
                    <p>{d.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside>
          <div className="detail-card signal-card-small">
            <Users size={24} className="mb-2 text-berry" />
            <div className="eyebrow">HOW SHEQ REVIEWS SIGNALS</div>
            <div style={{ margin: "8px 0 12px" }}>
              <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                {report.status}
              </span>
            </div>
            <p>
              As nearby members add confirmations or notes, SHEQ administrators evaluate patterns to designate
              official hotspots or create municipal resolution records.
            </p>
          </div>

          <div className="detail-card">
            <div className="eyebrow">GEOGRAPHIC CONTEXT</div>
            <p>
              <strong>{report.place}</strong>
              <br />
              <small>{report.city || "Pune"}</small>
            </p>
            <Link to="/map" className="text-link">
              View on Safety Map →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
