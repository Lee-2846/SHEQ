import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { validateDispute } from "../utils/validation";

/**
 * FIX 17: Redesigned Dispute / Flag Inaccuracy Modal
 * Matches 2-column header (Title | Explainer), styled select, wide textarea, bottom-right actions.
 */
export default function DisputeModal({ isOpen, onClose, reportId, onDisputeSubmitted }) {
  const [form, setForm] = useState({
    reason: "Inaccurate timing",
    details: ""
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateDispute(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onDisputeSubmitted(reportId, form);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ reason: "Inaccurate timing", details: "" });
      onClose();
    }, 1200);
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dispute-modal-card" onClick={e => e.stopPropagation()}>
        <button className="dispute-modal-close" onClick={onClose} aria-label="Close dispute modal">
          <X size={18} />
        </button>

        {/* 2-Column Header: Heading left | Explanatory text right */}
        <div className="dispute-modal-header">
          <div>
            <div className="dispute-eyebrow">COMMUNITY ACCURACY</div>
            <h2 className="dispute-modal-title">Dispute or Flag Inaccuracy</h2>
          </div>
          <p className="dispute-modal-explainer">
            Help keep community data reliable. If any detail in this report is inaccurate or outdated, submit a context note for administrative review.
          </p>
        </div>

        {submitted ? (
          <div className="dispute-success-box">
            <CheckCircle2 size={36} className="text-berry" style={{ margin: "0 auto 10px" }} />
            <h3>Dispute Note Logged</h3>
            <p>Thank you for helping keep community data accurate. A moderator will review your note.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="dispute-form-layout" noValidate>
            <div className="dispute-form-group">
              <label className="dispute-form-label" htmlFor="dispute-reason">
                Reason for Dispute
              </label>
              <select
                id="dispute-reason"
                value={form.reason}
                onChange={e => {
                  setForm({ ...form, reason: e.target.value });
                  if (errors.reason) setErrors({ ...errors, reason: "" });
                }}
                className="dispute-select-input"
              >
                <option value="Inaccurate timing">Inaccurate timing / time window</option>
                <option value="Incorrect location">Incorrect location or place name</option>
                <option value="Issue already resolved">Issue has already been resolved</option>
                <option value="Misleading description">Misleading or exaggerated description</option>
                <option value="Duplicate report">Duplicate report</option>
                <option value="Other">Other factual discrepancy</option>
              </select>
              {errors.reason && <small className="field-error-text">{errors.reason}</small>}
            </div>

            <div className="dispute-form-group">
              <label className="dispute-form-label" htmlFor="dispute-details">
                Explanation & Details
              </label>
              <textarea
                id="dispute-details"
                rows={4}
                value={form.details}
                onChange={e => {
                  setForm({ ...form, details: e.target.value });
                  if (errors.details) setErrors({ ...errors, details: "" });
                }}
                placeholder="Explain what information is inaccurate and provide correct context for the community..."
                className="dispute-textarea-input"
              />
              {errors.details && <small className="field-error-text">{errors.details}</small>}
            </div>

            <div className="dispute-modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-berry">
                Submit Dispute Note
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
