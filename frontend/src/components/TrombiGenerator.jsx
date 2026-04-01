import { useState } from "react";
import Icon from "./Icon";
import { CLASS_COLORS } from "../services/api";
import { jsPDF } from "jspdf";

export default function TrombiGenerator({ classes, students, setExports, toast }) {
  const [selClass, setSelClass] = useState(null);
  const [selFormat, setSelFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [generatedFormat, setGeneratedFormat] = useState(null);

  const classStudents = selClass ? students.filter(s => s.classId === selClass.id) : [];

  const downloadGenerated = async () => {
    if (!generated || !selClass || !generatedFormat) return;
    const title = `Trombinoscope – Classe ${selClass.label} (2025-2026)`;

    const toDataUrl = async (url) => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    };

    if (generatedFormat === "pdf") {
      try {
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const margin = 12;
        const pageWidth = 210;
        const pageHeight = 297;
        const gutter = 8;
        const colWidth = (pageWidth - margin * 2 - gutter) / 2;
        const rowHeight = 60;
        let x = margin;
        let y = margin;

        const studentsForPdf = [...classStudents].sort((a, b) => a.lastName.localeCompare(b.lastName));

        doc.setFontSize(16);
        doc.text(title, margin, y);
        y += 10;

        for (const student of studentsForPdf) {
          if (y + rowHeight > pageHeight - margin) {
            doc.addPage();
            x = margin;
            y = margin;
          }

          // Card background
          doc.setDrawColor(230, 230, 230);
          doc.setFillColor(248, 248, 248);
          doc.roundedRect(x, y, colWidth, rowHeight, 2, 2, "FD");

          // Photo
          const photoData = await toDataUrl(student.photo);
          if (photoData) {
            try {
              doc.addImage(photoData, "JPEG", x + 4, y + 4, 24, 24, undefined, "FAST");
            } catch (e) {
              // ignore image errors, continue with text
            }
          }

          // Text block
          const textX = x + 32;
          const textY = y + 8;
          doc.setFontSize(12);
          doc.setTextColor(20, 20, 20);
          doc.text(`${student.firstName} ${student.lastName}`, textX, textY);

          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(student.email, textX, textY + 6);
          doc.text(`Classe: ${selClass.label}`, textX, textY + 12);

          // Footer line
          doc.setDrawColor(230, 230, 230);
          doc.line(x + 4, y + rowHeight - 10, x + colWidth - 4, y + rowHeight - 10);

          // Stats
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          doc.text(`Ajouté: ${student.createdAt || "–"}`, x + 4, y + rowHeight - 4);

          // Move to next column/row
          if (x + colWidth + gutter + colWidth <= pageWidth - margin) {
            x += colWidth + gutter;
          } else {
            x = margin;
            y += rowHeight + 6;
          }
        }

        doc.save(generated);
      } catch (err) {
        console.error("PDF generation failed", err);
        toast("Impossible de générer le PDF");
      }
      return;
    }

    // HTML export (plus lisible)
    const studentsHtml = classStudents
      .map((s, idx) => `<tr><td>${idx + 1}</td><td>${s.firstName}</td><td>${s.lastName}</td><td>${s.email}</td><td><img src="${s.photo}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;"/></td></tr>`) 
      .join("");

    const htmlContent = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
      body{font-family:Arial,sans-serif;padding:24px;background:#f7f7f7;color:#222;}
      h1{margin:0 0 16px;font-size:20px;color:#1f2a44;}
      table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e3e3e3;}
      th,td{padding:10px;border-bottom:1px solid #eee;font-size:12px;text-align:left;}
      th{background:#fafafa;font-weight:700;color:#444;}
      tr:last-child td{border-bottom:none;}
    </style></head><body>
      <h1>${title}</h1>
      <table>
        <thead><tr><th>#</th><th>Prénom</th><th>Nom</th><th>Email</th><th>Photo</th></tr></thead>
        <tbody>${studentsHtml}</tbody>
      </table>
    </body></html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generated;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generate = () => {
    if (!selClass) return;
    setGenerating(true);
    setProgress(0);
    setGenerated(null);
    setGeneratedFormat(null);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18;
      if (p >= 100) {
        p = 100; clearInterval(iv);
        setTimeout(() => {
          setGenerating(false);
          const url = `trombi_${selClass.label}_2025-2026.${selFormat}`;
          setGenerated(url);
          setGeneratedFormat(selFormat);
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
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={downloadGenerated}>
                  <Icon name="download" /> Télécharger le {(generatedFormat || selFormat).toUpperCase()}
                </button>
                <button className="btn btn-secondary" style={{ width: "100%", marginTop: 8 }} onClick={() => { setGenerated(null); setGeneratedFormat(null); }}>
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
