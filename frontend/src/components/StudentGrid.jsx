import Icon from "./Icon";

export default function StudentGrid({ students, classes, view, onDelete }) {
  if (view === "grid") {
    return (
      <div className="students-grid">
        {students.map(s => {
          const cls = classes.find(c => c.id === s.classId);
          return (
            <div className="student-card" key={s.id}>
              <img className="student-photo" src={s.photo} alt={s.firstName} />
              <div className="student-name">{s.firstName}<br />{s.lastName}</div>
              <div className="student-class">{cls?.label || "—"}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => onDelete(s.id)}><Icon name="trash" size={12} /></button>
              </div>
            </div>
          );
        })}
        {students.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-icon">🔍</div>
            <p className="empty-text">Aucun étudiant trouvé</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr><th>Photo</th><th>Nom</th><th>Email</th><th>Classe</th><th>Inscrit le</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {students.map(s => {
          const cls = classes.find(c => c.id === s.classId);
          return (
            <tr key={s.id}>
              <td><img src={s.photo} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /></td>
              <td style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
              <td style={{ color: "var(--muted)", fontSize: 12 }}>{s.email}</td>
              <td><span className="badge badge-navy">{cls?.label}</span></td>
              <td style={{ color: "var(--muted)", fontSize: 12 }}>{s.createdAt}</td>
              <td>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-secondary btn-sm"><Icon name="upload" size={12} /> Photo</button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(s.id)}><Icon name="trash" size={12} /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
