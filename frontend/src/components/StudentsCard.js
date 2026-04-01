import { STUDENTS } from '../data/Students'

export default function StudentsCard() {
  return (
    <div className="card">
      <div className="card-title">Derniers ajouts</div>
      {STUDENTS.map((s, i) => (
        <div className="student-item" key={i}>
          <div className="student-avatar">{s.initials}</div>
          <div className="student-info">
            <div className="student-name">{s.name}</div>
            <div className="student-email">{s.email}</div>
          </div>
          <div className="student-class">{s.classe}</div>
        </div>
      ))}
    </div>
  )
}