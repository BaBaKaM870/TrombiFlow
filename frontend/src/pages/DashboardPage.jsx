import Icon from "../components/Icon";
import { CLASS_COLORS } from "../services/api";

export default function DashboardPage({ classes, students, exports: exportsLog, onDownloadExport }) {
  const stats = [
    { label: "Classes actives", value: classes.length, icon: "classes", tone: "coral", change: "+2 cette année" },
    { label: "Étudiants inscrits", value: students.length, icon: "students", tone: "blue", change: "+12 ce mois" },
    { label: "Trombinoscopes générés", value: exportsLog.length, icon: "generate", tone: "mint", change: "3 cette semaine" },
    { label: "Stockage utilisé", value: "1.2 GB", icon: "file", tone: "navy", change: "sur 10 GB" },
  ];

  const recentStudents = students.slice(-6).reverse();

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de votre établissement — Année 2025-2026</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span className="badge badge-green" style={{ padding: "6px 14px", fontSize: 12 }}>● Système opérationnel</span>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className={`stat-card stat-card-${s.tone}`} key={i} style={{ "--enter-delay": `${i * 70}ms` }}>
            <div className="stat-icon"><Icon name={s.icon} size={20} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-panels">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Répartition des classes</span>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {classes.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div className="class-color" style={{ background: CLASS_COLORS[i % CLASS_COLORS.length] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{c.count} élèves</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ "--progress": `${c.count / 40}`, background: CLASS_COLORS[i % CLASS_COLORS.length] }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Derniers ajouts</span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {recentStudents.map(s => {
              const cls = classes.find(c => c.id === s.classId);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid var(--border)" }}>
                  <img src={s.photo} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.email}</div>
                  </div>
                  <span className="badge badge-navy" style={{ fontSize: 11 }}>{cls?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Historique des exports</span>
          <Icon name="log" size={16} color="var(--muted)" />
        </div>
        <table>
          <thead>
            <tr>
              <th>Classe</th><th>Format</th><th>Généré par</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exportsLog.map(e => (
              <tr key={e.id}>
                <td><span className="badge badge-navy">{e.class}</span></td>
                <td>
                  <span className={`badge ${e.format === "PDF" ? "badge-coral" : "badge-blue"}`}>{e.format}</span>
                </td>
                <td style={{ color: "var(--muted)", fontSize: 12 }}>{e.by}</td>
                <td style={{ color: "var(--muted)", fontSize: 12 }}>{e.date}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={!e.filePath}
                    onClick={() => onDownloadExport?.(e)}
                  >
                    <Icon name="download" size={13} /> Télécharger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
