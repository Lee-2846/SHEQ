import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { Filter, Search, MapPin, SlidersHorizontal } from "lucide-react";
import { categories } from "../data/mockData";

export default function SafetyMap({reports}) {
  const [category,setCategory]=useState("All");
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>reports.filter(r=>(category==="All"||r.category===category)&&(r.place.toLowerCase().includes(query.toLowerCase())||r.category.toLowerCase().includes(query.toLowerCase()))),[reports,category,query]);
  return <div className="map-page"><div className="container-fluid map-shell"><aside className="map-sidebar"><div className="eyebrow">EXPLORE</div><h1>Community safety map</h1><p>See what people are reporting, confirming and discussing around Pune.</p><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search an area or report"/></div><div className="filter-label"><Filter size={15}/> Filter by category</div><div className="category-scroll">{categories.map(c=><button key={c} className={category===c?"filter-chip selected":"filter-chip"} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="map-result-count">{filtered.length} community signals</div><div className="map-report-list">{filtered.map(r=><Link className="map-report" key={r.id} to={`/incident/${r.id}`}><span className="map-report-dot"/><div><strong>{r.place}</strong><small>{r.category} · {r.confirmations} confirmations</small></div></Link>)}</div></aside><div className="map-view"><MapContainer center={[18.5204,73.8567]} zoom={13} scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{filtered.map(r=><CircleMarker key={r.id} center={[r.lat,r.lng]} radius={10} pathOptions={{color:"#6c2f41",fillColor:"#6c2f41",fillOpacity:.65}}><Popup><strong>{r.place}</strong><br/>{r.category}<br/><Link to={`/incident/${r.id}`}>View report</Link></Popup></CircleMarker>)}</MapContainer><div className="map-legend"><span><i className="legend-dot"/> Community signal</span><span><i className="legend-ring"/> Active report</span></div></div></div></div>
}
