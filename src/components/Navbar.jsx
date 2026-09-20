import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ShieldCheck,
  UserRound,
  MapPin,
  Phone,
  Users,
  Bell,
  Lock,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setProfileDropdownOpen(false);
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
    { to: "/", label: "Home" },
    { to: "/about", label: "How It Works" }
  ];

  // Authenticated User 5 Primary Nav Links
  const userLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/sos", label: "SOS" },
    { to: "/report", label: "Report" },
    { to: "/map", label: "Safety Map" }
  ];

  // Admin Primary Links
  const adminLinks = [
    { to: "/admin", label: "Overview" },
    { to: "/admin/reports", label: "Reports" },
    { to: "/admin/hotspots", label: "Hotspots" },
    { to: "/admin/issues", label: "Issues" },
    { to: "/admin/escalations", label: "Escalations" },
    { to: "/admin/moderation", label: "Moderation" }
  ];

  return (
    <>
      <nav className={`navbar-sheq ${isAdmin ? "admin-navbar" : ""}`}>
        <div className="container nav-inner">
          {/* Brand */}
          <Link className="brand" to={isAdmin ? "/admin" : "/"} onClick={() => setMobileOpen(false)}>
            <span className="brand-mark">
              <ShieldCheck size={20} />
            </span>
            <span>SHEQ</span>
            {isAdmin && <span className="badge badge-admin-pill">Admin</span>}
          </Link>

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
                  <Link className="login-link" to="/login" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                  <Link className="btn btn-berry btn-sm" to="/signup" onClick={() => setMobileOpen(false)}>
                    Sign Up
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

                {/* Profile Dropdown Menu in Top-Right with all required distinct items */}
                <div className="profile-menu-container" ref={dropdownRef}>
                  <button
                    className="nav-user-pill"
                    onClick={() => setProfileDropdownOpen(v => !v)}
                    aria-expanded={profileDropdownOpen}
                    aria-label="Open profile menu"
                  >
                    <span className="nav-avatar">{(user?.name || "M").charAt(0).toUpperCase()}</span>
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
                        <UserRound size={15} /> My Profile
                      </Link>
                      <Link
                        to="/profile?tab=places"
                        className="dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setMobileOpen(false);
                        }}
                      >
                        <MapPin size={15} /> My Places
                      </Link>
                      <Link
                        to="/profile?tab=emergency-contacts"
                        className="dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setMobileOpen(false);
                        }}
                      >
                        <Phone size={15} /> Emergency Contacts
                      </Link>
                      <Link
                        to="/profile?tab=trusted-contacts"
                        className="dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setMobileOpen(false);
                        }}
                      >
                        <Users size={15} /> Trusted Contacts
                      </Link>
                      <Link
                        to="/profile?tab=notifications"
                        className="dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setMobileOpen(false);
                        }}
                      >
                        <Bell size={15} /> Notification Settings
                      </Link>
                      <Link
                        to="/profile?tab=privacy"
                        className="dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setMobileOpen(false);
                        }}
                      >
                        <Lock size={15} /> Account & Privacy
                      </Link>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item logout-btn" onClick={handleLogout}>
                        <LogOut size={15} /> Log Out
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
                  Public Home
                </Link>
                <button className="logout-link" onClick={handleLogout}>
                  Log out
                </button>
              </>
            )}
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
