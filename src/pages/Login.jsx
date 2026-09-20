import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserCheck, ShieldAlert, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePhone, cleanPhoneInput } from "../utils/validation";
import AuthIllustration from "../components/AuthIllustration";

export default function Login() {
  const [mode, setMode] = useState("user"); // "user" | "admin"
  const [authMethod, setAuthMethod] = useState("email"); // "email" | "phone" for user
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    adminEmail: "admin@sheq.app",
    adminKey: "admin123",
    rememberMe: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { loginUser, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (mode === "admin" ? "/admin" : "/dashboard");

  function handleIdentifierChange(e) {
    const val = e.target.value;
    if (authMethod === "phone") {
      const cleaned = cleanPhoneInput(val);
      setForm(prev => ({ ...prev, identifier: cleaned }));
      if (errors.identifier) setErrors(prev => ({ ...prev, identifier: "" }));
    } else {
      setForm(prev => ({ ...prev, identifier: val }));
      if (errors.identifier) setErrors(prev => ({ ...prev, identifier: "" }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (mode === "user") {
      if (!form.identifier.trim()) {
        newErrors.identifier = `Please enter your ${authMethod === "email" ? "email address" : "phone number"}.`;
      } else if (authMethod === "email" && !validateEmail(form.identifier)) {
        newErrors.identifier = "Please enter a valid email address (e.g. name@domain.com).";
      } else if (authMethod === "phone" && !validatePhone(form.identifier)) {
        newErrors.identifier = "Please enter a valid 10-digit mobile number.";
      }

      if (!form.password) {
        newErrors.password = "Password is required.";
      } else if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);
      try {
        await new Promise(r => setTimeout(r, 400));
        loginUser({
          emailOrPhone: form.identifier.trim(),
          password: form.password,
          rememberMe: form.rememberMe
        });
        navigate(from, { replace: true });
      } catch (err) {
        setErrors({ general: err.message || "Failed to log in. Please check your credentials." });
      } finally {
        setLoading(false);
      }
    } else {
      // Admin Mode
      if (!form.adminEmail.trim()) {
        newErrors.adminEmail = "Please enter authorized admin email.";
      } else if (!validateEmail(form.adminEmail)) {
        newErrors.adminEmail = "Please enter a valid admin email format.";
      }
      if (!form.adminKey.trim()) {
        newErrors.adminKey = "Please enter administrative security key.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);
      try {
        await new Promise(r => setTimeout(r, 400));
        loginAdmin({
          email: form.adminEmail.trim(),
          key: form.adminKey,
          rememberMe: form.rememberMe
        });
        navigate("/admin", { replace: true });
      } catch (err) {
        setErrors({ general: err.message || "Admin authorization failed." });
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="auth-page">
      {/* FIX 2: Tasteful Left-Side Visual Illustration */}
      <AuthIllustration mode="login" />

      {/* Right-Side Authentication Panel */}
      <div className="auth-panel">
        <div className="auth-content">
          {/* User / Admin Toggle */}
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${mode === "user" ? "active" : ""}`}
              onClick={() => {
                setMode("user");
                setErrors({});
              }}
            >
              <UserCheck size={15} /> User Login
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === "admin" ? "active" : ""}`}
              onClick={() => {
                setMode("admin");
                setErrors({});
              }}
            >
              <ShieldAlert size={15} /> Admin Portal
            </button>
          </div>

          <div className="eyebrow">{mode === "admin" ? "ADMINISTRATIVE ACCESS" : "SIGN IN"}</div>
          <h2>{mode === "admin" ? "SHEQ Admin Portal" : "Welcome back."}</h2>
          <p>
            {mode === "admin"
              ? "Access authorized safety moderation, hotspot analysis & municipal liaison."
              : "Your community safety network is waiting."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {mode === "user" ? (
              <>
                {/* Method selector: Email vs Phone */}
                <div className="form-group-spaced">
                  <span className="field-label-text" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
                    Sign in with
                  </span>
                  <div className="method-pill-selector">
                    <button
                      type="button"
                      className={`method-pill ${authMethod === "email" ? "selected" : ""}`}
                      onClick={() => {
                        setAuthMethod("email");
                        setForm({ ...form, identifier: "" });
                        setErrors({});
                      }}
                    >
                      <Mail size={14} /> Email Address
                    </button>
                    <button
                      type="button"
                      className={`method-pill ${authMethod === "phone" ? "selected" : ""}`}
                      onClick={() => {
                        setAuthMethod("phone");
                        setForm({ ...form, identifier: "" });
                        setErrors({});
                      }}
                    >
                      <Phone size={14} /> Phone Number
                    </button>
                  </div>
                </div>

                <div className="form-field-label">
                  <label htmlFor="login-identifier">
                    {authMethod === "email" ? "Email Address" : "Mobile Phone Number (10 digits)"}
                  </label>
                  <input
                    id="login-identifier"
                    type={authMethod === "email" ? "email" : "tel"}
                    placeholder={authMethod === "email" ? "you@example.com" : "e.g. 9876543210"}
                    value={form.identifier}
                    onChange={handleIdentifierChange}
                    className={`form-input ${errors.identifier ? "input-error" : ""}`}
                    autoComplete={authMethod === "email" ? "email" : "tel"}
                  />
                  {errors.identifier && (
                    <span className="field-error-text">{errors.identifier}</span>
                  )}
                </div>

                <div className="form-field-label">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => {
                      setForm({ ...form, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    className={`form-input ${errors.password ? "input-error" : ""}`}
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <span className="field-error-text">{errors.password}</span>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Admin fields */}
                <div className="form-field-label">
                  <label htmlFor="admin-email">Authorized Admin Email</label>
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@sheq.app"
                    value={form.adminEmail}
                    onChange={e => {
                      setForm({ ...form, adminEmail: e.target.value });
                      if (errors.adminEmail) setErrors({ ...errors, adminEmail: "" });
                    }}
                    className={`form-input ${errors.adminEmail ? "input-error" : ""}`}
                    autoComplete="email"
                  />
                  {errors.adminEmail && (
                    <span className="field-error-text">{errors.adminEmail}</span>
                  )}
                </div>

                <div className="form-field-label">
                  <label htmlFor="admin-key">Admin Access Key / Password</label>
                  <input
                    id="admin-key"
                    type="password"
                    placeholder="••••••••"
                    value={form.adminKey}
                    onChange={e => {
                      setForm({ ...form, adminKey: e.target.value });
                      if (errors.adminKey) setErrors({ ...errors, adminKey: "" });
                    }}
                    className={`form-input ${errors.adminKey ? "input-error" : ""}`}
                    autoComplete="current-password"
                  />
                  {errors.adminKey && (
                    <span className="field-error-text">{errors.adminKey}</span>
                  )}
                </div>
              </>
            )}

            {/* FIX 4: Clean Horizontal "Stay logged in" Row */}
            <div className="auth-options-row">
              <label className="checkbox-row-clean" htmlFor="login-remember">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={e => setForm({ ...form, rememberMe: e.target.checked })}
                  className="checkbox-custom"
                />
                <span className="checkbox-text">Stay logged in</span>
              </label>

              {mode === "user" && (
                <button
                  type="button"
                  className="forgot-link-btn"
                  onClick={() => alert("Password reset link will be sent in a production environment.")}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {errors.general && <div className="form-error">{errors.general}</div>}

            <button className="btn btn-berry w-100 btn-auth-submit" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : mode === "admin" ? "Log in as Admin" : "Log In"}{" "}
              <ArrowRight size={16} />
            </button>

            {mode === "user" ? (
              <p className="auth-switch-text">
                New to SHEQ?{" "}
                <Link to="/signup" className="auth-switch-link">
                  Create an account
                </Link>
              </p>
            ) : (
              <p className="auth-switch-text admin-note-sub">
                <Lock size={13} /> Admin credentials provisioned internally for authorized operations.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
