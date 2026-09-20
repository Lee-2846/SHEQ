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

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
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
          <p>{user?.email || user?.phone || "member@sheq.app"} · Member since Sep 2026</p>
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

        {/* 6. PRIVACY & SECURITY TAB */}
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
