import { forwardRef, useEffect, useState } from "react";

const EMPTY_FORM = { firstName: "", lastName: "", email: "", classId: "", photo: null };
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const StudentForm = forwardRef(function StudentForm({ classes, initialValue, onSubmit }, ref) {
  const [form, setForm] = useState(initialValue || EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initialValue ? { ...initialValue, photo: null } : EMPTY_FORM);
    setError("");
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Prenom, nom et email sont obligatoires.");
      return;
    }
    if (form.photo && !ALLOWED_PHOTO_TYPES.includes(form.photo.type)) {
      setError("La photo doit etre en JPEG, PNG ou WebP.");
      return;
    }
    if (form.photo && form.photo.size > MAX_PHOTO_SIZE) {
      setError("La photo ne doit pas depasser 5 MB.");
      return;
    }
    onSubmit(form);
  };

  const selectedClass = classes.find((cls) => cls.id === Number(form.classId));
  const initials = `${form.firstName || ""} ${form.lastName || ""}`.trim()[0]?.toUpperCase() || "E";

  return (
    <form ref={ref} className="student-form" onSubmit={handleSubmit}>
      <div className="student-form-hero">
        <div className="student-form-avatar">{initials}</div>
        <div>
          <div className="student-form-kicker">Etudiant</div>
          <div className="student-form-title">{`${form.firstName || "Prenom"} ${form.lastName || "Nom"}`}</div>
          <div className="student-form-subtitle">{form.email || "email@etudiant.fr"}</div>
          <div className="student-form-meta">
            <span className="badge badge-blue">{selectedClass?.label || "Sans classe"}</span>
            {selectedClass?.year && <span className="badge badge-navy">{selectedClass.year}</span>}
          </div>
        </div>
      </div>

      <div className="student-form-grid">
        <div className="form-group">
          <label className="form-label">Prenom *</label>
          <input
            className="form-input"
            placeholder="Marie"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Nom *</label>
          <input
            className="form-input"
            placeholder="Dupont"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            className="form-input"
            type="email"
            placeholder="marie.dupont@etudiant.fr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Classe</label>
          <select
            className="form-input filter-select"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
          >
            <option value="">Selectionner une classe</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.label} ({c.year})</option>)}
          </select>
        </div>

        <div className="form-group student-form-photo-field">
          <label className="form-label">Photo (optionnel)</label>
          <div className="upload-zone student-form-upload">
            <div className="upload-icon">Photo</div>
            <p className="upload-text">Choisissez une photo a associer a l'etudiant</p>
            <p className="student-form-hint">JPEG / PNG / WebP - max 5 MB</p>
            <input
              className="form-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
            />
            {form.photo && <p className="student-form-file">Fichier selectionne : {form.photo.name}</p>}
            {error && <p className="student-form-error">{error}</p>}
          </div>
        </div>
      </div>

      <button type="submit" style={{ display: "none" }} aria-hidden="true">submit</button>
    </form>
  );
});

export default StudentForm;
