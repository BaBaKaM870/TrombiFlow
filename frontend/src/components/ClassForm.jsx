import { forwardRef, useEffect, useState } from "react";

const ClassForm = forwardRef(function ClassForm({ initialValue, onSubmit }, ref) {
  const [form, setForm] = useState(initialValue || { label: "", year: "2025-2026" });

  useEffect(() => {
    setForm(initialValue || { label: "", year: "2025-2026" });
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    onSubmit(form);
  };

  return (
    <form ref={ref} className="class-form" onSubmit={handleSubmit}>
      <div className="class-form-hero">
        <div className="class-form-mark">{form.label?.slice(0, 2)?.toUpperCase() || "CL"}</div>
        <div>
          <div className="class-form-kicker">Classe</div>
          <div className="class-form-title">{form.label || "Nouvelle classe"}</div>
          <div className="class-form-subtitle">{form.year || "Annee scolaire non renseignee"}</div>
        </div>
      </div>

      <div className="class-form-grid">
        <div className="form-group">
          <label className="form-label">Libelle de la classe *</label>
          <input
            className="form-input"
            placeholder="ex. 3A, M1 MIAGE..."
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Annee scolaire</label>
          <input
            className="form-input"
            placeholder="2025-2026"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </div>
      </div>

      <button type="submit" style={{ display: "none" }} aria-hidden="true">submit</button>
    </form>
  );
});

export default ClassForm;
