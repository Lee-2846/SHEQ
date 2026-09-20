import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  UserRound,
  MapPin,
  Phone,
  Users,
  Bell,
  Lock,
  LogOut,
  ChevronDown,
  Globe
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import sheqLogo from "../assets/sheq-logo.png";

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close profile and lang dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close drawers on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setProfileDropdownOpen(false);
        setLangDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    setProfileDropdownOpen(false);
    navigate("/");
  }

  // Public Links
  const publicLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.howItWorks") }
  ];

  // Authenticated User Nav Links
  const userLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/sos", label: t("nav.sos") },
    { to: "/report", label: t("nav.report") },
    { to: "/map", label: t("nav.map") }
  ];

  // Admin Primary Links
  const adminLinks = [
    { to: "/admin", label: t("nav.overview") },
    { to: "/admin/reports", label: t("nav.reports") },
    { to: "/admin/hotspots", label: t("nav.hotspots") },
    { to: "/admin/issues", label: t("nav.issues") },
    { to: "/admin/escalations", label: t("nav.escalations") },
    { to: "/admin/moderation", label: t("nav.moderation") }
  ];

  return (
    <>
      <nav className={`navbar-sheq ${isAdmin ? "admin-navbar" : ""}`}>
        <div className="container nav-inner">
          {/* Requirement 3: SHEQ Logo + Wordmark */}
          <Link className="brand" to={isAdmin ? "/admin" : "/"} onClick={() => setMobileOpen(false)}>
            <img src={sheqLogo} alt="SHEQ" className="brand-logo-img" />
            <span className="brand-wordmark">SHEQ</span>
            {isAdmin && <span className="badge badge-admin-pill">Admin</span>}
          </Link>

          {/* Right Navigation & Actions Cluster */}
          <div className="nav-right-cluster">
            {/* Requirement 4 & 5: Global Quick Language Selector */}
            <div className="lang-menu-container" ref={langDropdownRef}>
              <button
                type="button"
                className="lang-selector-btn"
                onClick={() => setLangDropdownOpen(v => !v)}
                aria-expanded={langDropdownOpen}
                aria-label="Change language"
              >
                <Globe size={15} />
                <span className="lang-current-name">
                  {language === "English" ? "EN" : language === "Marathi" ? "मराठी" : "हिंदी"}
                </span>
                <ChevronDown size={13} />
              </button>

              {langDropdownOpen && (
                <div className="lang-dropdown-menu">
                  <button
                    type="button"
                    className={`lang-option-btn ${language === "English" ? "selected" : ""}`}
                    onClick={() => {
                      setLanguage("English");
                      setLangDropdownOpen(false);
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`lang-option-btn ${language === "Marathi" ? "selected" : ""}`}
                    onClick={() => {
                      setLanguage("Marathi");
                      setLangDropdownOpen(false);
                    }}
                  >
                    मराठी (Marathi)
                  </button>
                  <button
                    type="button"
                    className={`lang-option-btn ${language === "Hindi" ? "selected" : ""}`}
                    onClick={() => {
                      setLanguage("Hindi");
                      setLangDropdownOpen(false);
                    }}
                  >
                    हिंदी (Hindi)
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="mobile-menu"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Nav Links Container */}
            <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
              {/* 1. PUBLIC STATE */}
              {!isAuthenticated && (
                <>
                  {publicLinks.map(link => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  <div className="nav-auth-actions">
                    <Link className="nav-login-btn" to="/login" onClick={() => setMobileOpen(false)}>
                      {t("nav.login")}
                    </Link>
                    <Link className="btn btn-berry btn-sm nav-signup-btn" to="/signup" onClick={() => setMobileOpen(false)}>
                      {t("nav.signup")}
                    </Link>
                  </div>
                </>
              )}

              {/* 2. AUTHENTICATED REGULAR USER STATE */}
              {isAuthenticated && !isAdmin && (
                <>
                  {userLinks.map(link => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}

                  {/* Profile Dropdown with Avatar photo support */}
                  <div className="profile-menu-container" ref={dropdownRef}>
                    <button
                      className="nav-user-pill"
                      onClick={() => setProfileDropdownOpen(v => !v)}
                      aria-expanded={profileDropdownOpen}
                      aria-label="Open profile menu"
                    >
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="nav-avatar-img" />
                      ) : (
                        <span className="nav-avatar">{(user?.name || "M").charAt(0).toUpperCase()}</span>
                      )}
                      <span className="nav-username">{user?.name || "Member"}</span>
                      <ChevronDown size={14} />
                    </button>

                    {profileDropdownOpen && (
                      <div className="profile-dropdown-menu">
                        <div className="dropdown-header">
                          <strong>{user?.name || "SHEQ Member"}</strong>
                          <small>{user?.email || user?.phone || "member@sheq.app"}</small>
                        </div>
                        <div className="dropdown-divider" />
                        <Link
                          to="/profile"
                          className="dropdown-item"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <UserRound size={15} /> {t("nav.myProfile")}
                        </Link>
                        <Link
                          to="/profile?tab=places"
                          className="dropdown-item"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <MapPin size={15} /> {t("nav.myPlaces")}
                        </Link>
                        <Link
                          to="/profile?tab=emergency-contacts"
                          className="dropdown-item"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <Phone size={15} /> {t("nav.emergencyContacts")}
                        </Link>
                        <Link
                          to="/profile?tab=trusted-contacts"
                          className="dropdown-item"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <Users size={15} /> {t("nav.trustedContacts")}
                        </Link>
                        <Link
                          to="/profile?tab=notifications"
                          className="dropdown-item"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <Bell size={15} /> {t("nav.notifications")}
                        </Link>
                        <Link
                          to="/profile?tab=privacy"
                          className="dropdown-item"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setMobileOpen(false);
                          }}
                        >
                          <Lock size={15} /> {t("nav.privacy")}
                        </Link>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item logout-btn" onClick={handleLogout}>
                          <LogOut size={15} /> {t("nav.logout")}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 3. AUTHENTICATED ADMIN STATE */}
              {isAuthenticated && isAdmin && (
                <>
                  {adminLinks.map(link => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === "/admin"}
                      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  <Link
                    to="/"
                    className="nav-link view-public-link"
                    onClick={() => setMobileOpen(false)}
                    title="View Public Home"
                  >
                    {t("nav.publicHome")}
                  </Link>
                  <button className="logout-link" onClick={handleLogout}>
                    {t("nav.logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div className="nav-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
    </>
  );
}
