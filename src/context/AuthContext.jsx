import { createContext, useContext, useState } from "react";
import { login as apiLogin, signup as apiSignup } from "../services/authService";

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
        : "Member",
    }, rememberMe);
  }

  // Supports authenticated backend admin login (when provisioned in DB) with documented demo fallback
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
          department: "Safety & Operations",
          demoOnly: false
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

  function startSignup({ name, emailOrPhone, method, password, rememberMe = true }) {
    setPendingSignup({ name, emailOrPhone, method, password, rememberMe });
  }

  async function verifyOtp(code) {
    if (!pendingSignup) {
      throw new Error("No pending registration found.");
    }

    if (!code || !/^\d{4,6}$/.test(code.trim())) {
      throw new Error("Please enter a valid 4 to 6 digit verification code.");
    }

    // The backend does not send or verify OTPs yet.
    // Create the account through the API, but do not claim contact verification.
    const session = await apiSignup({
      name: pendingSignup.name,
      emailOrPhone: pendingSignup.emailOrPhone,
      method: pendingSignup.method,
      password: pendingSignup.password
    });

    const rememberMe = pendingSignup.rememberMe;
    const newUser = saveSession({
      ...session,
      joinedDate: session.createdAt
        ? new Date(session.createdAt).toLocaleDateString()
        : "Today"
    }, rememberMe);

    setPendingSignup(null);
    return newUser;
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
