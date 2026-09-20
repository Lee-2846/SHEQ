import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { useData } from "../../context/DataContext";
import { categories } from "../../data/mockData";
import { getStatusBadgeClass } from "../../utils/badgeHelpers";

export default function AdminIssues() {
  const { issues, createIssue, updateIssueStatus } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    area: "",
    category: "Poor Lighting",
    severity: "Medium",
    adminNotes: ""
  });
  const [successMsg, setSuccessMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.area.trim()) return;

    createIssue(form);
    setForm({
      title: "",
      area: "",
      category: "Poor Lighting",
      severity: "Medium",
      adminNotes: ""
    });
    setShowAddForm(false);
    setSuccessMsg("Internal SHEQ Issue record created.");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  return (
    <div className="admin-issues-page">
      <div className="detail-card">
        <div className="places-header">
          <div>
            <div className="eyebrow">INTERNAL TRACKING</div>
            <h3>SHEQ Issues & Complaints Management</h3>
            <p className="card-sub-copy">
              Track infrastructure, transport, and safety defect records generated from community reports.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-berry btn-sm"
            onClick={() => setShowAddForm(v => !v)}
          >
            <Plus size={14} /> Log New SHEQ Issue
          </button>
        </div>

        {successMsg && (
          <div className="alert-banner-success" style={{ margin: "16px 0" }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} className="admin-create-form">
            <h4>Create Internal Issue Record</h4>
            <div className="form-grid">
              <label>
                Issue Title / Summary
                <input
                  type="text"
                  placeholder="e.g. Bus stop streetlight circuit defect"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>

              <label>
                Area / Location
                <input
                  type="text"
                  placeholder="e.g. Swargate Interchange"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {categories.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Severity Level
                <select
                  value={form.severity}
                  onChange={e => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>
            </div>

            <label style={{ marginTop: "12px" }}>
              Admin Notes & Municipal Liaison Reference
              <textarea
                rows="3"
                placeholder="Internal notes, ward officer reference, work order details..."
                value={form.adminNotes}
                onChange={e => setForm({ ...form, adminNotes: e.target.value })}
              />
            </label>

            <div className="form-actions" style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-berry btn-sm">
                Save Issue Record
              </button>
            </div>
          </form>
        )}

        <div className="admin-table-wrapper" style={{ marginTop: "20px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Title / Problem</th>
                <th>Area</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>
                    No issue records logged yet.
                  </td>
                </tr>
              ) : (
                issues.map(i => (
                  <tr key={i.id}>
                    <td>
                      <code>{i.id}</code>
                    </td>
                    <td>
                      <strong>{i.title}</strong>
                      {i.adminNotes && (
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          {i.adminNotes}
                        </small>
                      )}
                    </td>
                    <td>{i.area}</td>
                    <td>
                      <span className="badge badge-category">{i.category}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          i.severity === "High" || i.severity === "Critical"
                            ? "badge-signal-elevated"
                            : i.severity === "Medium"
                            ? "badge-signal-attention"
                            : "badge-signal-context"
                        }`}
                      >
                        {i.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(i.status)}`}>
                        {i.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={i.status}
                        onChange={e => updateIssueStatus(i.id, e.target.value)}
                        className="status-dropdown"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
