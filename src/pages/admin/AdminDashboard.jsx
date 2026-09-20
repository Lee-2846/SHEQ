import { Link } from "react-router-dom";
import {
  FileText,
  Flame,
  AlertCircle,
  Share2,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import StatCard from "../../components/StatCard";
import { useData } from "../../context/DataContext";
import { getStatusBadgeClass } from "../../utils/badgeHelpers";

export default function AdminDashboard() {
  const { reports, hotspotCandidates, issues, escalations, stats } = useData();

  const pendingReports = reports.filter(r => r.status === "Submitted" || r.status === "Under Review" || r.status === "Under review");
  const disputedReports = reports.filter(r => r.disputes > 0 || (r.disputeNotes && r.disputeNotes.length > 0));

  return (
    <div className="admin-overview">
      {/* Overview Stat Cards */}
      <div className="stat-grid">
        <StatCard
          icon={FileText}
          value={stats.totalReports}
          label="Total Community Reports"
          note={`${pendingReports.length} pending review`}
        />
        <StatCard
          icon={Flame}
          value={hotspotCandidates.length}
          label="Hotspot Candidates"
          note="provisional scoring flag"
        />
        <StatCard
          icon={AlertCircle}
          value={issues.length}
          label="Internal Issues"
          note={`${stats.resolvedIssuesCount} resolved`}
        />
        <StatCard
          icon={Share2}
          value={escalations.length}
          label="Escalation Records"
          note="internal liaison tracking"
        />
      </div>

      {/* Hotspot Candidates Alert Box */}
      {hotspotCandidates.length > 0 && (
        <div className="candidate-alert-card">
          <div className="candidate-alert-header">
            <Flame size={20} className="text-warning" />
            <div>
              <strong>{hotspotCandidates.length} Hotspot Candidate(s) Awaiting Admin Review</strong>
              <p>
                Provisional candidate algorithm flagged concentrated community reports. Review supporting reports
                to officially designate as SHEQ Hotspot.
              </p>
            </div>
          </div>
          <Link to="/admin/hotspots" className="btn btn-berry btn-sm">
            Review Candidates →
          </Link>
        </div>
      )}

      {/* Disputed Reports Alert Box if any */}
      {disputedReports.length > 0 && (
        <div className="dispute-alert-card">
          <div className="candidate-alert-header">
            <AlertTriangle size={20} className="text-danger" />
            <div>
              <strong>{disputedReports.length} Report(s) with Community Inaccuracy Flags</strong>
              <p>Community members flagged factual inaccuracies. Review context notes in Moderation.</p>
            </div>
          </div>
          <Link to="/admin/moderation" className="btn btn-outline btn-sm">
            Inspect Dispute Log →
          </Link>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginTop: "24px" }}>
        {/* Pending Reports Moderation Queue */}
        <div className="detail-card">
          <div className="section-row">
            <div>
              <div className="eyebrow">MODERATION QUEUE</div>
              <h3>Recent Submissions</h3>
            </div>
            <Link to="/admin/reports" className="text-link">
              View all reports →
            </Link>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Place</th>
                  <th>Category</th>
                  <th>Date / Time</th>
                  <th>Status</th>
                  <th>Confirmations</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.place}</strong>
                    </td>
                    <td>
                      <span className="badge badge-category">{r.category}</span>
                    </td>
                    <td>
                      <small>{r.date}, {r.time}</small>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.confirmations || 0}</td>
                    <td>
                      <Link to="/admin/reports" className="text-link-sm">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="side-card">
          <div className="eyebrow">ADMINISTRATIVE ACTIONS</div>
          <Link to="/admin/reports">
            Moderate Reports <ArrowRight />
          </Link>
          <Link to="/admin/hotspots">
            Hotspot Analysis <ArrowRight />
          </Link>
          <Link to="/admin/issues">
            Create SHEQ Issue Record <ArrowRight />
          </Link>
          <Link to="/admin/escalations">
            Log External Escalation <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
