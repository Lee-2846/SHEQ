import { useMemo, useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { Filter, Search, Map as MapIcon, ListFilter, Flame, MapPin, X, Navigation } from "lucide-react";
import { categories, SEARCH_LOCATIONS, knownLocations } from "../data/mockData";
import { getSignalBadgeClass, getStatusBadgeClass } from "../utils/badgeHelpers";
import { useData } from "../context/DataContext";

// Helper component inside MapContainer to pan/zoom smoothly when target location changes
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
  const { reports, hotspots, infrastructureLayers, loadInfrastructureLayer } = useData();
  const [category, setCategory] = useState("All");
  const [filterSource, setFilterSource] = useState("all"); // "all" | "live" | "demo"
  const [query, setQuery] = useState("");
  const [mobileTab, setMobileTab] = useState("map"); // "map" | "list"
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Default: Mumbai, India
  const [mapZoom, setMapZoom] = useState(13);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPoliceStations, setShowPoliceStations] = useState(false);
  const [showBusStops, setShowBusStops] = useState(false);
  const [showStreetlights, setShowStreetlights] = useState(false);
  const [layerLoading, setLayerLoading] = useState("");
  const searchContainerRef = useRef(null);

  async function togglePoliceStations() {
    if (!showPoliceStations && !infrastructureLayers?.policeStations) {
      setLayerLoading("policeStations");
      await loadInfrastructureLayer("policeStations");
      setLayerLoading("");
    }
    setShowPoliceStations(prev => !prev);
  }

  async function toggleBusStops() {
    if (!showBusStops && !infrastructureLayers?.busStops) {
      setLayerLoading("busStops");
      await loadInfrastructureLayer("busStops");
      setLayerLoading("");
    }
    setShowBusStops(prev => !prev);
  }

  async function toggleStreetlights() {
    if (!showStreetlights && !infrastructureLayers?.streetlights) {
      setLayerLoading("streetlights");
      await loadInfrastructureLayer("streetlights");
      setLayerLoading("");
    }
    setShowStreetlights(prev => !prev);
  }

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter reports by category, source type, and text search
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesCategory = category === "All" || r.category === category;
      const matchesSource =
        filterSource === "all" ||
        (filterSource === "live" && r.isLive) ||
        (filterSource === "demo" && r.isDemo);
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (r.place && r.place.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q));
      return matchesCategory && matchesSource && matchesQuery;
    });
  }, [reports, category, filterSource, query]);

  // Dynamic location suggestions matching query
  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const matches = [];

    // 1. Search in SEARCH_LOCATIONS
    SEARCH_LOCATIONS.forEach(loc => {
      if (
        loc.name.toLowerCase().includes(q) ||
        loc.keywords.some(k => k.includes(q))
      ) {
        matches.push({
          type: "location",
          label: `${loc.name}, ${loc.city}`,
          center: loc.center,
          zoom: loc.zoom
        });
      }
    });

    // 2. Search in known reports
    reports.forEach(r => {
      if (
        r.place &&
        r.place.toLowerCase().includes(q) &&
        !matches.some(m => m.label.toLowerCase().includes(r.place.toLowerCase()))
      ) {
        matches.push({
          type: "report",
          label: `${r.place} (${r.category})`,
          center: [r.lat, r.lng],
          zoom: 15,
          reportId: r.id
        });
      }
    });

    return matches.slice(0, 5);
  }, [query, reports]);

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

  // Location resolution function that functionally moves the map
  function moveToLocation(targetLocation) {
    if (!targetLocation) return;

    if (targetLocation.center) {
      setMapCenter(targetLocation.center);
      setMapZoom(targetLocation.zoom || 15);
    }
    if (targetLocation.reportId) {
      setSelectedReportId(targetLocation.reportId);
    }

    setShowSuggestions(false);

    // On mobile screens, auto-switch to map view to display movement
    if (window.innerWidth <= 900) {
      setMobileTab("map");
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = query.toLowerCase().trim();
    if (!q) return;

    // 1. Check exact or keyword match in SEARCH_LOCATIONS
    const foundLoc = SEARCH_LOCATIONS.find(
      loc =>
        loc.name.toLowerCase() === q ||
        loc.keywords.some(k => k === q) ||
        loc.name.toLowerCase().includes(q) ||
        loc.keywords.some(k => k.includes(q))
    );

    if (foundLoc) {
      moveToLocation(foundLoc);
      return;
    }

    // 2. Check knownLocations list
    const foundKnown = knownLocations.find(
      l => l.place.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
    );
    if (foundKnown && foundKnown.lat && foundKnown.lng) {
      moveToLocation({ center: [foundKnown.lat, foundKnown.lng], zoom: 15 });
      return;
    }

    // 3. Check reports
    const matchedReport = reports.find(
      r =>
        (r.place && r.place.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
    if (matchedReport && matchedReport.lat && matchedReport.lng) {
      handleSelectReport(matchedReport);
      return;
    }

    // 4. Check hotspots
    const matchedHotspot = hotspots.find(
      h => h.place && h.place.toLowerCase().includes(q)
    );
    if (matchedHotspot && matchedHotspot.lat && matchedHotspot.lng) {
      moveToLocation({ center: [matchedHotspot.lat, matchedHotspot.lng], zoom: 15 });
    }
  }

  // Quick area chips for popular neighborhoods
  const quickAreas = [
    { label: "Bandra", center: [19.0596, 72.8295], zoom: 15 },
    { label: "Powai", center: [19.1176, 72.9060], zoom: 15 },
    { label: "Andheri", center: [19.1197, 72.8464], zoom: 15 },
    { label: "Dadar", center: [19.0178, 72.8478], zoom: 15 },
    { label: "Shivajinagar", center: [18.5308, 73.8475], zoom: 15 },
    { label: "FC Road", center: [18.5236, 73.8417], zoom: 15 },
    { label: "Swargate", center: [18.5018, 73.8636], zoom: 15 }
  ];

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

          {/* Search Box with Search-to-Map Movement & Auto-Suggestions */}
          <div className="search-box-container" ref={searchContainerRef} style={{ position: "relative" }}>
            <form onSubmit={handleSearchSubmit} className="search-box" style={{ margin: "20px 0 10px" }}>
              <Search size={17} className="text-berry" />
              <input
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search Bandra, Powai, Andheri, FC Road..."
                aria-label="Search area or location"
              />
              {query && (
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => {
                    setQuery("");
                    setShowSuggestions(false);
                  }}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
              <button type="submit" className="btn btn-berry btn-sm" style={{ padding: "6px 12px", fontSize: "12px" }}>
                Search
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions-dropdown">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="suggestion-item"
                    onClick={() => {
                      setQuery(s.label.split("(")[0].trim());
                      moveToLocation(s);
                    }}
                  >
                    <MapPin size={14} className="text-berry" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Location Chips */}
          <div style={{ marginBottom: "18px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Quick Navigation:
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
              {quickAreas.map(a => (
                <button
                  key={a.label}
                  type="button"
                  className="filter-chip"
                  style={{ fontSize: "11px", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  onClick={() => {
                    setQuery(a.label);
                    moveToLocation(a);
                  }}
                >
                  <Navigation size={10} /> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Signal Origin & Context Filter */}
          <div style={{ marginBottom: "14px" }}>
            <div className="filter-label" style={{ marginBottom: "6px" }}>
              Signal Origin & Authenticity
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`filter-chip ${filterSource === "all" ? "selected" : ""}`}
                style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={() => setFilterSource("all")}
              >
                All Signals ({reports.length})
              </button>
              <button
                type="button"
                className={`filter-chip ${filterSource === "live" ? "selected" : ""}`}
                style={{ fontSize: "11px", padding: "4px 10px", borderColor: filterSource === "live" ? "#1e7e34" : undefined }}
                onClick={() => setFilterSource("live")}
              >
                Live Reports ({reports.filter(r => r.isLive).length})
              </button>
              <button
                type="button"
                className={`filter-chip ${filterSource === "demo" ? "selected" : ""}`}
                style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={() => setFilterSource("demo")}
              >
                Curated Demo ({reports.filter(r => r.isDemo).length})
              </button>
            </div>
          </div>

          {/* Infrastructure Context Layers */}
          <div style={{ marginBottom: "16px", padding: "10px", background: "var(--ivory)", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--berry)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
              Infrastructure Context Layers (OSM)
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`filter-chip ${showPoliceStations ? "selected" : ""}`}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderColor: showPoliceStations ? "#1e40af" : "var(--line)",
                  background: showPoliceStations ? "#dbeafe" : "#fff",
                  color: showPoliceStations ? "#1e40af" : "inherit"
                }}
                onClick={togglePoliceStations}
                disabled={layerLoading === "policeStations"}
              >
                {layerLoading === "policeStations" ? "Loading..." : "Police Stations (175)"}
              </button>
              <button
                type="button"
                className={`filter-chip ${showBusStops ? "selected" : ""}`}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderColor: showBusStops ? "#065f46" : "var(--line)",
                  background: showBusStops ? "#d1fae5" : "#fff",
                  color: showBusStops ? "#065f46" : "inherit"
                }}
                onClick={toggleBusStops}
                disabled={layerLoading === "busStops"}
              >
                {layerLoading === "busStops" ? "Loading..." : "Bus Stops (163)"}
              </button>
              <button
                type="button"
                className={`filter-chip ${showStreetlights ? "selected" : ""}`}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderColor: showStreetlights ? "#b45309" : "var(--line)",
                  background: showStreetlights ? "#fef3c7" : "#fff",
                  color: showStreetlights ? "#b45309" : "inherit"
                }}
                onClick={toggleStreetlights}
                disabled={layerLoading === "streetlights"}
              >
                {layerLoading === "streetlights" ? "Loading..." : "Streetlights (673)"}
              </button>
            </div>
            <small style={{ fontSize: "10px", color: "var(--muted)", display: "block", marginTop: "4px" }}>
              Open spatial context layers — not community crime reports.
            </small>
          </div>

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
                        {r.isLive ? (
                          <span className="badge badge-status-verified" style={{ fontSize: "10px", padding: "1px 5px" }}>Live</span>
                        ) : (
                          <span className="badge" style={{ fontSize: "10px", padding: "1px 5px", background: "#f3f4f6", color: "#6b7280" }}>Demo</span>
                        )}
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
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
                          <span className="badge badge-category">{r.category}</span>
                          {r.isLive ? (
                            <span className="badge badge-status-verified" style={{ fontSize: "10px" }}>Live Report</span>
                          ) : (
                            <span className="badge" style={{ fontSize: "10px", background: "#f3f4f6", color: "#6b7280" }}>Demo Record</span>
                          )}
                        </div>
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

            {/* Render Police Stations Infrastructure Layer (175 points) */}
            {showPoliceStations && (infrastructureLayers?.policeStations || []).map((feat, idx) => {
              const coords = feat.geometry?.coordinates;
              if (!coords || coords.length < 2) return null;
              const [lng, lat] = coords;
              const name = feat.properties?.name || feat.properties?.["name:en"] || "Police Station Node";
              return (
                <CircleMarker
                  key={`ps-${idx}`}
                  center={[lat, lng]}
                  radius={7}
                  pathOptions={{
                    color: "#1e40af",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.85,
                    weight: 2
                  }}
                >
                  <Popup className="sheq-map-popup">
                    <div className="popup-inner">
                      <span className="badge" style={{ background: "#dbeafe", color: "#1e40af", fontSize: "10px", fontWeight: 700 }}>
                        POLICE INFRASTRUCTURE (OSM)
                      </span>
                      <strong style={{ display: "block", marginTop: "4px" }}>{name}</strong>
                      <small style={{ color: "var(--muted)", display: "block", margin: "4px 0" }}>
                        Location: [{lat.toFixed(4)}, {lng.toFixed(4)}]
                      </small>
                      <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 0" }}>
                        Open geospatial infrastructure node. Not a crime report or emergency dispatch endpoint.
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Render Bus Transit Stops Infrastructure Layer (163 points) */}
            {showBusStops && (infrastructureLayers?.busStops || []).map((feat, idx) => {
              const coords = feat.geometry?.coordinates;
              if (!coords || coords.length < 2) return null;
              const [lng, lat] = coords;
              const name = feat.properties?.name || feat.properties?.["name:en"] || "Bus Transit Stop";
              const op = feat.properties?.operator || "Public Transport";
              return (
                <CircleMarker
                  key={`bs-${idx}`}
                  center={[lat, lng]}
                  radius={6}
                  pathOptions={{
                    color: "#065f46",
                    fillColor: "#10b981",
                    fillOpacity: 0.85,
                    weight: 2
                  }}
                >
                  <Popup className="sheq-map-popup">
                    <div className="popup-inner">
                      <span className="badge" style={{ background: "#d1fae5", color: "#065f46", fontSize: "10px", fontWeight: 700 }}>
                        TRANSIT BUS STOP (OSM)
                      </span>
                      <strong style={{ display: "block", marginTop: "4px" }}>{name}</strong>
                      <small style={{ color: "var(--muted)", display: "block", margin: "2px 0" }}>
                        Operator: {op}
                      </small>
                      <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 0" }}>
                        Open transit access node. Provides commuter and pedestrian context.
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Render Streetlights Infrastructure Layer (673 points) */}
            {showStreetlights && (infrastructureLayers?.streetlights || []).slice(0, 350).map((feat, idx) => {
              const coords = feat.geometry?.coordinates;
              if (!coords || coords.length < 2) return null;
              const [lng, lat] = coords;
              return (
                <CircleMarker
                  key={`sl-${idx}`}
                  center={[lat, lng]}
                  radius={4}
                  pathOptions={{
                    color: "#b45309",
                    fillColor: "#f59e0b",
                    fillOpacity: 0.75,
                    weight: 1.5
                  }}
                >
                  <Popup className="sheq-map-popup">
                    <div className="popup-inner">
                      <span className="badge" style={{ background: "#fef3c7", color: "#b45309", fontSize: "10px", fontWeight: 700 }}>
                        STREETLIGHT NODE (OSM)
                      </span>
                      <small style={{ color: "var(--muted)", display: "block", margin: "4px 0" }}>
                        Location: [{lat.toFixed(4)}, {lng.toFixed(4)}]
                      </small>
                      <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 0" }}>
                        Mapped lighting infrastructure node. Does not verify bulb operational status.
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Map Legend */}
          <div className="map-legend">
            <div>
              <span className="legend-dot standard" /> Community report
            </div>
            <div>
              <span className="legend-dot elevated" /> Elevated concern
            </div>
            <div>
              <span className="legend-dot hotspot" /> SHEQ Hotspot
            </div>
            {showPoliceStations && (
              <div>
                <span className="legend-dot" style={{ background: "#3b82f6", borderColor: "#1e40af" }} /> Police Station (175)
              </div>
            )}
            {showBusStops && (
              <div>
                <span className="legend-dot" style={{ background: "#10b981", borderColor: "#065f46" }} /> Bus Stop (163)
              </div>
            )}
            {showStreetlights && (
              <div>
                <span className="legend-dot" style={{ background: "#f59e0b", borderColor: "#b45309" }} /> Streetlight (673)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
