import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, UserCheck, ShieldAlert, Mail, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePhone } from "../utils/validation";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (mode === "admin" ? "/admin" : "/dashboard");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "user") {
        if (!form.identifier.trim()) {
          setError(`Please enter your ${authMethod === "email" ? "email address" : "phone number"}.`);
          setLoading(false);
          return;
        }

        if (authMethod === "email" && !validateEmail(form.identifier)) {
          setError("Please enter a valid email address.");
          setLoading(false);
          return;
        }

        if (authMethod === "phone" && !validatePhone(form.identifier)) {
          setError("Please enter a valid 10-digit mobile number.");
          setLoading(false);
          return;
        }

        if (!form.password || form.password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        await new Promise(r => setTimeout(r, 400));
        loginUser({
          emailOrPhone: form.identifier,
          password: form.password,
          rememberMe: form.rememberMe
        });
        navigate(from, { replace: true });
      } else {
        // Admin Mode
        if (!form.adminEmail.trim()) {
          setError("Please enter authorized admin email.");
          setLoading(false);
          return;
        }
        if (!form.adminKey.trim()) {
          setError("Please enter administrative security key.");
          setLoading(false);
          return;
        }

        await new Promise(r => setTimeout(r, 400));
        loginAdmin({
          email: form.adminEmail,
          key: form.adminKey,
          rememberMe: form.rememberMe
        });
        navigate("/admin", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="brand auth-brand">
          <span className="brand-mark">
            <ShieldCheck size={19} />
          </span>
          SHEQ
        </div>
        <div>
          <div className="eyebrow light-eyebrow">COMMUNITY SAFETY</div>
          <h1>Knowledge can change the way we move through a city.</h1>
          <p>Share experiences. Find context. Make informed decisions.</p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-content">
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${mode === "user" ? "active" : ""}`}
              onClick={() => {
                setMode("user");
                setError("");
              }}
            >
              <UserCheck size={15} /> User Login
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === "admin" ? "active" : ""}`}
              onClick={() => {
                setMode("admin");
                setError("");
              }}
            >
              <ShieldAlert size={15} /> Admin Portal
            </button>
          </div>

          <div className="eyebrow">{mode === "admin" ? "ADMINISTRATIVE ACCESS" : "SIGN IN"}</div>
          <h2>{mode === "admin" ? "SHEQ Admin Login" : "Welcome back."}</h2>
          <p>{mode === "admin" ? "Access authorized safety moderation & analytics." : "Your community safety network is waiting."}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "user" ? (
              <>
                {/* Method selector: Email vs Phone */}
                <div className="method-pill-selector">
                  <button
                    type="button"
                    className={`method-pill ${authMethod === "email" ? "selected" : ""}`}
                    onClick={() => {
                      setAuthMethod("email");
                      setForm({ ...form, identifier: "" });
                      setError("");
                    }}
                  >
                    <Mail size={14} /> Email
                  </button>
                  <button
                    type="button"
                    className={`method-pill ${authMethod === "phone" ? "selected" : ""}`}
                    onClick={() => {
                      setAuthMethod("phone");
                      setForm({ ...form, identifier: "" });
                      setError("");
                    }}
                  >
                    <Phone size={14} /> Phone Number
                  </button>
                </div>

                <label>
                  {authMethod === "email" ? "Email Address" : "Mobile Phone Number"}
                  <input
                    type={authMethod === "email" ? "email" : "tel"}
                    placeholder={authMethod === "email" ? "you@example.com" : "e.g. 9876543210"}
                    value={form.identifier}
                    onChange={e => setForm({ ...form, identifier: e.target.value })}
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </label>
              </>
            ) : (
              <>
                {/* Admin fields */}
                <label>
                  Admin Email
                  <input
                    type="email"
                    placeholder="admin@sheq.app"
                    value={form.adminEmail}
                    onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                  />
                </label>

                <label>
                  Admin Access Key / Password
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.adminKey}
                    onChange={e => setForm({ ...form, adminKey: e.target.value })}
                  />
                </label>
              </>
            )}

            <div className="auth-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={e => setForm({ ...form, rememberMe: e.target.checked })}
                />
                <span>Stay logged in</span>
              </label>
              {mode === "user" && (
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => alert("Password reset link will be sent in a production environment.")}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="btn btn-berry w-100" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : mode === "admin" ? "Log in as Admin →" : "Log In →"}
            </button>

            {mode === "user" ? (
              <p className="auth-switch">
                New to SHEQ? <Link to="/signup">Create an account</Link>
              </p>
            ) : (
              <p className="auth-switch admin-note">
                <ShieldAlert size={13} /> Admin credentials are provisioned internally. No public sign up.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
