import { useEffect, useState } from "react";
import Icon from "./Icon";
import { CLASS_COLORS } from "../services/api";
import { generateTrombi } from "../services/clientAPI";

export default function TrombiGenerator({ classes, students, onGenerateTrombi, toast }) {
  const [selClass, setSelClass] = useState(null);
  const [selFormat, setSelFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [generatedFormat, setGeneratedFormat] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState(null);

  const classStudents = selClass ? students.filter(s => s.classId === selClass.id) : [];

  useEffect(() => {
    return () => {
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [generatedUrl]);

  const resetGeneratedFile = () => {
    if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    setGenerated(null);
    setGeneratedFormat(null);
    setGeneratedUrl(null);
  };

  const downloadGenerated = () => {
    if (!generated || !generatedUrl) return;
    const link = document.createElement("a");
    link.href = generatedUrl;
    link.download = generated;
    link.click();
  };

  const generate = () => {
    if (!selClass) return;

    resetGeneratedFile();
    setGenerating(true);
    setProgress(0);

    let currentProgress = 0;
    const intervalId = setInterval(() => {
      currentProgress = Math.min(currentProgress + Math.random() * 18, 96);
      setProgress(currentProgress);
    }, 180);

    (async () => {
      try {
        const response = onGenerateTrombi
          ? await onGenerateTrombi(selClass.id, selFormat)
          : await generateTrombi(selClass.id, selFormat);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const filename = `trombi-${selClass.label}.${selFormat === "pdf" ? "pdf" : "html"}`;

        setGenerated(filename);
        setGeneratedFormat(selFormat);
        setGeneratedUrl(downloadUrl);
        setProgress(100);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        link.click();
        toast(`Trombinoscope ${selFormat.toUpperCase()} genere`);
      } catch (error) {
        toast(error.message || "Impossible de generer le trombinoscope", "error");
      } finally {
        clearInterval(intervalId);
        setGenerating(false);
      }
    })();
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
                background: selClass?.id === c.id ? "#fff5f3" : "white",
                transition: "transform var(--motion-fast) var(--ease-out-quick), box-shadow var(--motion-fast) var(--ease-out-quick), border-color var(--motion-fast) var(--ease-out-quick), background var(--motion-fast) var(--ease-out-quick)",
                transform: "translateZ(0)"
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: CLASS_COLORS[i % CLASS_COLORS.length], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{students.filter(s => s.classId === c.id).length || c.count} etudiants - {c.year}</div>
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
                { id: "pdf", icon: "PDF", title: "PDF", desc: "A4 portrait - impression" },
                { id: "html", icon: "HTML", title: "HTML", desc: "Page partageable - navigateur" },
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
          <div className="card-header"><span className="card-title">Apercu</span>
            {selClass && <span className="badge badge-coral" style={{ marginLeft: 8 }}>{selClass.label}</span>}
          </div>
          {selClass && classStudents.length > 0 ? (
            <div>
              <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>
                    Trombinoscope - Classe {selClass.label} ({selClass.year || "annee en cours"})
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {classStudents.length} photo{classStudents.length > 1 ? "s" : ""} - Format {selFormat.toUpperCase()}
                  </div>
                </div>
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
                Donnees personnelles conformes RGPD - Utilisation interne uniquement
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">Apercu</div>
              <p className="empty-text">Selectionnez une classe pour voir l'apercu</p>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ padding: 24 }}>
            {generating ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Generation en cours...</div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ "--progress": `${progress / 100}` }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{Math.round(progress)}%</div>
              </div>
            ) : generated ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Trombinoscope pret</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{generated}</div>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={downloadGenerated}>
                  <Icon name="download" /> Telecharger le {(generatedFormat || selFormat).toUpperCase()}
                </button>
                <button className="btn btn-secondary" style={{ width: "100%", marginTop: 8 }} onClick={resetGeneratedFile}>
                  Generer un autre
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, opacity: selClass ? 1 : 0.5 }}
                onClick={generate} disabled={!selClass || classStudents.length === 0}>
                <Icon name="generate" /> Generer le trombinoscope {selClass ? `- ${selClass.label}` : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
