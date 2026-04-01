import { CLASSES } from '../data/Classes'

export default function ClassesCard() {
  return (
    <div className="card">
      <div className="card-title">Répartition des classes</div>
      {CLASSES.map((c, i) => (
        <div className="class-item" key={i}>
          <div className="class-row">
            <span>{c.name}</span>
            <span>{c.count} élèves</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(c.count / c.max) * 100}%`,
                background: c.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}