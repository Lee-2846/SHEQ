import { useState } from "react";
import { ShieldAlert, Phone, Users, MapPin, X, Info } from "lucide-react";
import { useData } from "../context/DataContext";

export default function SOSModal({ isOpen, onClose }) {
  const { contacts } = useData();
  const [simulatedCallActive, setSimulatedCallActive] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card sos-modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close SOS">
          <X size={20} />
        </button>

        <div className="sos-modal-header">
          <div className="sos-pulse-icon">
            <ShieldAlert size={36} />
          </div>
          <div className="eyebrow">PROTOTYPE SIMULATION ONLY</div>
          <h2>Emergency SOS Activated</h2>
          <p>
            This action demonstrates the intended SHEQ emergency flow. In this Phase 1 prototype, actions are simulated
            and do not connect to external telecommunications or emergency services.
          </p>
        </div>

        {/* Prototype Disclaimer Banner */}
        <div className="simulation-disclaimer-box">
          <Info size={16} />
          <small>
            Prototype Notice: No actual phone calls, SMS notifications, or live location broadcasts have been transmitted.
          </small>
        </div>

        <div className="sos-modal-body">
          <div className="sos-status-item">
            <Phone size={18} className="icon-primary" />
            <div>
              <strong>Primary Emergency Contact (Simulated)</strong>
              <p>{contacts?.primary?.name || "Aarti Sharma"} ({contacts?.primary?.phone || "+91 98765 43210"})</p>
            </div>
            <button
              type="button"
              className="btn btn-berry btn-sm"
              onClick={() => setSimulatedCallActive(true)}
            >
              <Phone size={14} /> {simulatedCallActive ? "Calling..." : "Simulate Call"}
            </button>
          </div>

          <div className="sos-status-item">
            <Users size={18} className="icon-primary" />
            <div>
              <strong>Trusted Contacts Notification (Simulated)</strong>
              <p>{contacts?.trusted?.length || 2} configured contacts flagged for simulated emergency dispatch.</p>
            </div>
            <span className="badge badge-status-verified">Simulated Active</span>
          </div>

          <div className="sos-status-item">
            <MapPin size={18} className="icon-primary" />
            <div>
              <strong>Live Location Sharing (Simulated)</strong>
              <p>Simulating active coordinate stream: Pune (18.5204° N, 73.8567° E)</p>
            </div>
            <span className="badge badge-status-review">Simulated</span>
          </div>
        </div>

        <div className="sos-modal-footer">
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => alert("Simulation Note: In a production native implementation, this initiates an official 112 emergency service request.")}
          >
            Simulate 112 Emergency Action
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            End / Cancel Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
