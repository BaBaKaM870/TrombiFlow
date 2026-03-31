import { useState } from "react";
import Icon from "./Icon";
import { CLASS_COLORS } from "../services/api";

export default function TrombiGenerator({ classes, students, setExports, toast }) {
  const [selClass, setSelClass] = useState(null);
  const [selFormat, setSelFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(null);

  const classStudents = selClass ? students.filter(s => s.classId === selClass.id) : [];

  const generate = () => {
    if (!selClass) return;
    setGenerating(true); setProgress(0); setGenerated(null);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18;
      if (p >= 100) {
        p = 100; clearInterval(iv);
        setTimeout(() => {
          setGenerating(false);
          const url = `trombi_${selClass.label}_2025-2026.${selFormat}`;
          setGenerated(url);
          setExports(ex => [{ id: Date.now(), class: selClass.label, format: selFormat.toUpperCase(), by: "admin@ecole.fr", date: new Date().toLocaleString("fr-FR") }, ...ex]);
          toast(`Trombinoscope ${selFormat.toUpperCase()} généré ✓`);
        }, 400);
      }
      setProgress(Math.min(p, 100));
    }, 180);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 24 }}>
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">1. Choisir la classe</span></div>
          <div style={{ padding: "12px 16px" }}>
            {classes.map((c, i) => (
              <div key={c.id} onClick={() => setSelClass(c)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                cursor: "pointer", marginBottom: 6, border: `2px solid ${selClass?.id === c.id ? "var(--coral)" : "var(--border)"}`,
                background: selClass?.id === c.id ? "#fff5f3" : "white", transition: "all 0.15s"
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: CLASS_COLORS[i % CLASS_COLORS.length], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{students.filter(s => s.classId === c.id).length || c.count} étudiants · {c.year}</div>
                </div>
                {selClass?.id === c.id && <Icon name="check" size={16} />}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">2. Format d'export</span></div>
          <div style={{ padding: 16 }}>
            <div className="generate-options">
              {[
                { id: "pdf", icon: "📄", title: "PDF", desc: "A4 portrait · Grille 5×6 · Impression" },
                { id: "html", icon: "🌐", title: "HTML", desc: "Responsive · Partage en ligne · Interactif" },
              ].map(f => (
                <div key={f.id} className={`format-card ${selFormat === f.id ? "selected" : ""}`} onClick={() => setSelFormat(f.id)}>
                  <div className="format-icon">{f.icon}</div>
                  <div className="format-title">{f.title}</div>
                  <div className="format-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Aperçu</span>
            {selClass && <span className="badge badge-coral" style={{ marginLeft: 8 }}>{selClass.label}</span>}
          </div>
          {selClass && classStudents.length > 0 ? (
            <div>
              <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>
                    Trombinoscope – Classe {selClass.label} (2025-2026)
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {classStudents.length} photo{classStudents.length > 1 ? "s" : ""} · Format {selFormat.toUpperCase()}
                  </div>
                </div>
                <span style={{ fontSize: 20 }}>🏫</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, padding: "16px 20px" }}>
                {classStudents.slice(0, 15).map(s => (
                  <div key={s.id} className="trombi-tile">
                    <img src={s.photo} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, display: "block", marginBottom: 4 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.firstName}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.lastName}</div>
                  </div>
                ))}
                {classStudents.length > 15 && (
                  <div className="trombi-tile" style={{ background: "var(--cream2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>+{classStudents.length - 15}</span>
                  </div>
                )}
              </div>
              <div style={{ padding: "8px 20px 16px", borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>
                🔒 Données personnelles conformes RGPD – Utilisation interne à l'établissement uniquement
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🖼️</div>
              <p className="empty-text">Sélectionnez une classe pour voir l'aperçu</p>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ padding: 24 }}>
            {generating ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Génération en cours…</div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{Math.round(progress)}%</div>
              </div>
            ) : generated ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Trombinoscope prêt !</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{generated}</div>
                <button className="btn btn-primary" style={{ width: "100%" }}>
                  <Icon name="download" /> Télécharger le {selFormat.toUpperCase()}
                </button>
                <button className="btn btn-secondary" style={{ width: "100%", marginTop: 8 }} onClick={() => setGenerated(null)}>
                  Générer un autre
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, opacity: selClass ? 1 : 0.5 }}
                onClick={generate} disabled={!selClass}>
                <Icon name="generate" /> Générer le trombinoscope {selClass ? `— ${selClass.label}` : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
