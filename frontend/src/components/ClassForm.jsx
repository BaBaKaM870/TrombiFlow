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
    <form ref={ref} onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Libellé de la classe *</label>
        <input
          className="form-input"
          placeholder="ex. 3A, M1 MIAGE…"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Année scolaire</label>
        <input
          className="form-input"
          placeholder="2025-2026"
          value={form.year}
          onChange={e => setForm({ ...form, year: e.target.value })}
        />
      </div>
      <button type="submit" style={{ display: "none" }} aria-hidden="true">submit</button>
    </form>
  );
});

export default ClassForm;
