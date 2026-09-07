import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Flag, Users } from "lucide-react";

export default function IncidentDetails({reports,setReports}) {
  const {id}=useParams();
  const report=reports.find(r=>String(r.id)===String(id));
  const [confirmed,setConfirmed]=useState(false);
  if(!report) return <div className="container page-container"><h1>Report not found.</h1><Link to="/map">Back to map</Link></div>;
  function confirm(){if(confirmed)return;setConfirmed(true);setReports(prev=>prev.map(r=>r.id===report.id?{...r,confirmations:r.confirmations+1}:r))}
  return <div className="container page-container narrow"><Link to="/map" className="back-link"><ArrowLeft size={16}/> Back to map</Link><div className="incident-head"><span className="category-pill">{report.category}</span><span className="signal-badge">{report.signal}</span><h1>{report.place}</h1><p>{report.city} · {report.date} · {report.time}</p></div><div className="incident-grid"><main><div className="detail-card"><div className="eyebrow">WHAT WAS REPORTED</div><p className="detail-copy">{report.description}</p></div><div className="detail-card"><div className="eyebrow">COMMUNITY CHECK</div><div className="verification-row"><div className="verification-big">{report.confirmations + (confirmed?1:0)}</div><div><strong>People confirmed this report</strong><p>Community confirmation adds context; it does not mean the report has been independently proven.</p></div></div><div className="verification-actions"><button onClick={confirm} className="btn btn-berry"><CheckCircle2 size={17}/> {confirmed?"Confirmed":"I experienced / observed this too"}</button><button className="btn btn-outline"><Flag size={16}/> Dispute / add context</button></div></div></main><aside><div className="detail-card signal-card-small"><Users/><div className="eyebrow">STATUS</div><h3>{report.status}</h3><p>This report is part of SHEQ's community review flow.</p></div></aside></div></div>
}
