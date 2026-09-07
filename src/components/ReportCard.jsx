import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";

export default function ReportCard({ report }) {
  return (
    <Link to={`/incident/${report.id}`} className="report-card">
      <div className="report-card-top">
        <span className="category-pill">{report.category}</span>
        <span className="signal-text">{report.signal}</span>
      </div>
      <h3>{report.place}</h3>
      <p>{report.description}</p>
      <div className="report-meta">
        <span><Clock3 size={14}/> {report.date} · {report.time}</span>
        <span><CheckCircle2 size={14}/> {report.confirmations} confirmations</span>
      </div>
      <div className="report-arrow"><ArrowUpRight size={18}/></div>
    </Link>
  );
}
