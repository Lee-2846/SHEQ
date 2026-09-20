import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CircleAlert,
  Users,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Plus,
  Flame
} from "lucide-react";
import StatCard from "../components/StatCard";
import ReportCard from "../components/ReportCard";
import SOSModal from "../components/SOSModal";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { reports, alerts, savedPlaces, hotspots, stats, addSavedPlace } = useData();
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceType, setNewPlaceType] = useState("Other");

  const name = user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "there";

  function handleAddPlace(e) {
    e.preventDefault();
    if (!newPlaceName.trim()) return;
    addSavedPlace({
      type: newPlaceType,
      name: newPlaceName.trim(),
      address: `${newPlaceName.trim()}, Pune`
    });
    setNewPlaceName("");
    setShowAddPlace(false);
  }

  // Filter personalized reports if user has saved places
  const personalizedReports = savedPlaces.length > 0
    ? reports.filter(r =>
        savedPlaces.some(p =>
          r.place.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(r.place.toLowerCase())
        )
      )
    : [];

  const displayReports = personalizedReports.length > 0 ? personalizedReports : reports.slice(0, 3);

  return (
    <div className="container page-container">
      {/* SOS Emergency Trigger Simulation Modal */}
      <SOSModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />

      {/* Dashboard Header */}
      <div className="dashboard-head">
        <div>
          <div className="eyebrow">YOUR SAFETY DASHBOARD</div>
          <h1>Good evening, {name}.</h1>
          <p>Here’s the community safety picture around your saved places and city.</p>
        </div>
        <div className="dashboard-head-actions">
          {/* Prominent Instant SOS Trigger */}
          <button
            type="button"
            className="btn btn-danger-sos"
            onClick={() => setSosModalOpen(true)}
            aria-label="Emergency SOS Action"
          >
            <ShieldAlert size={18} /> EMERGENCY SOS
          </button>
          <Link to="/report" className="btn btn-berry">
            + Report an Incident
          </Link>
        </div>
      </div>

      {/* Live Data-Derived Stat Cards */}
      <div className="stat-grid">
        <StatCard
          icon={CircleAlert}
          value={stats.totalReports}
          label="Reports Submitted"
          note="in active mock dataset"
        />
        <StatCard
          icon={Users}
          value={stats.verifiedReports}
          label="Verified Reports"
          note="status === 'Verified'"
        />
        <StatCard
          icon={Flame}
          value={stats.activeHotspotsCount}
          label="Active Hotspots"
          note="designated by SHEQ review"
        />
        <StatCard
          icon={Bell}
          value={stats.totalAlerts}
          label="Alerts Issued"
          note="location-based signals"
        />
      </div>

      <div className="dashboard-grid">
        {/* Main Column: Saved Places & Recent Reports */}
        <main>
          {/* Saved Places Section */}
          <div className="detail-card places-card">
            <div className="places-header">
              <div>
                <div className="eyebrow">MY SAVED PLACES</div>
                <h3>Places you care about</h3>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddPlace(v => !v)}
              >
                <Plus size={14} /> Add Place
              </button>
            </div>

            {showAddPlace && (
              <form onSubmit={handleAddPlace} className="add-place-form">
                <select
                  value={newPlaceType}
                  onChange={e => setNewPlaceType(e.target.value)}
                  className="place-type-select"
                >
                  <option value="Home">Home</option>
                  <option value="College">College</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other Area</option>
                </select>
                <input
                  type="text"
                  placeholder="Area / landmark name (e.g. FC Road)"
                  value={newPlaceName}
                  onChange={e => setNewPlaceName(e.target.value)}
                />
                <button type="submit" className="btn btn-berry btn-sm">
                  Save
                </button>
              </form>
            )}

            <div className="places-pill-grid">
              {savedPlaces.map(p => (
                <div key={p.id} className="place-pill">
                  <MapPin size={14} className="icon-berry" />
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.type}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Localized Insights / Recent Reports */}
          <section style={{ marginTop: "24px" }}>
            <div className="section-row">
              <div>
                <div className="eyebrow">
                  {personalizedReports.length > 0 ? "LOCALIZED INSIGHTS" : "RECENT COMMUNITY REPORTS"}
                </div>
                <h2>
                  {personalizedReports.length > 0
                    ? "Activity around your saved places"
                    : "What people are sharing around you"}
                </h2>
              </div>
              <Link className="text-link" to="/map">
                View Safety Map →
              </Link>
            </div>

            <div className="report-list">
              {displayReports.map(r => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          </section>
        </main>

        {/* Aside Column: Quick Actions & Alerts */}
        <aside className="dashboard-side">
          <div className="side-card">
            <div className="eyebrow">QUICK ACTIONS</div>
            <Link to="/map">
              Explore Safety Map <ArrowRight />
            </Link>
            <Link to="/report">
              Submit a Report <ArrowRight />
            </Link>
            <Link to="/sos">
              Manage SOS & Contacts <ArrowRight />
            </Link>
            <Link to="/profile?tab=places">
              Manage Saved Places <ArrowRight />
            </Link>
          </div>

          <div className="side-card soft">
            <div className="eyebrow">LATEST COMMUNITY ALERT</div>
            <h3>{alerts[0]?.title || "Active community signal"}</h3>
            <p>{alerts[0]?.body || "Stay informed of verified reports around your daily routes."}</p>
            <Link to="/map" className="text-link">
              See on map →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
