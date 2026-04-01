import { STATS } from '../data/Stats'

export default function StatsGrid() {
  return (
    <div className="stats-grid">
      {STATS.map((s, i) => (
        <div className="stat-card" key={i}>
          <div className="stat-blob" style={{ background: s.blob }} />
          <div className="stat-icon" style={{ background: s.iconBg }}>
            {s.icon}
          </div>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
          <div className="stat-delta">{s.delta}</div>
        </div>
      ))}
    </div>
  )
}