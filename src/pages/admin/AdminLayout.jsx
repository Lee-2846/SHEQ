import { NavLink, Outlet } from "react-router-dom";
import {
  FileText,
  Flame,
  AlertCircle,
  Share2,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();

  const navItems = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/reports", label: "Reports Moderation", icon: FileText },
    { to: "/admin/hotspots", label: "Hotspot Analysis", icon: Flame },
    { to: "/admin/issues", label: "Complaints & Issues", icon: AlertCircle },
    { to: "/admin/escalations", label: "External Escalations", icon: Share2 },
    { to: "/admin/moderation", label: "Dispute Log", icon: ShieldCheck }
  ];

  return (
    <div className="container page-container">
      {/* Admin Shell Header */}
      <div className="admin-header-bar">
        <div>
          <div className="eyebrow">AUTHORIZED ADMINISTRATION</div>
          <h1>SHEQ Admin Control Center</h1>
          <p>
            Logged in as <strong>{user?.name || "Lead Admin"}</strong> · Safety Operations & Moderation
          </p>
        </div>
      </div>

      {/* Admin Sub-Navigation Tabs */}
      <div className="admin-subnav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-tab ${isActive ? "active" : ""}`}
            >
              <Icon size={15} /> {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Admin Sub-Page Content */}
      <div className="admin-body">
        <Outlet />
      </div>
    </div>
  );
}
