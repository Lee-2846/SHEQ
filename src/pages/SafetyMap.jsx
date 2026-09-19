import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { Filter, Search, Map as MapIcon, ListFilter } from "lucide-react";
import { categories } from "../data/mockData";
import { getSignalBadgeClass } from "../utils/badgeHelpers";

export default function SafetyMap({ reports }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [mobileTab, setMobileTab] = useState("map"); // "map" | "list" for mobile/tablet

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const matchesCategory = category === "All" || r.category === category;
      const matchesQuery =
        r.place.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(query.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [reports, category, query]);

  return (
    <div className="map-page">
      {/* Mobile view toggle (visible only on screens <= 900px) */}
      <div className="map-mobile-tabs">
        <button
          className={`map-tab-btn ${mobileTab === "map" ? "active" : ""}`}
          onClick={() => setMobileTab("map")}
        >
          <MapIcon size={16} /> Map View
        </button>
        <button
          className={`map-tab-btn ${mobileTab === "list" ? "active" : ""}`}
          onClick={() => setMobileTab("list")}
        >
          <ListFilter size={16} /> Reports List ({filtered.length})
        </button>
      </div>

      <div className="container-fluid map-shell">
        {/* Sidebar */}
        <aside className={`map-sidebar ${mobileTab === "list" ? "mobile-show" : "mobile-hide"}`}>
          <div className="eyebrow">SAFETY SIGNALS</div>
          <h1>Community safety map</h1>
          <p>
            Explore community-reported observations, confirmed concerns, and active signals around Pune.
          </p>

          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search area, category, or keyword"
              aria-label="Search reports"
            />
          </div>

          <div className="filter-label">
            <Filter size={15} /> Filter by category
          </div>
          <div className="category-scroll">
            {categories.map(c => (
              <button
                key={c}
                className={category === c ? "filter-chip selected" : "filter-chip"}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="map-result-count">
            {filtered.length} active {filtered.length === 1 ? "signal" : "signals"}
          </div>

          <div className="map-report-list">
            {filtered.length === 0 ? (
              <div className="empty-state-card">
                <p>No reports match your current filter.</p>
                <button
                  className="btn btn-outline"
                  onClick={() => { setCategory("All"); setQuery(""); }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map(r => (
                <Link className="map-report" key={r.id} to={`/incident/${r.id}`}>
                  <span className="map-report-dot" />
                  <div className="map-report-info">
                    <strong>{r.place}</strong>
                    <div className="map-report-meta">
                      <span className="badge badge-category">{r.category}</span>
                      <span className={`badge ${getSignalBadgeClass(r.signal)}`}>{r.signal}</span>
                    </div>
                    <small>{r.confirmations} community confirmations</small>
                  </div>
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* Map View */}
        <div className={`map-view ${mobileTab === "map" ? "mobile-show" : "mobile-hide"}`}>
          <MapContainer
            center={[18.5204, 73.8567]}
            zoom={13}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered
              .filter(r => r.lat && r.lng)
              .map(r => (
                <CircleMarker
                  key={r.id}
                  center={[r.lat, r.lng]}
                  radius={11}
                  pathOptions={{
                    color: "#6c2f41",
                    fillColor: r.signal === "Elevated concern" ? "#c83e4d" : "#6c2f41",
                    fillOpacity: 0.75,
                    weight: 2
                  }}
                >
                  <Popup className="sheq-map-popup">
                    <div className="popup-inner">
                      <span className="badge badge-category">{r.category}</span>
                      <strong>{r.place}</strong>
                      <p>{r.description}</p>
                      <div className="popup-meta">
                        <span className={`badge ${getSignalBadgeClass(r.signal)}`}>{r.signal}</span>
                        <small>{r.confirmations} confirmations</small>
                      </div>
                      <Link to={`/incident/${r.id}`} className="popup-link">
                        View report details →
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>

          <div className="map-legend">
            <span>
              <i className="legend-dot elevated" /> Elevated concern
            </span>
            <span>
              <i className="legend-dot standard" /> Community signal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
