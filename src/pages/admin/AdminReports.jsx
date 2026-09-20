import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import { useData } from "../../context/DataContext";
import { categories } from "../../data/mockData";

export default function AdminReports() {
  const { reports, updateReportStatus } = useData();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectReport, setInspectReport] = useState(null);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchCat = selectedCategory === "All" || r.category === selectedCategory;
      const matchStatus = selectedStatus === "All" || r.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        r.place.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchCat && matchStatus && matchSearch;
    });
  }, [reports, selectedCategory, selectedStatus, searchQuery]);

  function handleStatusChange(reportId, newStatus) {
    updateReportStatus(reportId, newStatus);
  }

  return (
    <div className="admin-reports-page">
      <div className="detail-card">
        <div className="eyebrow">COMMUNITY REPORTS MODERATION</div>
        <h3>Review, Verify & Update Report Lifecycles</h3>
        <p className="card-sub-copy">
          Update the lifecycle status of community reports (`Submitted` → `Under Review` → `Verified` → `Resolved`).
        </p>

        {/* Filters and Search */}
        <div className="admin-filters-bar">
          <div className="search-box admin-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by area, category, or keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-select-group">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="admin-select"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="admin-select"
            >
              <option value="All">Status: All</option>
              <option value="Submitted">Status: Submitted</option>
              <option value="Under Review">Status: Under Review</option>
              <option value="Verified">Status: Verified</option>
              <option value="Resolved">Status: Resolved</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Location / Area</th>
                <th>Category</th>
                <th>Submitted By</th>
                <th>Date & Time</th>
                <th>Confirmations</th>
                <th>Disputes</th>
                <th>Lifecycle Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    No reports found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.place}</strong>
                      <small style={{ display: "block", color: "var(--muted)" }}>{r.city || "Pune"}</small>
                    </td>
                    <td>
                      <span className="badge badge-category">{r.category}</span>
                    </td>
                    <td>
                      <small>{r.anonymous ? "Anonymous" : r.authorName || "Member"}</small>
                    </td>
                    <td>
                      <small>{r.date} · {r.time}</small>
                    </td>
                    <td>
                      <span className="badge badge-status-verified">{r.confirmations || 0}</span>
                    </td>
                    <td>
                      {r.disputes > 0 ? (
                        <span className="badge badge-signal-attention">{r.disputes} Disputed</span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "12px" }}>0</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={r.status || "Submitted"}
                        onChange={e => handleStatusChange(r.id, e.target.value)}
                        className="status-dropdown"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Verified">Verified</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td>
                      <div className="admin-action-btn-group">
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => setInspectReport(r)}
                          title="Inspect report details"
                        >
                          <Eye size={13} /> Inspect
                        </button>
                        <Link to={`/incident/${r.id}`} className="btn btn-outline btn-xs">
                          Public View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal if a report is selected */}
      {inspectReport && (
        <div className="modal-backdrop" onClick={() => setInspectReport(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="eyebrow">REPORT INSPECTOR</div>
              <h2>{inspectReport.place}</h2>
              <p>
                {inspectReport.category} · {inspectReport.date}, {inspectReport.time} ·{" "}
                {inspectReport.anonymous ? "Anonymous Submitter" : inspectReport.authorName}
              </p>
            </div>

            <div className="modal-body">
              <div className="detail-card" style={{ background: "var(--ivory)" }}>
                <strong>Report Description:</strong>
                <p style={{ marginTop: "6px" }}>{inspectReport.description}</p>
              </div>

              {inspectReport.photoPreview && (
                <div style={{ margin: "16px 0" }}>
                  <strong>Submitted Evidence:</strong>
                  <img
                    src={inspectReport.photoPreview}
                    alt="Evidence"
                    style={{ display: "block", maxWidth: "200px", borderRadius: "10px", marginTop: "6px" }}
                  />
                </div>
              )}

              <div style={{ marginTop: "16px" }}>
                <strong>Community Confirmations:</strong> {inspectReport.confirmations || 0}
              </div>

              {inspectReport.disputeNotes && inspectReport.disputeNotes.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <strong style={{ color: "var(--danger)" }}>Dispute Notes ({inspectReport.disputeNotes.length}):</strong>
                  {inspectReport.disputeNotes.map(d => (
                    <div key={d.id} className="dispute-log-card" style={{ marginTop: "6px" }}>
                      <span><strong>{d.reason}:</strong> {d.details}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn-berry"
                onClick={() => setInspectReport(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
