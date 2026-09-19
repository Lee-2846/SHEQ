import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ShieldCheck, Siren } from "lucide-react";

export default function Navbar({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Deduplicate: remove separate "Report" link when logged in since primary CTA button exists.
  // Unify: consistently label as "Safety Map" for both guest and authenticated users.
  const links = user
    ? [
        ["/dashboard", "Dashboard"],
        ["/map", "Safety Map"],
        ["/alerts", "Alerts"],
        ["/insights", "Insights"]
      ]
    : [
        ["/", "Home"],
        ["/map", "Safety Map"],
        ["/about", "How it works"]
      ];

  function logout() {
    setUser(null);
    setOpen(false);
    navigate("/");
  }

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <nav className="navbar-sheq">
        <div className="container nav-inner">
          <Link className="brand" to="/" onClick={() => setOpen(false)}>
            <span className="brand-mark"><ShieldCheck size={20} /></span>
            <span>SHEQ</span>
          </Link>

          <button
            className="mobile-menu"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className={`nav-links ${open ? "open" : ""}`}>
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}

            {user && (
              <NavLink
                to="/profile"
                className={({ isActive }) => isActive ? "nav-user-pill active" : "nav-user-pill"}
                onClick={() => setOpen(false)}
                title="View Profile"
              >
                <span className="nav-avatar">{(user.name || "M").charAt(0).toUpperCase()}</span>
                <span className="nav-username">{user.name || "Member"}</span>
              </NavLink>
            )}

            <Link className="btn btn-berry nav-report" to="/report" onClick={() => setOpen(false)}>
              Report an incident <span>→</span>
            </Link>

            <Link className="sos-mini" to="/sos" onClick={() => setOpen(false)}>
              <Siren size={15} /> SOS
            </Link>

            {!user && (
              <Link className="login-link" to="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
            )}

            {user && (
              <button className="logout-link" onClick={logout}>
                Log out
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Backdrop for mobile drawer dismissal */}
      {open && (
        <div
          className="nav-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
