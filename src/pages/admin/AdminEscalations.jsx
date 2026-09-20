import { useState } from "react";
import { Plus, ShieldAlert, CheckCircle2, Info } from "lucide-react";
import { useData } from "../../context/DataContext";

export default function AdminEscalations() {
  const { escalations, createEscalation } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    area: "",
    supportingReportsCount: 1,
    severity: "High",
    potentialAuthority: "Local Police Station / Women Safety Patrol",
    adminNotes: ""
  });
  const [successMsg, setSuccessMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.area.trim()) return;

    createEscalation(form);
    setForm({
      title: "",
      area: "",
      supportingReportsCount: 1,
      severity: "High",
      potentialAuthority: "Local Police Station / Women Safety Patrol",
      adminNotes: ""
    });
    setShowAddForm(false);
    setSuccessMsg("External escalation record successfully created.");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  return (
    <div className="admin-escalations-page">
      {/* Required Authority Disclaimer Banner */}
      <div className="escalation-disclaimer-card">
        <ShieldAlert size={22} className="text-berry" />
        <div>
          <strong>Important External Escalation Disclaimer</strong>
          <p>
            Creating an escalation record is an <strong>internal SHEQ tracking mechanism only</strong>. No real police
            API or external authority dispatch is implemented in this phase. This record prepares structured evidence for
            future verified authority integrations.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="alert-banner-success" style={{ margin: "16px 0" }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      <div className="detail-card" style={{ marginTop: "20px" }}>
        <div className="places-header">
          <div>
            <div className="eyebrow">EXTERNAL LIAISON RECORDS</div>
            <h3>Authority Escalation Dossiers</h3>
            <p className="card-sub-copy">
              Structured clusters of verified community reports flagged for municipal or law-enforcement liaison.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-berry btn-sm"
            onClick={() => setShowAddForm(v => !v)}
          >
            <Plus size={14} /> Log Escalation Record
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="admin-create-form" style={{ marginTop: "16px" }}>
            <h4>Create Escalation Dossier</h4>
            <div className="form-grid">
              <label>
                Escalation Summary / Title
                <input
                  type="text"
                  placeholder="e.g. Repeated Harassment Cluster at FC Road"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>

              <label>
                Area / Stretch
                <input
                  type="text"
                  placeholder="e.g. FC Road Lane 3"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  required
                />
              </label>

              <label>
                Supporting Community Reports
                <input
                  type="number"
                  min={1}
                  value={form.supportingReportsCount}
                  onChange={e => setForm({ ...form, supportingReportsCount: parseInt(e.target.value) || 1 })}
                />
              </label>

              <label>
                Target Authority
                <input
                  type="text"
                  placeholder="e.g. Shivaji Nagar Police Station"
                  value={form.potentialAuthority}
                  onChange={e => setForm({ ...form, potentialAuthority: e.target.value })}
                />
              </label>
            </div>

            <label style={{ marginTop: "12px" }}>
              Admin Dossier Notes
              <textarea
                rows="3"
                placeholder="Details of cluster patterns, recommended patrol hours, liaison notes..."
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
                Create Escalation Record
              </button>
            </div>
          </form>
        )}

        <div className="escalations-grid" style={{ marginTop: "20px" }}>
          {escalations.map(esc => (
            <div key={esc.id} className="escalation-card">
              <div className="escalation-head">
                <span className="badge badge-signal-elevated">{esc.severity} Priority</span>
                <small>{esc.createdDate}</small>
              </div>
              <h4>{esc.title}</h4>
              <p>
                <strong>Area:</strong> {esc.area}
                <br />
                <strong>Evidence:</strong> {esc.supportingReportsCount} supporting community reports
                <br />
                <strong>Target Agency:</strong> {esc.potentialAuthority}
              </p>
              {esc.adminNotes && (
                <div className="esc-notes-box">
                  <small><strong>Liaison Notes:</strong> {esc.adminNotes}</small>
                </div>
              )}
              <div className="esc-disclaimer-note">
                <Info size={13} /> {esc.disclaimer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
