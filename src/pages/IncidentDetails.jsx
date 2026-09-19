import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Flag, Users } from "lucide-react";
import { getSignalBadgeClass, getStatusBadgeClass } from "../utils/badgeHelpers";

export default function IncidentDetails({ reports, setReports }) {
  const { id } = useParams();
  const report = reports.find(r => String(r.id) === String(id));
  const [confirmed, setConfirmed] = useState(false);

  if (!report) {
    return (
      <div className="container page-container">
        <h1>Report not found.</h1>
        <Link to="/map" className="btn btn-outline mt-3">Back to map</Link>
      </div>
    );
  }

  function confirm() {
    if (confirmed) return;
    setConfirmed(true);
    setReports(prev =>
      prev.map(r => r.id === report.id ? { ...r, confirmations: r.confirmations + 1 } : r)
    );
  }

  return (
    <div className="container page-container narrow">
      <Link to="/map" className="back-link">
        <ArrowLeft size={16} /> Back to Safety Map
      </Link>

      <div className="incident-head">
        <div className="incident-badges">
          <span className="badge badge-category">{report.category}</span>
          <span className={`badge ${getSignalBadgeClass(report.signal)}`}>{report.signal}</span>
          <span className={`badge ${getStatusBadgeClass(report.status)}`}>{report.status}</span>
        </div>
        <h1>{report.place}</h1>
        <p>{report.city} · {report.date} · {report.time}</p>
      </div>

      <div className="incident-grid">
        <main>
          <div className="detail-card">
            <div className="eyebrow">WHAT WAS REPORTED</div>
            <p className="detail-copy">{report.description}</p>
          </div>

          <div className="detail-card">
            <div className="eyebrow">COMMUNITY CHECK</div>
            <div className="verification-row">
              <div className="verification-big">
                {report.confirmations + (confirmed ? 1 : 0)}
              </div>
              <div>
                <strong>People confirmed this report</strong>
                <p>
                  Community confirmation adds context; it does not mean the report has been independently proven.
                </p>
              </div>
            </div>
            <div className="verification-actions">
              <button
                onClick={confirm}
                className="btn btn-berry"
                disabled={confirmed}
              >
                <CheckCircle2 size={17} /> {confirmed ? "Confirmed by you" : "I experienced / observed this too"}
              </button>
              <button className="btn btn-outline">
                <Flag size={16} /> Dispute / add context
              </button>
            </div>
          </div>
        </main>

        <aside>
          <div className="detail-card signal-card-small">
            <Users size={24} className="mb-2" />
            <div className="eyebrow">LIFECYCLE STATUS</div>
            <div style={{ margin: "8px 0 12px" }}>
              <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                {report.status}
              </span>
            </div>
            <p>
              This report is part of SHEQ&apos;s community review flow. As more nearby members confirm or add notes, the signal becomes more useful for everyone.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
