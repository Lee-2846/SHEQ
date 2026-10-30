import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Phone,
  Users,
  MapPin,
  X,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  Info,
  Send,
  Clock,
  Radio
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { getSosStatus, dispatchSosAlert } from "../services/sosService";

export default function SOSModal({ isOpen, onClose }) {
  const { contacts } = useData();
  const { user } = useAuth();
  const [callingState, setCallingState] = useState(null); // null | 'primary' | '112'
  const [callNotice, setCallNotice] = useState("");

  // Location retrieval state
  const [locState, setLocState] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error'
  const [coords, setCoords] = useState(null);
  const [locTimestamp, setLocTimestamp] = useState(null);
  const [locError, setLocError] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState("");

  // Automated Dispatch State
  const [providerStatus, setProviderStatus] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [dispatchError, setDispatchError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadProviderStatus();
    }
  }, [isOpen]);

  async function loadProviderStatus() {
    try {
      const status = await getSosStatus();
      setProviderStatus(status);
    } catch {
      // Backend status unavailable; fallback to offline mode
      setProviderStatus({ smsConfigured: false, whatsappConfigured: false });
    }
  }

  if (!isOpen) return null;

  const primaryName = contacts?.primary?.name || "Emergency Contact";
  const rawPrimaryPhone = contacts?.primary?.phone || "+919876543210";
  const dialablePrimary = rawPrimaryPhone.replace(/[^\d+]/g, "");

  // Clean phone numbers for SMS sharing
  const trustedPhones = (contacts?.trusted || [])
    .map(c => (c.phone || "").replace(/[^\d+]/g, ""))
    .filter(Boolean);

  function handleTriggerCall(target, number, label) {
    // Prevent accidental repeated triggers
    if (callingState) return;

    setCallingState(target);
    setCallNotice(`Opening phone dialer for ${label} (${number}). Please confirm the call on your device.`);

    // Real user-initiated phone dialer action
    window.location.href = `tel:${number}`;

    // Reset calling indicator after brief delay
    setTimeout(() => {
      setCallingState(null);
    }, 3000);
  }

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocState("error");
      setLocError("Geolocation is not supported by your current browser.");
      return;
    }

    setLocState("loading");
    setLocError("");
    setShareNotice("");

    // One-shot user-authorized location retrieval
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 0);

        setCoords({ lat, lng, accuracy });
        setLocTimestamp(Date.now());
        setLocState("success");
      },
      error => {
        setLocState("error");
        switch (error.code) {
          case 1:
            setLocError("Location permission denied. Please enable location permissions in your browser or device settings.");
            break;
          case 2:
            setLocError("Location unavailable from your device GPS/network. Please check your signal.");
            break;
          case 3:
            setLocError("Location request timed out. Please try again.");
            break;
          default:
            setLocError("An unexpected error occurred while retrieving coordinates.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  const isStale = locTimestamp ? (Date.now() - locTimestamp > 60000) : false;

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : "";

  const emergencyMessage = coords
    ? `EMERGENCY: I need help. My current GPS location is: ${mapsUrl} (Shared via SHEQ Safety Network)`
    : "";

  async function handleNativeShare() {
    if (!coords) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SHEQ Emergency SOS Alert",
          text: emergencyMessage,
          url: mapsUrl
        });
        setShareNotice("Device share menu opened. Confirm sending to your selected contacts.");
      } catch (err) {
        if (err.name !== "AbortError") {
          setShareNotice("Native share cancelled or unavailable.");
        }
      }
    } else {
      handleCopy();
    }
  }

  function handleCopy() {
    if (!emergencyMessage) return;
    navigator.clipboard.writeText(emergencyMessage).then(() => {
      setCopied(true);
      setShareNotice("Emergency text and Google Maps link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      setShareNotice("Unable to copy to clipboard automatically.");
    });
  }

  async function handleDispatchAlert() {
    const alertContacts = [];
    if (contacts?.primary?.phone) {
      alertContacts.push({
        name: contacts.primary.name || "Primary Emergency Contact",
        phone: contacts.primary.phone
      });
    }
    if (Array.isArray(contacts?.trusted)) {
      contacts.trusted.forEach(c => {
        if (c.phone) {
          alertContacts.push({
            name: c.name || "Trusted Circle",
            phone: c.phone
          });
        }
      });
    }

    if (alertContacts.length === 0) {
      setDispatchError("No emergency or trusted contacts configured. Please configure contacts in SOS Settings.");
      return;
    }

    if (!user) {
      setDispatchError("Automated server dispatch requires an authenticated member session. Please use direct device links below.");
      return;
    }

    setDispatching(true);
    setDispatchError("");
    setDispatchResult(null);

    try {
      const res = await dispatchSosAlert({
        coordinates: coords,
        isStale,
        contacts: alertContacts
      });
      setDispatchResult(res);
    } catch (err) {
      setDispatchError(err.message || "Failed to dispatch emergency alerts to server.");
    } finally {
      setDispatching(false);
    }
  }

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
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "4px 0" }}>
            <span className="eyebrow" style={{ color: "#d9534f" }}>EMERGENCY PROTOCOL ACTIVE</span>
            {providerStatus?.smsConfigured ? (
              <span className="badge badge-status-verified" style={{ fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Radio size={11} /> SMS Ready ({providerStatus.smsProvider})
              </span>
            ) : (
              <span className="badge badge-status-submitted" style={{ fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Info size={11} /> Client-Assisted Mode
              </span>
            )}
          </div>
          <h2>Emergency SOS Actions</h2>
          <p>
            Initiate a direct phone dialer action to your primary contact or national emergency services (112),
            and retrieve verified GPS coordinates to dispatch or share with your circle.
          </p>
        </div>

        {callNotice && (
          <div className="alert-banner-info" style={{ margin: "0 0 16px", padding: "10px 14px", background: "#f8f9fa", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13px" }}>
            <Info size={16} className="text-berry" /> {callNotice}
          </div>
        )}

        <div className="sos-modal-body">
          {/* Action 1: Call Primary Emergency Contact */}
          <div className="sos-status-item">
            <Phone size={20} className="icon-primary" />
            <div style={{ flex: 1 }}>
              <strong>Primary Emergency Contact</strong>
              <p>{primaryName} ({rawPrimaryPhone})</p>
            </div>
            <button
              type="button"
              className="btn btn-berry btn-sm"
              onClick={() => handleTriggerCall("primary", dialablePrimary, primaryName)}
              disabled={callingState === "primary"}
            >
              <Phone size={14} /> {callingState === "primary" ? "Opening Dialer..." : `Call ${primaryName}`}
            </button>
          </div>

          {/* Action 2: Call 112 National Emergency */}
          <div className="sos-status-item">
            <ShieldAlert size={20} style={{ color: "#c92a2a" }} />
            <div style={{ flex: 1 }}>
              <strong>National Emergency Services (112)</strong>
              <p>Police, Medical, Fire, and Women Safety Helpline</p>
            </div>
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={() => handleTriggerCall("112", "112", "Emergency Services (112)")}
              disabled={callingState === "112"}
            >
              <Phone size={14} /> {callingState === "112" ? "Opening Dialer..." : "Call 112"}
            </button>
          </div>

          {/* Action 3: Retrieve and Share Real GPS Location */}
          <div className="sos-status-item" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", width: "100%" }}>
              <MapPin size={20} className="icon-primary" style={{ marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <strong>GPS Location Retrieval</strong>
                <p>
                  {locState === "idle" && "Retrieve your device coordinates to share a verified Google Maps link."}
                  {locState === "loading" && "Requesting location permission from browser..."}
                  {locState === "error" && locError}
                  {locState === "success" && coords && (
                    <>
                      Coordinates: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E (±{coords.accuracy}m)
                    </>
                  )}
                </p>
              </div>

              {locState !== "success" ? (
                <button
                  type="button"
                  className="btn btn-berry btn-sm"
                  onClick={handleGetLocation}
                  disabled={locState === "loading"}
                >
                  <MapPin size={14} /> {locState === "loading" ? "Locating..." : "Get Location"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleGetLocation}
                  title="Update coordinates"
                >
                  Refresh GPS
                </button>
              )}
            </div>

            {/* When location retrieved successfully: offer sharing mechanisms */}
            {locState === "success" && coords && (
              <div className="location-share-box" style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-btn-accent"
                    style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <ExternalLink size={12} /> Open in Google Maps
                  </a>
                  {isStale ? (
                    <span className="badge badge-signal-attention" style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} /> Stale GPS (&gt;60s old)
                    </span>
                  ) : (
                    <span className="badge badge-status-verified" style={{ fontSize: "11px" }}>
                      GPS Coordinates Active
                    </span>
                  )}
                </div>

                <div className="share-buttons-row" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                  {navigator.share && (
                    <button
                      type="button"
                      className="btn btn-berry btn-xs"
                      onClick={handleNativeShare}
                    >
                      <Share2 size={12} /> Share via Device
                    </button>
                  )}

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(emergencyMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-xs"
                  >
                    Share on WhatsApp
                  </a>

                  {trustedPhones.length > 0 && (
                    <a
                      href={`sms:${trustedPhones.join(",")}?body=${encodeURIComponent(emergencyMessage)}`}
                      className="btn btn-outline btn-xs"
                    >
                      SMS Trusted Contacts
                    </a>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>

                {shareNotice && (
                  <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--berry)" }}>
                    {shareNotice}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action 4: Automated SOS Dispatch to Circle */}
          <div className="sos-status-item" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", width: "100%" }}>
              <Send size={20} className="icon-primary" style={{ marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <strong>Dispatch SOS Alert to Configured Circle</strong>
                <p>
                  Dispatches emergency alert with verified coordinates through backend SMS/WhatsApp gateways or provides immediate direct device fallback links.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-berry btn-sm"
                onClick={handleDispatchAlert}
                disabled={dispatching || (!contacts?.primary?.phone && (!contacts?.trusted || contacts.trusted.length === 0))}
              >
                <Send size={14} /> {dispatching ? "Dispatching..." : "Dispatch Alert"}
              </button>
            </div>

            {dispatchError && (
              <div className="form-error" style={{ margin: "6px 0", fontSize: "12px" }}>
                <AlertTriangle size={14} /> {dispatchError}
              </div>
            )}

            {dispatchResult && (
              <div style={{ background: "#f8f9fa", border: "1px solid var(--line)", borderRadius: "8px", padding: "12px", marginTop: "6px" }}>
                <div style={{ marginBottom: "8px" }}>
                  {dispatchResult.status === "alerts_sent" ? (
                    <span className="badge badge-status-verified" style={{ fontSize: "11px" }}>
                      Alerts Sent via Server Gateway
                    </span>
                  ) : (
                    <span className="badge badge-signal-attention" style={{ fontSize: "11px" }}>
                      Server SMS Unconfigured — Use Direct Links Below
                    </span>
                  )}
                  <p style={{ fontSize: "12px", margin: "4px 0 0", color: "var(--ink)" }}>
                    {dispatchResult.message}
                  </p>
                </div>

                {/* Delivery breakdown table */}
                {Array.isArray(dispatchResult.results) && dispatchResult.results.length > 0 && (
                  <div style={{ margin: "8px 0" }}>
                    {dispatchResult.results.map((r, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 0", borderBottom: "1px dashed var(--line)" }}>
                        <span><strong>{r.contact}</strong> ({r.phone})</span>
                        <span className={`badge ${r.delivered ? "badge-status-verified" : "badge-status-submitted"}`} style={{ fontSize: "10px" }}>
                          {r.delivered ? `Delivered (${r.provider})` : r.notice || "Use Device Link"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback buttons */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                  {dispatchResult.fallbackUrls?.prefilledSms && (
                    <a
                      href={dispatchResult.fallbackUrls.prefilledSms}
                      className="btn btn-berry btn-xs"
                    >
                      <Phone size={12} /> Send Native Device SMS
                    </a>
                  )}
                  {dispatchResult.fallbackUrls?.prefilledWhatsapp && (
                    <a
                      href={dispatchResult.fallbackUrls.prefilledWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-xs"
                    >
                      <Send size={12} /> Send via WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trusted Contacts Overview */}
          <div className="sos-status-item">
            <Users size={20} className="icon-primary" />
            <div style={{ flex: 1 }}>
              <strong>Configured Trusted Contacts ({contacts?.trusted?.length || 0})</strong>
              <p>
                {(contacts?.trusted || []).length > 0
                  ? (contacts.trusted.map(c => `${c.name} (${c.phone})`).join(", "))
                  : "No trusted contacts configured. Add in SOS Settings."}
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Protocol Notice */}
        <div className="simulation-disclaimer-box" style={{ margin: "16px 0 0" }}>
          <Info size={16} />
          <small>
            Device Action Notice: Triggering calls opens your phone's dialer (tel: protocol) for confirmation.
            Location sharing opens your chosen messaging app or share sheet. SHEQ does not continuously track your location or claim calls were answered without device confirmation.
          </small>
        </div>

        <div className="sos-modal-footer" style={{ marginTop: "16px" }}>
          <button type="button" className="btn btn-outline w-100" onClick={onClose}>
            Close SOS Interface
          </button>
        </div>
      </div>
    </div>
  );
}
