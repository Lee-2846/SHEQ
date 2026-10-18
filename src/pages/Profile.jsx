import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  UserRound,
  MapPin,
  Phone,
  Users,
  Bell,
  Lock,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Plus,
  Camera,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { checkIdentityStatusApi, runDemoVerificationApi } from "../services/dataServices";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { savedPlaces, addSavedPlace, removeSavedPlace, contacts, updateContacts } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Distinct tab concepts
  const activeTab = searchParams.get("tab") || "profile";
  // "profile" | "places" | "emergency-contacts" | "trusted-contacts" | "notifications" | "privacy"

  const [form, setForm] = useState({
    name: user?.name || "Ananya Sharma",
    email: user?.email || "ananya@sheq.app",
    phone: user?.phone || "+91 98765 43210"
  });

  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceType, setNewPlaceType] = useState("Home");
  const [showAddPlace, setShowAddPlace] = useState(false);

  const [newTrustedName, setNewTrustedName] = useState("");
  const [newTrustedPhone, setNewTrustedPhone] = useState("");
  const [newTrustedRole, setNewTrustedRole] = useState("Friend");
  const [showAddTrusted, setShowAddTrusted] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [identityStatusData, setIdentityStatusData] = useState(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [demoVerifyNotice, setDemoVerifyNotice] = useState("");

  async function handleCheckIdentityStatus() {
    setIdentityLoading(true);
    setDemoVerifyNotice("");
    try {
      const data = await checkIdentityStatusApi();
      setIdentityStatusData(data);
    } catch (err) {
      setIdentityStatusData({ error: err.message });
    } finally {
      setIdentityLoading(false);
    }
  }

  async function handleRunDemoVerification() {
    setIdentityLoading(true);
    try {
      const result = await runDemoVerificationApi();
      setDemoVerifyNotice(result.notice || "Demo sandbox flow exercised successfully.");
    } catch (err) {
      setDemoVerifyNotice("Simulation failed: " + err.message);
    } finally {
      setIdentityLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
    handleCheckIdentityStatus();
  }, [user]);

  function handleSaveProfile(e) {
    e.preventDefault();
    updateProfile({ ...form, language });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  // FIX 14: Client-side photo upload with validation
  function handlePhotoUpload(e) {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Profile photo size should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      updateProfile({ avatarUrl: dataUrl });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setAvatarError("");
    updateProfile({ avatarUrl: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  function handleAddPlace(e) {
    e.preventDefault();
    if (!newPlaceName.trim()) return;
    addSavedPlace({
      type: newPlaceType,
      name: newPlaceName.trim(),
      address: `${newPlaceName.trim()}, Mumbai`
    });
    setNewPlaceName("");
    setShowAddPlace(false);
  }

  function handleAddTrusted(e) {
    e.preventDefault();
    if (!newTrustedName.trim() || !newTrustedPhone.trim()) return;

    updateContacts({
      trusted: [
        ...(contacts?.trusted || []),
        {
          id: Date.now(),
          name: newTrustedName.trim(),
          phone: newTrustedPhone.trim(),
          role: newTrustedRole
        }
      ]
    });
    setNewTrustedName("");
    setNewTrustedPhone("");
    setShowAddTrusted(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  function handleRemoveTrusted(id) {
    updateContacts({
      trusted: (contacts?.trusted || []).filter(c => c.id !== id)
    });
  }

  function setTab(tabKey) {
    setSearchParams({ tab: tabKey });
  }

  return (
    <div className="container page-container">
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        id="profile-avatar-upload"
        accept="image/png, image/jpeg, image/webp"
        onChange={handlePhotoUpload}
        style={{ display: "none" }}
      />

      {/* Profile Hero Header */}
      <div className="profile-hero">
        <div className="profile-hero-avatar-wrapper">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="profile-hero-avatar-img" />
          ) : (
            <div className="profile-hero-avatar-fallback">
              {(user?.name || "M").charAt(0).toUpperCase()}
            </div>
          )}
          <label
            htmlFor="profile-avatar-upload"
            className="avatar-edit-overlay-btn"
            title="Upload/change profile photo"
          >
            <Camera size={15} />
          </label>
        </div>

        <div>
          <div className="eyebrow light-eyebrow">ACCOUNT SETTINGS</div>
          <h1>{user?.name || "SHEQ Member"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "4px 0 0" }}>
            <p style={{ margin: 0 }}>{user?.email || user?.phone || "member@sheq.app"} · Member since Sep 2026</p>
            <span
              className={`badge ${
                (identityStatusData?.verificationStatus || user?.verificationStatus) === "verified"
                  ? "badge-status-verified"
                  : (identityStatusData?.verificationStatus || user?.verificationStatus) === "pending"
                  ? "badge-status-under-review"
                  : (identityStatusData?.verificationStatus || user?.verificationStatus) === "failed"
                  ? "badge-status-flagged"
                  : "badge-status-submitted"
              }`}
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
              onClick={() => setTab("identity")}
              title="Click to view Aadhaar & Identity verification details"
            >
              <ShieldCheck size={12} />
              {(identityStatusData?.verificationStatus || user?.verificationStatus) === "verified"
                ? "Aadhaar Verified"
                : (identityStatusData?.verificationStatus || user?.verificationStatus) === "pending"
                ? "Verification Pending"
                : (identityStatusData?.verificationStatus || user?.verificationStatus) === "failed"
                ? "Verification Failed"
                : "Aadhaar: Unverified"}
            </span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="alert-banner-success" style={{ margin: "16px 0" }}>
          <CheckCircle2 size={16} /> Profile settings updated successfully.
        </div>
      )}

      {avatarError && (
        <div className="form-error" style={{ margin: "12px 0" }}>
          {avatarError}
        </div>
      )}

      {/* Tabs Navigation with distinct concepts */}
      <div className="profile-tab-nav">
        <button
          type="button"
          className={`tab-link ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setTab("profile")}
        >
          <UserRound size={15} /> My Profile
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === "places" ? "active" : ""}`}
          onClick={() => setTab("places")}
        >
          <MapPin size={15} /> My Places ({savedPlaces.length})
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === "emergency-contacts" ? "active" : ""}`}
          onClick={() => setTab("emergency-contacts")}
        >
          <Phone size={15} /> Emergency Contacts
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === "trusted-contacts" ? "active" : ""}`}
          onClick={() => setTab("trusted-contacts")}
        >
          <Users size={15} /> Trusted Contacts ({contacts?.trusted?.length || 0})
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          <Bell size={15} /> Notification Settings
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === "identity" ? "active" : ""}`}
          onClick={() => setTab("identity")}
        >
          <ShieldCheck size={15} /> Aadhaar & Identity
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === "privacy" ? "active" : ""}`}
          onClick={() => setTab("privacy")}
        >
          <Lock size={15} /> Account & Privacy
        </button>
      </div>

      <div className="profile-content-body">
        {/* 1. MY PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="detail-card">
            <div className="eyebrow">PERSONAL DETAILS</div>
            <h3>Manage your account information</h3>
            <p className="card-sub-copy">Your details remain private and are not displayed on anonymous reports.</p>

            {/* FIX 14: Profile Photo Box */}
            <div className="profile-photo-uploader-box">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar Preview" className="avatar-large-preview" />
              ) : (
                <div className="avatar-large-fallback">
                  {(user?.name || "M").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="photo-uploader-actions-side">
                <strong>Profile Photo</strong>
                <p>Upload a personal photo for your profile and navbar avatar. Max size 2MB.</p>
                <div className="photo-action-buttons">
                  <label htmlFor="profile-avatar-upload" className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                    <Camera size={14} /> {user?.avatarUrl ? "Change Photo" : "Upload Photo"}
                  </label>
                  {user?.avatarUrl && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-danger-outline"
                      onClick={handleRemovePhoto}
                    >
                      <X size={14} /> Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="auth-form" style={{ marginTop: "24px" }}>
              <div className="form-field-label">
                <label htmlFor="profile-fullname">Full Name</label>
                <input
                  id="profile-fullname"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field-label">
                <label htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field-label">
                <label htmlFor="profile-phone">Mobile Phone Number</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field-label">
                <label htmlFor="profile-lang">Preferred Language</label>
                <select
                  id="profile-lang"
                  value={language}
                  onChange={e => {
                    const newLang = e.target.value;
                    setLanguage(newLang);
                    updateProfile({ language: newLang });
                  }}
                  className="form-input"
                >
                  <option value="English">English</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-berry">
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* 2. MY PLACES TAB */}
        {activeTab === "places" && (
          <div className="detail-card">
            <div className="places-header">
              <div>
                <div className="eyebrow">SAVED LOCATIONS</div>
                <h3>Places for personalized safety insights</h3>
                <p className="card-sub-copy">
                  SHEQ highlights relevant reports and active hotspots matching these locations on your dashboard.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddPlace(v => !v)}
              >
                <Plus size={14} /> Add Place
              </button>
            </div>

            {showAddPlace && (
              <form onSubmit={handleAddPlace} className="add-place-form" style={{ margin: "20px 0" }}>
                <select
                  value={newPlaceType}
                  onChange={e => setNewPlaceType(e.target.value)}
                  className="place-type-select"
                >
                  <option value="Home">Home</option>
                  <option value="College">College</option>
                  <option value="Work">Work</option>
                  <option value="Gym">Gym</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Area / landmark (e.g. Dadar, Bandra, Swargate)"
                  value={newPlaceName}
                  onChange={e => setNewPlaceName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-berry btn-sm">
                  Save Place
                </button>
              </form>
            )}

            <div className="places-list" style={{ marginTop: "16px" }}>
              {savedPlaces.map(p => (
                <div key={p.id} className="place-item-card">
                  <div className="place-info">
                    <MapPin size={18} className="text-berry" />
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.type} · {p.address}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => removeSavedPlace(p.id)}
                    title="Remove place"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. EMERGENCY CONTACTS TAB */}
        {activeTab === "emergency-contacts" && (
          <div className="detail-card">
            <div className="eyebrow">PRIMARY EMERGENCY TARGET</div>
            <h3>Primary Emergency Contact Configuration</h3>
            <p className="card-sub-copy">
              The primary contact dialed first during simulated SOS emergency protocol actions.
            </p>

            <div className="contact-display-card" style={{ margin: "20px 0" }}>
              <div className="contact-icon">
                <Phone size={20} />
              </div>
              <div className="contact-details">
                <strong>{contacts?.primary?.name || "Aarti Sharma"}</strong>
                <p>{contacts?.primary?.phone || "+91 98765 43210"} · {contacts?.primary?.relationship || "Sister (Family)"}</p>
              </div>
              <span className="badge badge-status-verified">Primary Contact</span>
            </div>

            <Link to="/sos" className="btn btn-outline btn-sm">
              Configure Emergency Dial Preferences →
            </Link>
          </div>
        )}

        {/* 4. TRUSTED CONTACTS TAB */}
        {activeTab === "trusted-contacts" && (
          <div className="detail-card">
            <div className="places-header">
              <div>
                <div className="eyebrow">TRUSTED RECIPIENTS</div>
                <h3>Trusted Contacts Broadcast List</h3>
                <p className="card-sub-copy">
                  People configured to receive simulated emergency coordinate broadcasts during an SOS.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddTrusted(v => !v)}
              >
                <Plus size={14} /> Add Trusted Contact
              </button>
            </div>

            {showAddTrusted && (
              <form onSubmit={handleAddTrusted} className="add-contact-form" style={{ margin: "20px 0" }}>
                <input
                  type="text"
                  placeholder="Full Name (e.g. Neha S.)"
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

            <div className="contacts-list" style={{ marginTop: "16px" }}>
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
        )}

        {/* 5. NOTIFICATION SETTINGS TAB */}
        {activeTab === "notifications" && (
          <div className="detail-card">
            <div className="eyebrow">NOTIFICATION PREFERENCES</div>
            <h3>Community alerts & updates</h3>

            <div className="preference-toggle-row">
              <div>
                <strong>Area Concern Alerts</strong>
                <p>Receive notifications when new reports are confirmed around your saved places.</p>
              </div>
              <label className="switch" htmlFor="notify-area">
                <input id="notify-area" type="checkbox" defaultChecked />
                <span />
              </label>
            </div>

            <div className="preference-toggle-row">
              <div>
                <strong>Hotspot Designations</strong>
                <p>Get notified when SHEQ review designates an active hotspot in your city.</p>
              </div>
              <label className="switch" htmlFor="notify-hotspot">
                <input id="notify-hotspot" type="checkbox" defaultChecked />
                <span />
              </label>
            </div>

            <div className="preference-toggle-row">
              <div>
                <strong>Issue Resolution Updates</strong>
                <p>Receive updates when municipal lighting or transport issues you reported are resolved.</p>
              </div>
              <label className="switch" htmlFor="notify-resolved">
                <input id="notify-resolved" type="checkbox" defaultChecked />
                <span />
              </label>
            </div>
          </div>
        )}

        {/* 6. AADHAAR & IDENTITY VERIFICATION TAB */}
        {activeTab === "identity" && (
          <div className="detail-card">
            <div className="eyebrow">IDENTITY AUTHENTICATION & VERIFICATION</div>
            <h3>Government Identity Verification (Aadhaar & eKYC Boundary)</h3>
            <p className="card-sub-copy">
              SHEQ strictly separates regular platform login authentication from statutory government identity verification.
              In accordance with UIDAI regulations and the Aadhaar Act (2016), SHEQ practices strict data minimization and
              never collects, stores, or logs raw 12-digit Aadhaar numbers or biometric credentials.
            </p>

            {/* 4 Truthful Verification States Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", margin: "20px 0" }}>
              <div style={{ padding: "14px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)", borderLeft: (identityStatusData?.verificationStatus || user?.verificationStatus) === "unverified" ? "4px solid var(--berry)" : "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-status-submitted">unverified</span>
                  {(identityStatusData?.verificationStatus || user?.verificationStatus) === "unverified" && (
                    <small style={{ color: "var(--berry)", fontWeight: 700 }}>CURRENT</small>
                  )}
                </div>
                <h5 style={{ margin: "8px 0 4px" }}>Standard Account</h5>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  Standard SHEQ user. Can submit reports, post comments, and navigate the Safety Map.
                </p>
              </div>

              <div style={{ padding: "14px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)", borderLeft: (identityStatusData?.verificationStatus || user?.verificationStatus) === "pending" ? "4px solid #a35817" : "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-status-under-review">pending</span>
                  {(identityStatusData?.verificationStatus || user?.verificationStatus) === "pending" && (
                    <small style={{ color: "#a35817", fontWeight: 700 }}>CURRENT</small>
                  )}
                </div>
                <h5 style={{ margin: "8px 0 4px" }}>Verification In Progress</h5>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  Awaiting asynchronous response or documentation verification from authorized agency.
                </p>
              </div>

              <div style={{ padding: "14px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)", borderLeft: (identityStatusData?.verificationStatus || user?.verificationStatus) === "verified" ? "4px solid #1e7e34" : "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-status-verified">verified</span>
                  {(identityStatusData?.verificationStatus || user?.verificationStatus) === "verified" && (
                    <small style={{ color: "#1e7e34", fontWeight: 700 }}>CURRENT</small>
                  )}
                </div>
                <h5 style={{ margin: "8px 0 4px" }}>Aadhaar eKYC Verified</h5>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  Identity confirmed through authorized UIDAI ASA/KUA gateway.
                </p>
              </div>

              <div style={{ padding: "14px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)", borderLeft: (identityStatusData?.verificationStatus || user?.verificationStatus) === "failed" ? "4px solid #c83e4d" : "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-status-flagged">failed</span>
                  {(identityStatusData?.verificationStatus || user?.verificationStatus) === "failed" && (
                    <small style={{ color: "#c83e4d", fontWeight: 700 }}>CURRENT</small>
                  )}
                </div>
                <h5 style={{ margin: "8px 0 4px" }}>Verification Failed</h5>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  Authentication unsuccessful or session expired. Retry required.
                </p>
              </div>
            </div>

            {/* Provider Boundary Details */}
            <div className="detail-card" style={{ background: "var(--ivory)", border: "1px solid var(--line)", marginTop: "16px" }}>
              <div className="eyebrow">PROVIDER INTEGRATION BOUNDARY</div>
              <h4 style={{ margin: "4px 0 8px" }}>Live Backend Provider Status</h4>
              <p className="card-sub-copy" style={{ marginBottom: "12px" }}>
                SHEQ implements an explicit architectural boundary. Genuine government identity verification cannot be simulated;
                it legally requires an active, registered integration with an authorized gateway.
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn btn-berry btn-sm"
                  onClick={handleCheckIdentityStatus}
                  disabled={identityLoading}
                >
                  <ShieldCheck size={14} /> {identityLoading ? "Querying Backend..." : "Query Provider Boundary (/api/auth/identity/status)"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleRunDemoVerification}
                  disabled={identityLoading}
                >
                  Test Demo Sandbox Flow (Simulation Only — Does Not Mark Verified)
                </button>
              </div>

              {identityStatusData && (
                <div style={{ marginTop: "16px", padding: "14px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <strong>Backend Provider Status:</strong>{" "}
                      <span className={identityStatusData.providerConfigured ? "text-success" : "text-muted"}>
                        {identityStatusData.providerConfigured ? "Configured & Active" : "Disabled (Safe Integration Boundary)"}
                      </span>
                    </div>
                    <div>
                      <strong>Registered Gateway:</strong> {identityStatusData.provider || "None (disabled)"}
                    </div>
                    <div>
                      <strong>Account Verification State:</strong>{" "}
                      <span className="badge badge-status-submitted" style={{ marginLeft: "4px" }}>
                        {identityStatusData.verificationStatus || user?.verificationStatus || "unverified"}
                      </span>
                    </div>
                    <div>
                      <strong>Seam Mode:</strong> {identityStatusData.mode || "integration-seam-demo-boundary"}
                    </div>
                  </div>

                  {identityStatusData.requirements && (
                    <div style={{ marginTop: "10px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
                      <strong style={{ fontSize: "12px", color: "var(--berry)" }}>
                        Mandatory Requirements for Live UIDAI / eKYC Connection:
                      </strong>
                      <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                        {identityStatusData.requirements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {demoVerifyNotice && (
                <div className="alert-banner-success" style={{ marginTop: "12px" }}>
                  <CheckCircle2 size={16} /> {demoVerifyNotice}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. PRIVACY & SECURITY TAB */}
        {activeTab === "privacy" && (
          <div className="detail-card">
            <div className="eyebrow">PRIVACY & SECURITY</div>
            <h3>Platform integrity & anonymity</h3>

            <div className="privacy-info-box">
              <ShieldCheck size={24} className="text-berry" />
              <div>
                <strong>Public Anonymity Guaranteed</strong>
                <p>
                  When you submit a report with "Submit anonymously" toggled ON, your name and profile details will never
                  be visible to other members on the Safety Map or Incident Details.
                </p>
              </div>
            </div>

            {/* Aadhaar & Identity Provider Integration Status */}
            <div className="detail-card" style={{ marginTop: "24px", background: "var(--ivory)", border: "1px solid var(--line)" }}>
              <div className="eyebrow">IDENTITY VERIFICATION (AADHAAR & eKYC BOUNDARY)</div>
              <h4 style={{ margin: "4px 0 10px" }}>Account Verification Status</h4>
              <p className="card-sub-copy" style={{ marginBottom: "16px" }}>
                SHEQ separates regular account authentication from government identity verification. Under UIDAI regulations
                and the Information Technology Act, SHEQ does <strong>not</strong> directly collect, store, or log raw 12-digit
                Aadhaar numbers or biometric credentials.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Truthful Status:</span>
                <span className={`badge ${user?.verificationStatus === "verified" ? "badge-status-verified" : "badge-status-submitted"}`}>
                  {user?.verificationStatus || "unverified"}
                </span>
                <small style={{ color: "var(--muted)" }}>
                  (Official UIDAI eKYC provider required for verified designation)
                </small>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCheckIdentityStatus}
                  disabled={identityLoading}
                >
                  {identityLoading ? "Querying..." : "Query Provider Boundary (/api/auth/identity/status)"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleRunDemoVerification}
                  disabled={identityLoading}
                >
                  Test Demo Flow (Does not mark Aadhaar verified)
                </button>
              </div>

              {identityStatusData && (
                <div style={{ marginTop: "14px", padding: "12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}>
                  <strong>Backend Provider Status:</strong> {identityStatusData.providerConfigured ? "Configured" : "Disabled (503 Service Unavailable / Safe Integration Seam)"}
                  <br />
                  <strong>Current Account State:</strong> {identityStatusData.verificationStatus || "unverified"}
                  {identityStatusData.requirements && (
                    <div style={{ marginTop: "8px" }}>
                      <strong style={{ fontSize: "12px" }}>Production Prerequisites:</strong>
                      <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "var(--muted)" }}>
                        {identityStatusData.requirements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {demoVerifyNotice && (
                <div className="alert-banner-success" style={{ marginTop: "12px" }}>
                  <CheckCircle2 size={16} /> {demoVerifyNotice}
                </div>
              )}
            </div>

            <div style={{ marginTop: "30px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut size={16} /> Log Out of SHEQ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
