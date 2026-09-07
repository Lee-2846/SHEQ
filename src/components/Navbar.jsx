import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ShieldCheck, Siren } from "lucide-react";

export default function Navbar({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = user
    ? [["/dashboard", "Dashboard"], ["/map", "Safety Map"], ["/report", "Report"], ["/alerts", "Alerts"], ["/insights", "Insights"]]
    : [["/", "Home"], ["/map", "Explore"], ["/about", "How it works"]];

  function logout() {
    setUser(null);
    navigate("/");
  }

  return (
    <nav className="navbar-sheq">
      <div className="container nav-inner">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand-mark"><ShieldCheck size={20} /></span>
          <span>SHEQ</span>
        </Link>

        <button className="mobile-menu" onClick={() => setOpen(v => !v)} aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>

        <div className={`nav-links ${open ? "open" : ""}`}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          {user && <NavLink to="/profile" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>Profile</NavLink>}
          <Link className="btn btn-berry nav-report" to="/report" onClick={() => setOpen(false)}>Report an incident <span>→</span></Link>
          <Link className="sos-mini" to="/sos" onClick={() => setOpen(false)}><Siren size={15}/> SOS</Link>
          {!user && <Link className="login-link" to="/login" onClick={() => setOpen(false)}>Log in</Link>}
          {user && <button className="logout-link" onClick={logout}>Log out</button>}
        </div>
      </div>
    </nav>
  );
}
