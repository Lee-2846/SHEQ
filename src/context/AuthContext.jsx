import { createContext, useContext, useState } from "react";
import {
  initiateSignup as apiInitiateSignup,
  verifySignupOtp as apiVerifySignupOtp,
  resendSignupOtp as apiResendSignupOtp,
  login as apiLogin
} from "../services/authService";

const AuthContext = createContext(null);
const STORAGE_KEY = "sheq_auth_session";

function readSavedSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedSession);
  const [pendingSignup, setPendingSignup] = useState(null);

  function saveSession(sessionUser, rememberMe = true) {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(STORAGE_KEY);
    storage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  }

  async function loginUser({ emailOrPhone, identifier, password, rememberMe = true }) {
    const session = await apiLogin({
      identifier: identifier || emailOrPhone,
      password
    });

    return saveSession({
      ...session,
      joinedDate: session.createdAt
        ? new Date(session.createdAt).toLocaleDateString()
        : "Member"
    }, rememberMe);
  }

  async function loginAdmin({ email = "admin@sheq.app", key = "admin123", rememberMe = true }) {
    try {
      const session = await apiLogin({
        identifier: email,
        password: key
      });
      if (session && session.role === "admin") {
        return saveSession({
          ...session,
          role: "admin",
          department: "Safety & Operations"
        }, rememberMe);
      }
    } catch (err) {
      console.warn("Backend admin login not established; falling back to demo admin session.", err.message);
    }

    const adminUser = {
      id: 999,
      name: "SHEQ Lead Admin",
      email: email || "admin@sheq.app",
      role: "admin",
      department: "Safety & Operations",
      demoOnly: true
    };

    return saveSession(adminUser, rememberMe);
  }

  async function startSignup({ name, emailOrPhone, method = "email", password, rememberMe = true }) {
    const isPhone = method === "phone" || !emailOrPhone.includes("@");

    const result = await apiInitiateSignup({
      name,
      email: isPhone ? undefined : emailOrPhone,
      phone: isPhone ? emailOrPhone : undefined,
      password
    });

    const isDelivered = isPhone ? result.smsDeliveryConfigured : result.emailDeliveryConfigured;

    setPendingSignup({
      name,
      email: isPhone ? null : emailOrPhone,
      phone: isPhone ? (result.phone || emailOrPhone) : null,
      method: isPhone ? "phone" : "email",
      rememberMe,
      deliveryConfigured: isDelivered,
      emailDeliveryConfigured: result.emailDeliveryConfigured,
      smsDeliveryConfigured: result.smsDeliveryConfigured,
      provider: result.provider,
      notice: result.notice,
      expiresInMinutes: result.expiresInMinutes,
      resendCooldownSeconds: result.resendCooldownSeconds
    });

    return result;
  }

  async function verifyOtp(code) {
    if (!pendingSignup) {
      throw new Error("No pending registration found. Please start registration again.");
    }

    if (!code || !/^\d{4,8}$/.test(code.trim())) {
      throw new Error("Please enter a valid verification code.");
    }

    const session = await apiVerifySignupOtp({
      email: pendingSignup.email,
      phone: pendingSignup.phone,
      otp: code.trim()
    });

    const rememberMe = pendingSignup.rememberMe;
    const verifiedUser = saveSession({
      ...session,
      joinedDate: session.createdAt
        ? new Date(session.createdAt).toLocaleDateString()
        : "Today"
    }, rememberMe);

    setPendingSignup(null);
    return verifiedUser;
  }

  async function resendOtp() {
    if (!pendingSignup) {
      throw new Error("No pending registration found.");
    }

    const result = await apiResendSignupOtp({
      email: pendingSignup.email,
      phone: pendingSignup.phone
    });

    const isDelivered = pendingSignup.method === "phone" ? result.smsDeliveryConfigured : result.emailDeliveryConfigured;

    setPendingSignup(prev => ({
      ...prev,
      deliveryConfigured: isDelivered,
      notice: result.notice,
      resendCooldownSeconds: result.resendCooldownSeconds
    }));
    return result;
  }

  function logout() {
    setUser(null);
    setPendingSignup(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function updateProfile(updatedFields) {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updatedFields };
      if (localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else if (sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        pendingSignup,
        loginUser,
        loginAdmin,
        startSignup,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
