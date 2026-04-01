import { forwardRef, useEffect, useState } from "react";

const StudentForm = forwardRef(function StudentForm({ classes, initialValue, onSubmit }, ref) {
  const [form, setForm] = useState(initialValue || { firstName: "", lastName: "", email: "", classId: "" });

  useEffect(() => {
    setForm(initialValue || { firstName: "", lastName: "", email: "", classId: "" });
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) return;
    onSubmit(form);
  };

  return (
    <form ref={ref} onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Prénom *</label>
          <input
            className="form-input"
            placeholder="Marie"
            value={form.firstName}
            onChange={e => setForm({ ...form, firstName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Nom *</label>
          <input
            className="form-input"
            placeholder="Dupont"
            value={form.lastName}
            onChange={e => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email *</label>
        <input
          className="form-input"
          type="email"
          placeholder="marie.dupont@etudiant.fr"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Classe</label>
        <select
          className="form-input filter-select"
          style={{ width: "100%" }}
          value={form.classId}
          onChange={e => setForm({ ...form, classId: e.target.value })}
        >
          <option value="">Sélectionner une classe</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.label} ({c.year})</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Photo (optionnel)</label>
        <div className="upload-zone">
          <div className="upload-icon">📷</div>
          <p className="upload-text">Glissez une photo ou <strong>parcourez</strong></p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>JPEG / PNG · max 5 MB</p>
        </div>
      </div>
      <button type="submit" style={{ display: "none" }} aria-hidden="true">submit</button>
    </form>
  );
});

export default StudentForm;
