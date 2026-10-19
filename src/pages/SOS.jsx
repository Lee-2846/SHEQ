import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  ShieldAlert,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  Info,
  Radio
} from "lucide-react";
import { useData } from "../context/DataContext";
import { cleanPhoneInput, validatePhone } from "../utils/validation";
import SOSModal from "../components/SOSModal";
import { getSosStatus } from "../services/sosService";

export default function SOS() {
  const { contacts, updateContacts } = useData();
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosStatus, setSosStatus] = useState(null);

  useEffect(() => {
    getSosStatus().then(setSosStatus).catch(() => setSosStatus({ smsConfigured: false }));
  }, []);

  // Trusted contact addition
  const [newTrustedName, setNewTrustedName] = useState("");
  const [newTrustedPhone, setNewTrustedPhone] = useState("");
  const [newTrustedRole, setNewTrustedRole] = useState("Friend");
  const [showAddTrusted, setShowAddTrusted] = useState(false);

  // Primary contact editing
  const [showEditPrimary, setShowEditPrimary] = useState(false);
  const [primaryName, setPrimaryName] = useState(contacts?.primary?.name || "Aarti Sharma");
  const [primaryPhone, setPrimaryPhone] = useState(contacts?.primary?.phone || "+91 98765 43210");
  const [primaryRel, setPrimaryRel] = useState(contacts?.primary?.relationship || "Family");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  function handleSavePrimary(e) {
    e.preventDefault();
    if (!primaryName.trim() || !primaryPhone.trim()) return;

    const cleaned = cleanPhoneInput(primaryPhone);
    if (cleaned.length < 10) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setPhoneError("");

    updateContacts({
      primary: {
        name: primaryName.trim(),
        phone: primaryPhone.trim(),
        relationship: primaryRel.trim()
      }
    });

    setShowEditPrimary(false);
    triggerSuccess();
  }

  function handleAddTrusted(e) {
    e.preventDefault();
    if (!newTrustedName.trim() || !newTrustedPhone.trim()) return;

    const cleaned = cleanPhoneInput(newTrustedPhone);
    if (cleaned.length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number for the contact.");
      return;
    }
    setPhoneError("");

    const newContact = {
      id: Date.now(),
      name: newTrustedName.trim(),
      phone: newTrustedPhone.trim(),
      role: newTrustedRole
    };

    updateContacts({
      trusted: [...(contacts?.trusted || []), newContact]
    });

    setNewTrustedName("");
    setNewTrustedPhone("");
    setShowAddTrusted(false);
    triggerSuccess();
  }

  function handleRemoveTrusted(id) {
    updateContacts({
      trusted: (contacts?.trusted || []).filter(c => c.id !== id)
    });
    triggerSuccess();
  }

  function handleToggleLocation() {
    updateContacts({
      locationSharingEnabled: !contacts?.locationSharingEnabled
    });
    triggerSuccess();
  }

  function handleToggleSms() {
    updateContacts({
      autoSmsOnSOS: !contacts?.autoSmsOnSOS
    });
    triggerSuccess();
  }

  function triggerSuccess() {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  }

  return (
    <div className="container page-container narrow">
      <SOSModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />

      <div className="dashboard-head">
        <div>
          <div className="eyebrow">EMERGENCY PROTOCOL CONFIGURATION</div>
          <h1>SOS Settings & Contacts</h1>
          <p>
            Configure your designated primary emergency phone target and trusted circle recipients for rapid assistance during urgent situations.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-danger-sos"
            onClick={() => setSosModalOpen(true)}
          >
            <ShieldAlert size={18} /> Test SOS Protocol
          </button>
        </div>
      </div>

      {/* Honest Operational Notice Banner */}
      <div className="simulation-disclaimer-box" style={{ margin: "0 0 16px" }}>
        <Info size={16} />
        <small>
          Emergency Protocol Notice: Activating SOS connects directly to your device telephone dialer (tel:) and retrieves your verified GPS coordinates to create a shareable Google Maps link. Calls and message delivery require user confirmation on your device.
        </small>
      </div>

      {/* Backend Gateway Operational Status */}
      {sosStatus && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", padding: "12px 16px", background: "var(--ivory)", border: "1px solid var(--line)", borderRadius: "10px", margin: "0 0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={16} className="text-berry" />
            <span style={{ fontSize: "13px", color: "var(--ink)" }}>
              <strong>Automated Alert Gateway:</strong>{" "}
              {sosStatus.smsConfigured
                ? `Active via ${sosStatus.smsProvider || "Twilio"}`
                : "Client-Assisted Mode (Device SMS/WhatsApp Links)"}
            </span>
          </div>
          <span className={`badge ${sosStatus.smsConfigured ? "badge-status-verified" : "badge-status-submitted"}`} style={{ fontSize: "11px" }}>
            {sosStatus.smsConfigured ? "Gateway Ready" : "Device Link Fallback"}
          </span>
        </div>
      )}

      {savedSuccess && (
        <div className="alert-banner-success">
          <CheckCircle2 size={16} /> Emergency configuration updated successfully.
        </div>
      )}

      {/* Primary Emergency Contact */}
      <div className="detail-card">
        <div className="places-header">
          <div>
            <div className="eyebrow">PRIMARY EMERGENCY CONTACT</div>
            <h3>Direct Phone Call Target</h3>
            <p className="card-sub-copy">
              This is the primary family member or contact targeted when you initiate an emergency phone call from the SOS modal.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowEditPrimary(v => !v)}
          >
            <Edit2 size={14} /> {showEditPrimary ? "Cancel Edit" : "Edit Contact"}
          </button>
        </div>

        {showEditPrimary ? (
          <form onSubmit={handleSavePrimary} className="add-contact-form" style={{ marginTop: "14px" }}>
            <input
              type="text"
              placeholder="Full Name (e.g. Aarti Sharma)"
              value={primaryName}
              onChange={e => setPrimaryName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone (e.g. +91 98765 43210)"
              value={primaryPhone}
              onChange={e => setPrimaryPhone(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Relationship (e.g. Sister, Parent, Spouse)"
              value={primaryRel}
              onChange={e => setPrimaryRel(e.target.value)}
              required
            />
            {phoneError && <p className="field-error-text">{phoneError}</p>}
            <button type="submit" className="btn btn-berry btn-sm">
              Save Primary Contact
            </button>
          </form>
        ) : (
          <div className="contact-display-card" style={{ marginTop: "12px" }}>
            <div className="contact-icon">
              <Phone size={20} />
            </div>
            <div className="contact-details">
              <strong>{contacts?.primary?.name || "Aarti Sharma"}</strong>
              <p>{contacts?.primary?.phone || "+91 98765 43210"} · {contacts?.primary?.relationship || "Family"}</p>
            </div>
            <span className="badge badge-status-verified">Primary Call</span>
          </div>
        )}
      </div>

      {/* Trusted Contacts Group */}
      <div className="detail-card">
        <div className="places-header">
          <div>
            <div className="eyebrow">TRUSTED CONTACTS</div>
            <h3>Alert Circle Recipients</h3>
            <p className="card-sub-copy">
              These contacts are prepared to receive your Google Maps coordinates when you choose to share your location.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowAddTrusted(v => !v)}
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>

        {showAddTrusted && (
          <form onSubmit={handleAddTrusted} className="add-contact-form">
            <input
              type="text"
              placeholder="Full Name (e.g. Meera P.)"
              value={newTrustedName}
              onChange={e => setNewTrustedName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Mobile Phone (e.g. 9822012345)"
              value={newTrustedPhone}
              onChange={e => setNewTrustedPhone(e.target.value)}
              required
            />
            <select
              value={newTrustedRole}
              onChange={e => setNewTrustedRole(e.target.value)}
            >
              <option value="Family">Family</option>
              <option value="Friend">Friend</option>
              <option value="Colleague">Colleague</option>
              <option value="Neighbor">Neighbor</option>
            </select>
            {phoneError && <p className="field-error-text">{phoneError}</p>}
            <button type="submit" className="btn btn-berry btn-sm">
              Save Contact
            </button>
          </form>
        )}

        <div className="contacts-list">
          {(!contacts?.trusted || contacts.trusted.length === 0) ? (
            <p className="empty-comments-note">No trusted contacts added yet.</p>
          ) : (
            contacts.trusted.map(c => (
              <div key={c.id} className="contact-item-row">
                <div className="contact-info">
                  <Users size={16} className="text-berry" />
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.phone} · {c.role}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => handleRemoveTrusted(c.id)}
                  title="Remove contact"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Emergency Preferences */}
      <div className="detail-card">
        <div className="eyebrow">EMERGENCY PREFERENCES</div>
        <h3>Location Sharing & Alert Protocol</h3>

        <div className="preference-toggle-row">
          <div>
            <strong>GPS Location Sharing Authorization</strong>
            <p>Allow the emergency modal to retrieve one-shot GPS coordinates for emergency map sharing.</p>
          </div>
          <label className="switch" htmlFor="toggle-location">
            <input
              id="toggle-location"
              type="checkbox"
              checked={contacts?.locationSharingEnabled ?? true}
              onChange={handleToggleLocation}
            />
            <span />
          </label>
        </div>

        <div className="preference-toggle-row">
          <div>
            <strong>Quick-SMS Preparation for Trusted Circle</strong>
            <p>Pre-populate device SMS links with your coordinates for configured trusted contacts.</p>
          </div>
          <label className="switch" htmlFor="toggle-sms">
            <input
              id="toggle-sms"
              type="checkbox"
              checked={contacts?.autoSmsOnSOS ?? true}
              onChange={handleToggleSms}
            />
            <span />
          </label>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <Link to="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
