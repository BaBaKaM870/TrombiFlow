export default function CsvImport({ csvResult }) {
  return (
    <div>
      <div style={{ background: "var(--cream)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>
        first_name,last_name,email,class_label,year,photo_url?
      </div>
      <div className="upload-zone" style={{ marginBottom: 16 }}>
        <div className="upload-icon">📄</div>
        <p className="upload-text">Déposez votre fichier <strong>CSV</strong> ici</p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Format attendu ci-dessus</p>
      </div>
      {csvResult && (
        <div className="import-summary">
          <div className="import-stat">
            <div className="import-stat-val" style={{ color: "#27ae60" }}>{csvResult.created}</div>
            <div className="import-stat-label">✓ Créés</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div className="import-stat">
            <div className="import-stat-val" style={{ color: csvResult.errors ? "#e74c3c" : "#27ae60" }}>{csvResult.errors}</div>
            <div className="import-stat-label">✗ Erreurs</div>
          </div>
          <div style={{ flex: 1, alignSelf: "center", fontSize: 12, color: "var(--muted)" }}>
            {csvResult.errors > 0 ? `${csvResult.errors} ligne(s) ignorée(s) (email invalide ou classe introuvable)` : "Import réussi sans erreur 🎉"}
          </div>
        </div>
      )}
    </div>
  );
}
