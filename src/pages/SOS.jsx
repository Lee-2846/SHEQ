import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  ShieldAlert,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Info
} from "lucide-react";
import { useData } from "../context/DataContext";
import SOSModal from "../components/SOSModal";

export default function SOS() {
  const { contacts, updateContacts } = useData();
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [newTrustedName, setNewTrustedName] = useState("");
  const [newTrustedPhone, setNewTrustedPhone] = useState("");
  const [newTrustedRole, setNewTrustedRole] = useState("Friend");
  const [showAddTrusted, setShowAddTrusted] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleAddTrusted(e) {
    e.preventDefault();
    if (!newTrustedName.trim() || !newTrustedPhone.trim()) return;

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
            Configure who gets notified and what actions run when you trigger the emergency SOS action from your
            dashboard.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-danger-sos"
            onClick={() => setSosModalOpen(true)}
          >
            <ShieldAlert size={18} /> Test SOS Protocol (Simulation)
          </button>
        </div>
      </div>

      {/* Prototype Disclaimer Banner */}
      <div className="simulation-disclaimer-box" style={{ margin: "0 0 20px" }}>
        <Info size={16} />
        <small>
          Frontend Prototype Notice: This page manages your simulated emergency setup. Triggering SOS simulates the dial
          and notification actions without establishing real telephone or emergency dispatch connections.
        </small>
      </div>

      {savedSuccess && (
        <div className="alert-banner-success">
          <CheckCircle2 size={16} /> Emergency configuration updated successfully.
        </div>
      )}

      {/* Primary Emergency Contact */}
      <div className="detail-card">
        <div className="eyebrow">PRIMARY EMERGENCY CONTACT</div>
        <h3>Direct Phone Call Target (Simulated)</h3>
        <p className="card-sub-copy">
          This is the primary family member or contact targeted first during the simulated SOS emergency flow.
        </p>

        <div className="contact-display-card">
          <div className="contact-icon">
            <Phone size={20} />
          </div>
          <div className="contact-details">
            <strong>{contacts?.primary?.name || "Aarti Sharma"}</strong>
            <p>{contacts?.primary?.phone || "+91 98765 43210"} · {contacts?.primary?.relationship || "Family"}</p>
          </div>
          <span className="badge badge-status-verified">Primary Call</span>
        </div>
      </div>

      {/* Trusted Contacts Group */}
      <div className="detail-card">
        <div className="places-header">
          <div>
            <div className="eyebrow">TRUSTED CONTACTS</div>
            <h3>Broadcast Alert Recipients (Simulated)</h3>
            <p className="card-sub-copy">
              These contacts are targeted to receive emergency messages with your live location coordinates during SOS simulation.
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
            <strong>Live Location Broadcast Simulation</strong>
            <p>Simulate coordinate broadcasting with trusted contacts when SOS is active.</p>
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
            <strong>Automated Emergency SMS Simulation</strong>
            <p>Simulate instant emergency text dispatch to all configured trusted contacts upon SOS activation.</p>
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
