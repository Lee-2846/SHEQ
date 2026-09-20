import { Link } from "react-router-dom";
import sheqLogo from "../assets/sheq-logo.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" to="/">
            <img src={sheqLogo} alt="SHEQ" className="brand-logo-img" style={{ width: "36px", height: "36px", minWidth: "36px", minHeight: "36px" }} />
            <span className="brand-wordmark">SHEQ</span>
          </Link>
          <p className="muted footer-copy">
            A community-driven safety network turning shared experiences into useful safety signals.
          </p>
        </div>
        <div>
          <p className="footer-title">Explore</p>
          <Link to="/map">Safety Map</Link>
          <Link to="/about">How it works</Link>
          <Link to="/report">Report</Link>
        </div>
        <div>
          <p className="footer-title">Safety</p>
          <Link to="/sos">SOS</Link>
          <Link to="/alerts">Alerts</Link>
          <Link to="/insights">Insights</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        © 2026 SHEQ · Community information should be used as context, not a guarantee of safety.
      </div>
    </footer>
  );
}
