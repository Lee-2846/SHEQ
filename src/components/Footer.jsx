import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-mark"><ShieldCheck size={18}/></span><span>SHEQ</span></div>
          <p className="muted footer-copy">A community-driven safety network turning shared experiences into useful safety signals.</p>
        </div>
        <div><p className="footer-title">Explore</p><Link to="/map">Safety Map</Link><Link to="/about">How it works</Link><Link to="/report">Report</Link></div>
        <div><p className="footer-title">Safety</p><Link to="/sos">SOS</Link><Link to="/alerts">Alerts</Link><Link to="/insights">Insights</Link></div>
      </div>
      <div className="container footer-bottom">© 2026 SHEQ · Community information should be used as context, not a guarantee of safety.</div>
    </footer>
  );
}
