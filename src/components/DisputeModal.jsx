import { useState } from "react";
import { Flag, X, CheckCircle2 } from "lucide-react";
import { validateDispute } from "../utils/validation";

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
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close dispute modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="eyebrow">COMMUNITY ACCURACY</div>
          <h2>Dispute or Flag Inaccuracy</h2>
          <p>
            Help keep community data reliable. If any detail in this report is inaccurate or outdated, submit a context note for review.
          </p>
        </div>

        {submitted ? (
          <div className="dispute-success">
            <CheckCircle2 size={32} className="text-berry" />
            <h3>Dispute recorded</h3>
            <p>Thank you. Your note has been logged for community review and moderation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="dispute-form">
            <label htmlFor="dispute-reason">
              Reason for dispute
              <select
                id="dispute-reason"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
              >
                <option value="Inaccurate timing">Inaccurate timing / time window</option>
                <option value="Incorrect location">Incorrect location or place name</option>
                <option value="Issue already resolved">Issue has already been resolved</option>
                <option value="Misleading description">Misleading or exaggerated description</option>
                <option value="Duplicate report">Duplicate report</option>
                <option value="Other">Other factual discrepancy</option>
              </select>
              {errors.reason && <small className="field-error">{errors.reason}</small>}
            </label>

            <label htmlFor="dispute-details">
              Explanation & details
              <textarea
                id="dispute-details"
                rows="4"
                value={form.details}
                onChange={e => setForm({ ...form, details: e.target.value })}
                placeholder="Explain what information is inaccurate and provide correct context..."
              />
              {errors.details && <small className="field-error">{errors.details}</small>}
            </label>

            <div className="modal-actions">
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
