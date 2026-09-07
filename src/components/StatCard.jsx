export default function StatCard({ icon: Icon, value, label, note }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={20}/></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}
