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
  X,
  FileCheck,
  UploadCloud,
  FileText,
  AlertTriangle,
  RefreshCw,
  XCircle,
  ShieldAlert,
  Info
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getMyVerificationStatus,
  uploadIdentityDocument,
  deleteMyDocument
} from "../services/identityService";
import {
  initiatePhoneVerification,
  verifyPhoneVerification
} from "../services/authService";

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

  // Identity & Verification State
  const [verificationData, setVerificationData] = useState(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docConsent, setDocConsent] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");

  // Phone verification state
  const [phoneToVerify, setPhoneToVerify] = useState(user?.phone || "");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState("idle"); // 'idle' | 'otp'
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneNotice, setPhoneNotice] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  useEffect(() => {
    if (activeTab === "identity") {
      loadVerification();
    }
  }, [activeTab]);

  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const timer = setInterval(() => {
      setPhoneCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  async function loadVerification() {
    setLoadingVerification(true);
    try {
      const data = await getMyVerificationStatus();
      setVerificationData(data);
    } catch {
      // Fallback
    } finally {
      setLoadingVerification(false);
    }
  }

  async function handleSendPhoneOtp(e) {
    e?.preventDefault();
    if (!phoneToVerify.trim()) {
      setPhoneError("Please enter your phone number.");
      return;
    }
    setPhoneError("");
    setPhoneNotice("");
    setPhoneLoading(true);

    try {
      const res = await initiatePhoneVerification(phoneToVerify.trim());
      setPhoneNotice(res.notice || "Verification code sent to your phone.");
      setPhoneCooldown(res.resendCooldownSeconds || 60);
      setPhoneStep("otp");
    } catch (err) {
      setPhoneError(err.message || "Failed to send phone verification code.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyPhoneOtp(e) {
    e?.preventDefault();
    if (!phoneOtp.trim()) {
      setPhoneError("Please enter the 6-digit code.");
      return;
    }
    setPhoneError("");
    setPhoneLoading(true);

    try {
      const res = await verifyPhoneVerification(phoneToVerify.trim(), phoneOtp.trim());
      setPhoneSuccess("Phone number verified successfully!");
      updateProfile({ phone: res.user?.phone || phoneToVerify.trim(), phoneVerified: true });
      setPhoneStep("idle");
      setPhoneOtp("");
      await loadVerification();
      setTimeout(() => setPhoneSuccess(""), 3000);
    } catch (err) {
      setPhoneError(err.message || "Invalid verification code.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleDocumentUpload(e) {
    e.preventDefault();
    if (!docFile) {
      setDocError("Please select a document file (PDF, PNG, or JPEG up to 5MB).");
      return;
    }
    if (!docConsent) {
      setDocError("You must give explicit consent to submit your document for review.");
      return;
    }

    setDocError("");
    setDocSuccess("");
    setDocUploading(true);

    try {
      const res = await uploadIdentityDocument(docFile, docConsent);
      setDocSuccess(res.message || "Document submitted to private vault successfully.");
      setDocFile(null);
      setDocConsent(false);
      updateProfile({ verificationStatus: "pending_review", hasDocumentSubmitted: true });
      await loadVerification();
      setTimeout(() => setDocSuccess(""), 4000);
    } catch (err) {
      setDocError(err.message || "Failed to upload document.");
    } finally {
      setDocUploading(false);
    }
  }

  async function handleDeleteDocument() {
    if (!window.confirm("Are you sure you want to delete your uploaded identity document from the private vault?")) {
      return;
    }

    try {
      await deleteMyDocument();
      updateProfile({ verificationStatus: "unverified", hasDocumentSubmitted: false });
      await loadVerification();
      setDocSuccess("Document deleted securely from vault.");
      setTimeout(() => setDocSuccess(""), 3000);
    } catch (err) {
      alert(err.message || "Failed to delete document.");
    }
  }

  function getVerificationBadge(status) {
    switch (status) {
      case "verified":
        return <span className="badge badge-status-verified">Verified</span>;
      case "pending_review":
      case "pending":
        return <span className="badge badge-status-review">Pending Review</span>;
      case "rejected":
        return <span className="badge badge-danger">Rejected</span>;
      case "resubmission_required":
        return <span className="badge badge-signal-attention">Resubmission Required</span>;
      default:
        return <span className="badge badge-status-submitted">Unverified</span>;
    }
  }

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
          className={`tab-link ${activeTab === "identity" ? "active" : ""}`}
          onClick={() => setTab("identity")}
        >
          <FileCheck size={15} /> Identity & Verification
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

        {/* 2. IDENTITY & VERIFICATION TAB */}
        {activeTab === "identity" && (
          <div className="detail-card">
            <div className="eyebrow">IDENTITY & TRUST VERIFICATION</div>
            <h3>Member Trust & Document Verification</h3>
            <p className="card-sub-copy">
              Verified members earn trusted-contributor status, elevating the priority and credibility of community incident reports and emergency alerts.
            </p>

            {/* Notification & Status Banners */}
            {docSuccess && (
              <div className="alert-banner-success" style={{ margin: "16px 0" }}>
                <CheckCircle2 size={16} /> {docSuccess}
              </div>
            )}
            {docError && (
              <div className="form-error" style={{ margin: "16px 0" }}>
                <AlertTriangle size={16} /> {docError}
              </div>
            )}
            {phoneSuccess && (
              <div className="alert-banner-success" style={{ margin: "16px 0" }}>
                <CheckCircle2 size={16} /> {phoneSuccess}
              </div>
            )}
            {phoneError && (
              <div className="form-error" style={{ margin: "16px 0" }}>
                <AlertTriangle size={16} /> {phoneError}
              </div>
            )}

            {/* 5-Stage Stepper */}
            <div className="verification-stepper">
              {/* Stage 1: Email */}
              <div className="stepper-stage completed">
                <div className="stepper-stage-header">
                  <span className="stepper-num"><CheckCircle2 size={12} /></span>
                  <span className="stepper-stage-status">Verified</span>
                </div>
                <div className="stepper-stage-title">1. Email Address</div>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>{user?.email || "Email verified"}</small>
              </div>

              {/* Stage 2: Phone */}
              <div className={`stepper-stage ${(user?.phoneVerified || verificationData?.phoneVerified) ? "completed" : "active"}`}>
                <div className="stepper-stage-header">
                  <span className="stepper-num">
                    {(user?.phoneVerified || verificationData?.phoneVerified) ? <CheckCircle2 size={12} /> : "2"}
                  </span>
                  <span className="stepper-stage-status">
                    {(user?.phoneVerified || verificationData?.phoneVerified) ? "Verified" : "Action Needed"}
                  </span>
                </div>
                <div className="stepper-stage-title">2. Phone OTP</div>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                  {(user?.phoneVerified || verificationData?.phoneVerified) ? (user?.phone || "Verified") : "Pending verification"}
                </small>
              </div>

              {/* Stage 3: Profile Details */}
              <div className={`stepper-stage ${user?.name ? "completed" : "pending"}`}>
                <div className="stepper-stage-header">
                  <span className="stepper-num">
                    {user?.name ? <CheckCircle2 size={12} /> : "3"}
                  </span>
                  <span className="stepper-stage-status">
                    {user?.name ? "Completed" : "Incomplete"}
                  </span>
                </div>
                <div className="stepper-stage-title">3. Profile Details</div>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                  {user?.name ? user.name : "Add your full name"}
                </small>
              </div>

              {/* Stage 4: Masked ID Submission */}
              <div className={`stepper-stage ${(user?.hasDocumentSubmitted || verificationData?.hasDocumentSubmitted) ? "completed" : "pending"}`}>
                <div className="stepper-stage-header">
                  <span className="stepper-num">
                    {(user?.hasDocumentSubmitted || verificationData?.hasDocumentSubmitted) ? <CheckCircle2 size={12} /> : "4"}
                  </span>
                  <span className="stepper-stage-status">
                    {(user?.hasDocumentSubmitted || verificationData?.hasDocumentSubmitted) ? "Submitted" : "Pending"}
                  </span>
                </div>
                <div className="stepper-stage-title">4. Masked Aadhaar</div>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                  {(user?.hasDocumentSubmitted || verificationData?.hasDocumentSubmitted) ? "Vault storage" : "Upload required"}
                </small>
              </div>

              {/* Stage 5: Administrative Review */}
              <div className={`stepper-stage ${(user?.verificationStatus === "verified" || verificationData?.verificationStatus === "verified") ? "completed" : ((user?.verificationStatus === "pending_review" || verificationData?.verificationStatus === "pending_review") ? "active" : "pending")}`}>
                <div className="stepper-stage-header">
                  <span className="stepper-num">
                    {(user?.verificationStatus === "verified" || verificationData?.verificationStatus === "verified") ? <CheckCircle2 size={12} /> : "5"}
                  </span>
                  <span className="stepper-stage-status">
                    {getVerificationBadge(user?.verificationStatus || verificationData?.verificationStatus || "unverified")}
                  </span>
                </div>
                <div className="stepper-stage-title">5. Admin Review</div>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                  {(user?.verificationStatus === "verified" || verificationData?.verificationStatus === "verified")
                    ? "Approved"
                    : ((user?.verificationStatus === "resubmission_required" || verificationData?.verificationStatus === "resubmission_required")
                        ? "Action Required"
                        : ((user?.verificationStatus === "rejected" || verificationData?.verificationStatus === "rejected")
                            ? "Rejected"
                            : "Awaiting Review"))}
                </small>
              </div>
            </div>

            {/* Review Status & Feedback Box */}
            {(user?.verificationStatus === "resubmission_required" || verificationData?.verificationStatus === "resubmission_required") && (
              <div className="doc-guideline-box" style={{ background: "#fff5f5", borderColor: "#feb2b2", color: "#c53030" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Resubmission Requested by Administrator:</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                      {verificationData?.documentDetails?.adminReviewNotes || "The submitted document was unclear or did not meet the masking guidelines. Please submit a clear scan with the first 8 digits masked."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(user?.verificationStatus === "rejected" || verificationData?.verificationStatus === "rejected") && (
              <div className="doc-guideline-box" style={{ background: "#fff5f5", borderColor: "#feb2b2", color: "#c53030" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <XCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Verification Request Rejected:</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                      {verificationData?.documentDetails?.adminReviewNotes || "The submitted document could not be verified. You may contact support or submit a valid masked document."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-flow 1: Phone Verification */}
            <div className="phone-verify-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div className="eyebrow">STEP 2 — PHONE AUTHENTICATION</div>
                  <h4 style={{ margin: "4px 0" }}>SMS One-Time Passcode (OTP)</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                    Real SMS verification enables phone-based login and authenticated emergency escalations.
                  </p>
                </div>
                {(user?.phoneVerified || verificationData?.phoneVerified) && (
                  <span className="badge badge-status-verified" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={13} /> Phone Verified
                  </span>
                )}
              </div>

              {(user?.phoneVerified || verificationData?.phoneVerified) ? (
                <div style={{ marginTop: "14px", padding: "12px", background: "#f0fff4", borderRadius: "10px", border: "1px solid #c6f6d5" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <strong style={{ color: "#22543d", fontSize: "13px" }}>Verified Number: {user?.phone || verificationData?.phone}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#276749" }}>
                        Your phone is protected with timing-safe HMAC-SHA256 OTP authentication.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "14px" }}>
                  {phoneNotice && (
                    <div className="doc-guideline-box" style={{ margin: "8px 0" }}>
                      <Info size={14} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "4px" }} />
                      {phoneNotice}
                    </div>
                  )}

                  {phoneStep === "idle" ? (
                    <form onSubmit={handleSendPhoneOtp} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", marginTop: "10px" }}>
                      <div className="form-field-label" style={{ flex: "1 1 240px", margin: 0 }}>
                        <label htmlFor="phone-verify-input">Phone Number (with country code or 10-digit)</label>
                        <input
                          id="phone-verify-input"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phoneToVerify}
                          onChange={e => setPhoneToVerify(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-berry"
                        disabled={phoneLoading || phoneCooldown > 0}
                      >
                        {phoneLoading ? "Sending OTP..." : (phoneCooldown > 0 ? `Wait ${phoneCooldown}s` : "Send Verification OTP")}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyPhoneOtp} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", marginTop: "10px" }}>
                      <div className="form-field-label" style={{ flex: "1 1 180px", margin: 0 }}>
                        <label htmlFor="phone-otp-input">6-Digit SMS Code</label>
                        <input
                          id="phone-otp-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          value={phoneOtp}
                          onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                          autoFocus
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-berry"
                        disabled={phoneLoading || phoneOtp.length !== 6}
                      >
                        {phoneLoading ? "Verifying..." : "Confirm Code"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleSendPhoneOtp}
                        disabled={phoneCooldown > 0 || phoneLoading}
                      >
                        {phoneCooldown > 0 ? `Resend (${phoneCooldown}s)` : "Resend OTP"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setPhoneStep("idle")}
                      >
                        Change Number
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Sub-flow 2: Masked Aadhaar Vault Submission */}
            <div className="vault-info-card">
              <div className="eyebrow">STEP 4 & 5 — MASKED AADHAAR PRIVATE VAULT</div>
              <h4 style={{ margin: "4px 0" }}>Identity Document Submission</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                Submit a government-issued identity document with the first 8 digits masked for trust verification.
              </p>

              {(user?.hasDocumentSubmitted || verificationData?.hasDocumentSubmitted) && !(user?.verificationStatus === "resubmission_required" || verificationData?.verificationStatus === "resubmission_required") ? (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: "var(--white)", border: "1px solid var(--line)", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div className="contact-icon">
                        <FileText size={20} />
                      </div>
                      <div>
                        <strong>{verificationData?.documentDetails?.originalFilename || "Masked_Identity_Document"}</strong>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                          Submitted: {verificationData?.documentDetails?.uploadedAt ? new Date(verificationData.documentDetails.uploadedAt).toLocaleDateString() : "Active"} · Private Server Vault (Encrypted & Non-Public)
                        </div>
                        <div style={{ marginTop: "6px" }}>
                          {getVerificationBadge(user?.verificationStatus || verificationData?.verificationStatus || "pending_review")}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-danger-outline"
                      onClick={handleDeleteDocument}
                      title="Permanently remove your document from the server vault"
                    >
                      <Trash2 size={14} /> Delete Document (Right to Erasure)
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDocumentUpload} style={{ marginTop: "16px" }}>
                  {/* Masking Guidelines Box */}
                  <div className="doc-guideline-box">
                    <strong>Mandatory Aadhaar Masking Instructions:</strong>
                    <ul>
                      <li>
                        <strong>Mask the first 8 digits:</strong> Only the last 4 digits (e.g., <code>XXXX XXXX 1234</code>) and your legal name should be visible.
                      </li>
                      <li>
                        <strong>How to mask:</strong> You can download an official "Masked Aadhaar" from the UIDAI portal (<a href="https://myaadhaar.uidai.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--berry)", textDecoration: "underline" }}>myaadhaar.uidai.gov.in</a>) or black out the first 8 digits using any image editor.
                      </li>
                      <li>
                        <strong>Accepted formats:</strong> PDF, PNG, or JPEG. Maximum file size: 5 MB.
                      </li>
                    </ul>
                  </div>

                  {/* File Selector */}
                  <div className="doc-upload-zone" onClick={() => document.getElementById("aadhaar-doc-input")?.click()}>
                    <UploadCloud size={32} style={{ color: "var(--berry)", margin: "0 auto 8px" }} />
                    <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "14px" }}>
                      {docFile ? docFile.name : "Click or drag your Masked Aadhaar document here"}
                    </div>
                    <small style={{ color: "var(--muted)" }}>
                      {docFile ? `${(docFile.size / 1024 / 1024).toFixed(2)} MB · Ready to submit` : "PDF, PNG, or JPEG up to 5MB"}
                    </small>
                    <input
                      id="aadhaar-doc-input"
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setDocError("File size exceeds 5MB limit.");
                            setDocFile(null);
                          } else {
                            setDocError("");
                            setDocFile(file);
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Explicit Consent Checkbox */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", margin: "14px 0" }}>
                    <input
                      id="doc-consent-check"
                      type="checkbox"
                      checked={docConsent}
                      onChange={e => setDocConsent(e.target.checked)}
                      style={{ marginTop: "4px" }}
                      required
                    />
                    <label htmlFor="doc-consent-check" style={{ fontSize: "12px", color: "var(--ink)", lineHeight: 1.5, cursor: "pointer" }}>
                      I confirm that the first 8 digits of my Aadhaar number are masked. I grant explicit consent for SHEQ administrators to securely inspect this document solely to verify community safety trust eligibility in accordance with data protection guidelines.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-berry"
                    disabled={!docFile || !docConsent || docUploading}
                    style={{ minWidth: "160px" }}
                  >
                    {docUploading ? "Uploading to Vault..." : "Submit to Private Vault"}
                  </button>
                </form>
              )}
            </div>

            {/* Legal & Privacy Disclosure */}
            <div className="privacy-info-box" style={{ marginTop: "24px" }}>
              <ShieldCheck size={24} className="text-berry" style={{ flexShrink: 0 }} />
              <div>
                <strong>SHEQ Data Minimization & Privacy Protection</strong>
                <p>
                  In compliance with the Digital Personal Data Protection (DPDP) principles and UIDAI regulatory standards, SHEQ never stores raw unmasked 12-digit Aadhaar numbers or biometric data. Uploaded documents are saved in an isolated, non-public server vault with <code>0o600</code> permissions and SHA-256 integrity verification. Access is restricted exclusively to authenticated SHEQ administrators during manual eligibility decisions. You may delete your document at any time using the Right to Erasure action above.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. MY PLACES TAB */}
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
