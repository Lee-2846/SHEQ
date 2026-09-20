import { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { Filter, Search, Map as MapIcon, ListFilter, Flame } from "lucide-react";
import { categories } from "../data/mockData";
import { getSignalBadgeClass, getStatusBadgeClass } from "../utils/badgeHelpers";
import { useData } from "../context/DataContext";

// Helper component inside MapContainer to pan/zoom when target location changes
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function SafetyMap() {
  const { reports, hotspots } = useData();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [mobileTab, setMobileTab] = useState("map"); // "map" | "list"
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]);
  const [mapZoom, setMapZoom] = useState(13);

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesCategory = category === "All" || r.category === category;
      const q = query.toLowerCase();
      const matchesQuery =
        !query.trim() ||
        (r.place && r.place.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [reports, category, query]);

  function handleSelectReport(r) {
    setSelectedReportId(r.id);
    if (r.lat && r.lng) {
      setMapCenter([r.lat, r.lng]);
      setMapZoom(15);
      if (window.innerWidth <= 900) {
        setMobileTab("map");
      }
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if query matches any known report place
    const matched = reports.find(
      r => r.place && r.place.toLowerCase().includes(query.toLowerCase())
    );
    if (matched && matched.lat && matched.lng) {
      handleSelectReport(matched);
    }
  }

  return (
    <div className="map-page">
      {/* Mobile view toggle */}
      <div className="map-mobile-tabs">
        <button
          type="button"
          className={`map-tab-btn ${mobileTab === "map" ? "active" : ""}`}
          onClick={() => setMobileTab("map")}
        >
          <MapIcon size={16} /> Map View
        </button>
        <button
          type="button"
          className={`map-tab-btn ${mobileTab === "list" ? "active" : ""}`}
          onClick={() => setMobileTab("list")}
        >
          <ListFilter size={16} /> Reports List ({filteredReports.length})
        </button>
      </div>

      <div className="container-fluid map-shell">
        {/* Sidebar */}
        <aside className={`map-sidebar ${mobileTab === "list" ? "mobile-show" : "mobile-hide"}`}>
          <div className="eyebrow">SAFETY SIGNALS</div>
          <h1>Community Safety Map</h1>
          <p>
            Explore community-reported observations, confirmed concerns, and active signals around your area.
          </p>

          <form onSubmit={handleSearchSubmit} className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search area, place, or category (Press Enter)"
              aria-label="Search reports"
            />
          </form>

          <div className="filter-label">
            <Filter size={15} /> Filter by category
          </div>
          <div className="category-scroll">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                className={category === c ? "filter-chip selected" : "filter-chip"}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="map-result-count">
            {filteredReports.length} active {filteredReports.length === 1 ? "signal" : "signals"}
          </div>

          <div className="map-report-list">
            {filteredReports.length === 0 ? (
              <div className="empty-state-card">
                <p>No reports match your current filter.</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setCategory("All");
                    setQuery("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredReports.map(r => {
                const isSelected = selectedReportId === r.id;
                return (
                  <div
                    key={r.id}
                    className={`map-report ${isSelected ? "map-report-selected" : ""}`}
                    onClick={() => handleSelectReport(r)}
                  >
                    <span
                      className={`map-report-dot ${r.signal === "Elevated concern" ? "dot-elevated" : ""}`}
                    />
                    <div className="map-report-info">
                      <strong>{r.place}</strong>
                      <div className="map-report-meta">
                        <span className="badge badge-category">{r.category}</span>
                        {r.signal && (
                          <span className={`badge ${getSignalBadgeClass(r.signal)}`}>
                            {r.signal}
                          </span>
                        )}
                        {r.status && (
                          <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                            {r.status}
                          </span>
                        )}
                      </div>
                      <small>
                        {r.confirmations || 0} community confirmations · {r.date}
                      </small>
                      <Link
                        to={`/incident/${r.id}`}
                        className="map-details-link"
                        onClick={e => e.stopPropagation()}
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Map View */}
        <div className={`map-view ${mobileTab === "map" ? "mobile-show" : "mobile-hide"}`}>
          <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <MapViewController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Reports */}
            {filteredReports
              .filter(r => r.lat && r.lng)
              .map(r => {
                const isSelected = selectedReportId === r.id;
                const isElevated = r.signal === "Elevated concern";

                return (
                  <CircleMarker
                    key={r.id}
                    center={[r.lat, r.lng]}
                    radius={isSelected ? 14 : 11}
                    pathOptions={{
                      color: isElevated ? "#c83e4d" : "#6c2f41",
                      fillColor: isElevated ? "#c83e4d" : "#6c2f41",
                      fillOpacity: isSelected ? 0.95 : 0.75,
                      weight: isSelected ? 3 : 2
                    }}
                    eventHandlers={{
                      click: () => setSelectedReportId(r.id)
                    }}
                  >
                    <Popup className="sheq-map-popup">
                      <div className="popup-inner">
                        <span className="badge badge-category">{r.category}</span>
                        <strong>{r.place}</strong>
                        <p>{r.description}</p>
                        <div className="popup-meta">
                          <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                            {r.status || "Submitted"}
                          </span>
                          <small>{r.confirmations || 0} confirmations</small>
                        </div>
                        <Link to={`/incident/${r.id}`} className="popup-link">
                          View report details →
                        </Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Render Designated SHEQ Hotspots */}
            {hotspots
              .filter(h => h.active && h.lat && h.lng)
              .map(h => (
                <CircleMarker
                  key={h.id}
                  center={[h.lat, h.lng]}
                  radius={18}
                  pathOptions={{
                    color: "#a35817",
                    fillColor: "#fef3e7",
                    fillOpacity: 0.45,
                    weight: 2,
                    dashArray: "4, 6"
                  }}
                >
                  <Popup className="sheq-map-popup">
                    <div className="popup-inner">
                      <span className="badge badge-signal-attention">
                        <Flame size={12} /> SHEQ Hotspot
                      </span>
                      <strong>{h.place}</strong>
                      <p>{h.reason}</p>
                      <small>Designated: {h.designatedDate}</small>
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
              <i className="legend-dot standard" /> Community report
            </span>
            <span>
              <i className="legend-dot hotspot" /> SHEQ Hotspot
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
