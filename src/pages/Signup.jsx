import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, KeyRound, Check, ArrowRight, AlertCircle, RefreshCw, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  validateEmail,
  validatePhone,
  cleanPhoneInput,
  validatePassword,
  validateConfirmPassword
} from "../utils/validation";
import AuthIllustration from "../components/AuthIllustration";

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [serverNotice, setServerNotice] = useState("");
  const [deliveryConfigured, setDeliveryConfigured] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const { startSignup, verifyOtp, resendOtp, pendingSignup, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect already authenticated users appropriately
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Password analysis for live guidance
  const pwdStatus = validatePassword(form.password);

  // Resend countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  function handleIdentifierChange(e) {
    const val = e.target.value;
    if (method === "phone") {
      const cleaned = cleanPhoneInput(val);
      setForm(prev => ({ ...prev, identifier: cleaned }));
      if (errors.identifier) setErrors(prev => ({ ...prev, identifier: "" }));
    } else {
      setForm(prev => ({ ...prev, identifier: val }));
      if (errors.identifier) setErrors(prev => ({ ...prev, identifier: "" }));
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Please enter your full name.";
    }

    if (!form.identifier.trim()) {
      newErrors.identifier = `Please enter your ${method === "email" ? "email address" : "phone number"}.`;
    } else if (method === "email" && !validateEmail(form.identifier)) {
      newErrors.identifier = "Please enter a valid email address (e.g. name@domain.com).";
    } else if (method === "phone" && !validatePhone(form.identifier)) {
      newErrors.identifier = "Please enter a valid 10-digit mobile number.";
    }

    if (!form.password) {
      newErrors.password = "Please create a password.";
    } else if (!pwdStatus.isValid) {
      newErrors.password = pwdStatus.message;
    }

    if (form.password) {
      const confirmCheck = validateConfirmPassword(form.password, form.confirmPassword);
      if (!confirmCheck.isValid) {
        newErrors.confirmPassword = confirmCheck.message;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await startSignup({
        name: form.name.trim(),
        emailOrPhone: form.identifier.trim(),
        method,
        password: form.password,
        rememberMe: form.rememberMe
      });

      setServerNotice(result.notice || "");
      setDeliveryConfigured(result.emailDeliveryConfigured);
      setCooldownSeconds(result.resendCooldownSeconds || 60);
      setStep("otp");
    } catch (err) {
      setErrors({ form: err.message || "Failed to initiate signup verification." });
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrors({ otp: "Please enter the complete verification code." });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await verifyOtp(otpCode.trim());
      navigate("/dashboard");
    } catch (err) {
      setErrors({ otp: err.message || "Invalid or expired verification code." });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (cooldownSeconds > 0 || resending) return;
    setResending(true);
    setErrors({});

    try {
      const result = await resendOtp();
      setServerNotice(result.notice || "New verification code generated.");
      setDeliveryConfigured(result.emailDeliveryConfigured);
      setCooldownSeconds(result.resendCooldownSeconds || 60);
    } catch (err) {
      setErrors({ otp: err.message || "Unable to resend verification code." });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthIllustration mode="signup" />

      {/* Right-Side Form Panel */}
      <div className="auth-panel">
        <div className="auth-content">
          {step === "form" ? (
            <>
              <div className="eyebrow">JOIN THE NETWORK</div>
              <h2>Let's get you started.</h2>
              <p>You can still choose 100% anonymous reporting for individual incident submissions.</p>

              {errors.form && (
                <div className="form-error" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} /> {errors.form}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="auth-form" noValidate>
                <div className="form-field-label">
                  <label htmlFor="signup-name">Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="e.g. Ananya Sharma"
                    value={form.name}
                    onChange={e => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    className={`form-input ${errors.name ? "input-error" : ""}`}
                    autoComplete="name"
                  />
                  {errors.name && <span className="field-error-text">{errors.name}</span>}
                </div>

                {/* Verification Method Choice */}
                <div className="form-group-spaced">
                  <span className="field-label-text" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
                    Primary Verification Method
                  </span>
                  <div className="method-pill-selector">
                    <button
                      type="button"
                      className={`method-pill ${method === "email" ? "selected" : ""}`}
                      onClick={() => {
                        setMethod("email");
                        setForm({ ...form, identifier: "" });
                        setErrors({});
                      }}
                    >
                      <Mail size={14} /> Email Address
                    </button>
                    <button
                      type="button"
                      className={`method-pill ${method === "phone" ? "selected" : ""}`}
                      onClick={() => {
                        setMethod("phone");
                        setForm({ ...form, identifier: "" });
                        setErrors({});
                      }}
                    >
                      <Phone size={14} /> Phone Number
                    </button>
                  </div>
                </div>

                <div className="form-field-label">
                  <label htmlFor="signup-identifier">
                    {method === "email" ? "Email Address" : "Mobile Phone Number (10 digits)"}
                  </label>
                  <input
                    id="signup-identifier"
                    type={method === "email" ? "email" : "tel"}
                    placeholder={method === "email" ? "you@example.com" : "e.g. 9876543210"}
                    value={form.identifier}
                    onChange={handleIdentifierChange}
                    className={`form-input ${errors.identifier ? "input-error" : ""}`}
                    autoComplete={method === "email" ? "email" : "tel"}
                  />
                  {errors.identifier && (
                    <span className="field-error-text">{errors.identifier}</span>
                  )}
                  {method === "phone" && (
                    <span className="field-subnote" style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                      Note: Automated SMS dispatch is pending telephony provider integration. Email verification is recommended.
                    </span>
                  )}
                </div>

                {/* Password with guidance */}
                <div className="form-field-label">
                  <label htmlFor="signup-password">Create Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="At least 10 characters with a special symbol"
                    value={form.password}
                    onChange={e => {
                      setForm({ ...form, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    className={`form-input ${errors.password ? "input-error" : ""}`}
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <span className="field-error-text">{errors.password}</span>
                  )}

                  {/* Useful Password Requirements Guidance */}
                  {form.password && (
                    <div className="password-guidance-box">
                      <span className={`pwd-req-item ${pwdStatus.hasMinLength ? "satisfied" : ""}`}>
                        {pwdStatus.hasMinLength ? <Check size={13} /> : "•"} At least 10 characters
                      </span>
                      <span className={`pwd-req-item ${pwdStatus.hasSpecialChar ? "satisfied" : ""}`}>
                        {pwdStatus.hasSpecialChar ? <Check size={13} /> : "•"} At least one special symbol (!@#$%^&*...)
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-field-label">
                  <label htmlFor="signup-confirm-password">Confirm Password</label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={e => {
                      setForm({ ...form, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                    }}
                    className={`form-input ${errors.confirmPassword ? "input-error" : ""}`}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <span className="field-error-text">{errors.confirmPassword}</span>
                  )}
                  {form.password && form.confirmPassword && form.password === form.confirmPassword && (
                    <span className="field-success-text">✓ Passwords match</span>
                  )}
                </div>

                <div className="auth-options-row">
                  <label className="checkbox-row-clean" htmlFor="signup-remember">
                    <input
                      id="signup-remember"
                      type="checkbox"
                      checked={form.rememberMe}
                      onChange={e => setForm({ ...form, rememberMe: e.target.checked })}
                      className="checkbox-custom"
                    />
                    <span className="checkbox-text">Stay logged in</span>
                  </label>
                </div>

                <button className="btn btn-berry w-100 btn-auth-submit" type="submit" disabled={loading}>
                  {loading ? "Preparing Verification..." : "Continue to Verification"} <ArrowRight size={16} />
                </button>

                <p className="auth-switch-text">
                  Already have an account?{" "}
                  <Link to="/login" className="auth-switch-link">
                    Log in
                  </Link>
                </p>
              </form>
            </>
          ) : (
            /* OTP Verification Screen */
            <div className="otp-verification-panel">
              <div className="otp-header-icon">
                <KeyRound size={28} />
              </div>
              <div className="eyebrow">SECURITY PASSCODE</div>
              <h2>Verify your {method === "email" ? "Email Address" : "Mobile Phone"}</h2>
              <p>
                Verification code generated for <strong>{form.identifier}</strong>.
              </p>

              {/* Honest Provider Status Notice */}
              {!deliveryConfigured ? (
                <div className="simulation-disclaimer-box" style={{ margin: "0 0 16px", textAlign: "left" }}>
                  <Info size={18} className="text-berry" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Email Delivery Not Yet Configured:</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", lineHeight: "1.4" }}>
                      {serverNotice || "An external email delivery service (SMTP or Resend) has not been connected to this backend yet."}
                    </p>
                  </div>
                </div>
              ) : serverNotice ? (
                <div className="alert-banner-info" style={{ margin: "0 0 16px", padding: "10px 14px", fontSize: "13px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px" }}>
                  <Info size={14} /> {serverNotice}
                </div>
              ) : null}

              <form onSubmit={handleOtpSubmit} className="auth-form" noValidate>
                <div className="form-field-label">
                  <label htmlFor="otp-code">Enter 6-Digit Verification Code</label>
                  <input
                    id="otp-code"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className={`form-input otp-code-input ${errors.otp ? "input-error" : ""}`}
                    value={otpCode}
                    onChange={e => {
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (errors.otp) setErrors({});
                    }}
                    autoFocus
                  />
                </div>

                {errors.otp && (
                  <div className="form-error" style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} /> {errors.otp}
                  </div>
                )}

                <div className="otp-resend-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 16px" }}>
                  <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                    Didn't receive the code?
                  </span>
                  <button
                    type="button"
                    className="text-btn-accent"
                    onClick={handleResendCode}
                    disabled={cooldownSeconds > 0 || resending}
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <RefreshCw size={12} className={resending ? "spin" : ""} />
                    {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend Code"}
                  </button>
                </div>

                <button className="btn btn-berry w-100 btn-auth-submit" type="submit" disabled={loading || otpCode.length < 6}>
                  {loading ? "Verifying..." : "Verify & Go to Dashboard"} <ArrowRight size={16} />
                </button>

                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button
                    type="button"
                    className="text-link-back"
                    onClick={() => {
                      setStep("form");
                      setErrors({});
                      setOtpCode("");
                    }}
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
