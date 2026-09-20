import { Link } from "react-router-dom";
import {
  FileText,
  Flame,
  AlertCircle,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck
} from "lucide-react";
import StatCard from "../../components/StatCard";
import { useData } from "../../context/DataContext";
import { getStatusBadgeClass } from "../../utils/badgeHelpers";

export default function AdminDashboard() {
  const { reports, hotspotCandidates, hotspots, issues, escalations, stats } = useData();

  const pendingReports = reports.filter(
    r => r.status === "Submitted" || r.status === "Under Review" || r.status === "Under review"
  );
  const disputedReports = reports.filter(
    r => r.disputes > 0 || (r.disputeNotes && r.disputeNotes.length > 0)
  );

  return (
    <div className="admin-overview">
      {/* High-Level Overview Stat Cards */}
      <div className="stat-grid">
        <StatCard
          icon={FileText}
          value={stats.totalReports}
          label="Total Community Reports"
          note={`${pendingReports.length} awaiting review`}
        />
        <StatCard
          icon={Flame}
          value={hotspotCandidates.length}
          label="Hotspot Candidates"
          note={`${stats.activeHotspotsCount} active designated`}
        />
        <StatCard
          icon={AlertCircle}
          value={issues.length}
          label="Open Internal Issues"
          note={`${stats.resolvedIssuesCount} resolved`}
        />
        <StatCard
          icon={Share2}
          value={escalations.length}
          label="Escalation Records"
          note="external authority tracking"
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
                Provisional candidate algorithm flagged concentrated community reports. Review supporting evidence
                to officially designate as SHEQ Hotspot.
              </p>
            </div>
          </div>
          <Link to="/admin/hotspots" className="btn btn-berry btn-sm">
            Review Candidates →
          </Link>
        </div>
      )}

      {/* Disputed Reports Alert Box */}
      {disputedReports.length > 0 && (
        <div className="dispute-alert-card" style={{ marginTop: "14px" }}>
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

        {/* FIX 16: Replaced duplicate "ADMINISTRATIVE ACTIONS" panel with live Operational Health & Summary */}
        <div className="side-card">
          <div className="eyebrow">OPERATIONAL SUMMARY</div>
          <h3 style={{ margin: "4px 0 16px", fontSize: "18px" }}>Network Health</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(108, 47, 65, 0.08)", display: "grid", placeItems: "center", color: "var(--berry)" }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Moderation System Active</strong>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>{pendingReports.length} pending moderation queue</small>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(224, 138, 77, 0.12)", display: "grid", placeItems: "center", color: "#a35817" }}>
                <Flame size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Hotspot Scoring Active</strong>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>{hotspots.filter(h => h.active).length} designated hotspots verified</small>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(43, 122, 75, 0.1)", display: "grid", placeItems: "center", color: "#2b7a4b" }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Issue Resolution Rate</strong>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>{stats.resolvedIssuesCount} of {issues.length} defect issues resolved</small>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(108, 47, 65, 0.08)", display: "grid", placeItems: "center", color: "var(--berry)" }}>
                <Clock size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Dispute Queue</strong>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>{disputedReports.length} reports awaiting dispute check</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
