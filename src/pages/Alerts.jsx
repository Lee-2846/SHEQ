import { Bell, CheckCircle2, Info } from "lucide-react";
import { useData } from "../context/DataContext";

export default function Alerts() {
  const { alerts } = useData();

  return (
    <div className="container page-container">
      <div className="dashboard-head">
        <div>
          <div className="eyebrow">ALERTS & UPDATES</div>
          <h1>Stay informed, not overwhelmed.</h1>
          <p>Useful changes and community signals from areas you care about.</p>
        </div>
      </div>
      <div className="alerts-list">
        {alerts.map(a => (
          <div className="alert-card" key={a.id}>
            <div className="alert-icon">
              {a.level === "Resolved" ? <CheckCircle2 /> : a.level === "Awareness" ? <Info /> : <Bell />}
            </div>
            <div>
              <div className="alert-top">
                <span>{a.level}</span>
                <small>{a.time}</small>
              </div>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
