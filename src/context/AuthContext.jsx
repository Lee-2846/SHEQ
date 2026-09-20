import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "sheq_auth_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [pendingSignup, setPendingSignup] = useState(null);

  function loginUser({ emailOrPhone, password, rememberMe = true }) {
    const isEmail = (emailOrPhone || "").includes("@");
    const formattedName = isEmail
      ? emailOrPhone.split("@")[0].charAt(0).toUpperCase() + emailOrPhone.split("@")[0].slice(1)
      : "Member";

    const sessionUser = {
      id: 101,
      name: formattedName || "Ananya Sharma",
      email: isEmail ? emailOrPhone : "member@sheq.app",
      phone: isEmail ? "+91 98765 43210" : emailOrPhone,
      role: "user",
      joinedDate: "Sep 2026"
    };

    setUser(sessionUser);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  }

  function loginAdmin({ email = "admin@sheq.app", key = "admin123", rememberMe = true }) {
    const adminUser = {
      id: 999,
      name: "SHEQ Lead Admin",
      email: email || "admin@sheq.app",
      role: "admin",
      department: "Safety & Operations"
    };

    setUser(adminUser);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
    return adminUser;
  }

  function startSignup({ name, emailOrPhone, method, password, rememberMe = true }) {
    setPendingSignup({
      name,
      emailOrPhone,
      method, // "email" | "phone"
      password,
      rememberMe
    });
  }

  function verifyOtp(code) {
    if (!pendingSignup) {
      throw new Error("No pending registration found.");
    }
    // Simulated OTP check: accept any 4-6 digit code or default 123456
    if (!code || code.trim().length < 4) {
      throw new Error("Please enter a valid 4 to 6 digit verification code.");
    }

    const isEmail = pendingSignup.method === "email";
    const newUser = {
      id: Date.now(),
      name: pendingSignup.name || "SHEQ Member",
      email: isEmail ? pendingSignup.emailOrPhone : "member@sheq.app",
      phone: !isEmail ? pendingSignup.emailOrPhone : "+91 98765 43210",
      role: "user",
      joinedDate: "Today"
    };

    setUser(newUser);
    const storage = pendingSignup.rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(newUser));
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
