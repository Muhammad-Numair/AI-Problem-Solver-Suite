export default function StatCard({ label, value, color = '#58A6FF' }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
    </div>
  )
}
