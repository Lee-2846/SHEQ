import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Phone, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePhone } from "../utils/validation";

export default function Signup() {
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [method, setMethod] = useState("email"); // "email" | "phone"
  const [form, setForm] = useState({
    name: "",
    identifier: "",
    password: "",
    confirmPassword: "",
    rememberMe: true
  });
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { startSignup, verifyOtp } = useAuth();
  const navigate = useNavigate();

  function handleFormSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      return setError("Please enter your full name.");
    }

    if (!form.identifier.trim()) {
      return setError(`Please enter your ${method === "email" ? "email address" : "phone number"}.`);
    }

    if (method === "email" && !validateEmail(form.identifier)) {
      return setError("Please enter a valid email address.");
    }

    if (method === "phone" && !validatePhone(form.identifier)) {
      return setError("Please enter a valid 10-digit mobile number.");
    }

    if (form.password.length < 6) {
      return setError("Password must contain at least 6 characters.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    startSignup({
      name: form.name.trim(),
      emailOrPhone: form.identifier.trim(),
      method,
      password: form.password,
      rememberMe: form.rememberMe
    });

    setStep("otp");
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await new Promise(r => setTimeout(r, 450));
      verifyOtp(otpCode || "123456");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art signup-art">
        <div className="brand auth-brand">
          <span className="brand-mark">
            <ShieldCheck size={19} />
          </span>
          SHEQ
        </div>
        <div>
          <div className="eyebrow light-eyebrow">JOIN THE NETWORK</div>
          <h1>Your experience could help someone else.</h1>
          <p>Become part of a community turning local observations into useful context.</p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-content">
          {step === "form" ? (
            <>
              <div className="eyebrow">CREATE ACCOUNT</div>
              <h2>Let's get you started.</h2>
              <p>You can still choose anonymous reporting for individual incidents.</p>

              <form onSubmit={handleFormSubmit} className="auth-form">
                <label>
                  Full Name
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </label>

                {/* Verification Method Choice */}
                <div>
                  <span className="field-label-text">Verification Method</span>
                  <div className="method-pill-selector">
                    <button
                      type="button"
                      className={`method-pill ${method === "email" ? "selected" : ""}`}
                      onClick={() => {
                        setMethod("email");
                        setForm({ ...form, identifier: "" });
                        setError("");
                      }}
                    >
                      <Mail size={14} /> Email
                    </button>
                    <button
                      type="button"
                      className={`method-pill ${method === "phone" ? "selected" : ""}`}
                      onClick={() => {
                        setMethod("phone");
                        setForm({ ...form, identifier: "" });
                        setError("");
                      }}
                    >
                      <Phone size={14} /> Phone Number
                    </button>
                  </div>
                </div>

                <label>
                  {method === "email" ? "Email Address" : "Mobile Phone Number"}
                  <input
                    type={method === "email" ? "email" : "tel"}
                    placeholder={method === "email" ? "you@example.com" : "e.g. 9876543210"}
                    value={form.identifier}
                    onChange={e => setForm({ ...form, identifier: e.target.value })}
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </label>

                <label>
                  Confirm Password
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </label>

                <div className="auth-options-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.rememberMe}
                      onChange={e => setForm({ ...form, rememberMe: e.target.checked })}
                    />
                    <span>Stay logged in</span>
                  </label>
                </div>

                {error && <div className="form-error">{error}</div>}

                <button className="btn btn-berry w-100" type="submit">
                  Continue to Verification →
                </button>

                <p className="auth-switch">
                  Already have an account? <Link to="/login">Log in</Link>
                </p>
              </form>
            </>
          ) : (
            /* OTP Verification Screen */
            <div className="otp-verification-panel">
              <div className="otp-header-icon">
                <KeyRound size={32} />
              </div>
              <div className="eyebrow">VERIFICATION CODE</div>
              <h2>Verify your {method === "email" ? "Email" : "Phone"}</h2>
              <p>
                We sent a 6-digit simulation code to <strong>{form.identifier}</strong>.
              </p>

              <form onSubmit={handleOtpSubmit} className="auth-form">
                <label>
                  Enter Verification Code
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    className="otp-code-input"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    autoFocus
                  />
                </label>

                <div className="otp-hint-row">
                  <small>Demo simulation code: <strong>123456</strong></small>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => setOtpCode("123456")}
                  >
                    Auto-fill
                  </button>
                </div>

                {error && <div className="form-error">{error}</div>}

                <button className="btn btn-berry w-100" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Access Dashboard →"}
                </button>

                <div className="otp-footer-actions">
                  <button
                    type="button"
                    className="text-link-btn"
                    onClick={() => setStep("form")}
                  >
                    ← Change contact details
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
