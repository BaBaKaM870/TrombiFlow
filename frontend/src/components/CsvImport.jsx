import Icon from "./Icon";

export default function CsvImport({ csvResult, selectedFileName, onFileChange }) {
  return (
    <div className="csv-import">
      <div className="csv-import-hero">
        <div className="csv-import-mark">
          <Icon name="upload" size={26} />
        </div>
        <div>
          <div className="csv-import-kicker">Import en masse</div>
          <div className="csv-import-title">Ajouter des etudiants depuis un CSV</div>
          <div className="csv-import-subtitle">Le fichier doit contenir les colonnes attendues avant l'import.</div>
        </div>
      </div>

      <div className="csv-import-content">
        <div className="csv-format-card">
          <div className="csv-format-label">Format attendu</div>
          <div className="csv-format-examples">
            <code>first_name,last_name,email,class_label,year,photo_url?</code>
            <code>first_name;last_name;email;class_label;year;photo_url?</code>
          </div>
        </div>

        <div className="upload-zone csv-upload-zone">
          <div className="upload-icon">CSV</div>
          <p className="upload-text">Deposez votre fichier <strong>CSV</strong> ici</p>
          <p className="csv-upload-hint">Extensions acceptees : .csv ou text/csv</p>
          <input className="form-input" type="file" accept=".csv,text/csv" onChange={onFileChange} />
          {selectedFileName && <p className="csv-selected-file">Fichier selectionne : {selectedFileName}</p>}
        </div>
      </div>

      {csvResult && (
        <div className="import-summary">
          <div className="import-stat">
            <div className="import-stat-val import-stat-success">{csvResult.created}</div>
            <div className="import-stat-label">Crees</div>
          </div>
          <div className="import-summary-separator" />
          <div className="import-stat">
            <div className={`import-stat-val ${csvResult.errors ? "import-stat-error" : "import-stat-success"}`}>{csvResult.errors}</div>
            <div className="import-stat-label">Erreurs</div>
          </div>
          <div className="import-summary-text">
            {csvResult.errors > 0 ? `${csvResult.errors} ligne(s) ignoree(s) (email invalide ou classe introuvable)` : "Import reussi sans erreur"}
          </div>
        </div>
      )}
    </div>
  );
}
