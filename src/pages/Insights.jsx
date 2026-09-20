import { BarChart3, Clock3, MapPinned, TrendingUp } from "lucide-react";
import { useData } from "../context/DataContext";

export default function Insights() {
  const { reports, hotspots } = useData();

  const counts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const values = Object.values(counts);
  const max = values.length > 0 ? Math.max(...values) : 1;

  // Distinct places count
  const distinctPlacesCount = new Set(reports.map(r => r.place)).size;

  return (
    <div className="container page-container">
      <div className="dashboard-head">
        <div>
          <div className="eyebrow">SAFETY INSIGHTS</div>
          <h1>Patterns worth paying attention to.</h1>
          <p>Aggregated community signals can show where and when concerns are appearing.</p>
        </div>
      </div>

      <div className="insight-cards">
        <div className="insight-card">
          <MapPinned />
          <span>{distinctPlacesCount}</span>
          <p>areas with active community signals</p>
        </div>
        <div className="insight-card">
          <TrendingUp />
          <span>{hotspots.filter(h => h.active).length}</span>
          <p>active designated SHEQ hotspots</p>
        </div>
        <div className="insight-card">
          <Clock3 />
          <span>8–10 PM</span>
          <p>highest community reporting window</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="eyebrow">REPORTS BY CATEGORY</div>
          <h3>What people are reporting</h3>
          <div className="bars">
            {Object.entries(counts).map(([k, v]) => (
              <div className="bar-row" key={k}>
                <div className="bar-label">
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(v / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card insight-note">
          <BarChart3 />
          <div className="eyebrow">READING THE SIGNAL</div>
          <h3>Context over certainty.</h3>
          <p>
            Insights summarize community reports. They are not a guarantee that an area is safe or unsafe, and patterns
            can change over time as local authorities and communities take action.
          </p>
        </div>
      </div>
    </div>
  );
}
