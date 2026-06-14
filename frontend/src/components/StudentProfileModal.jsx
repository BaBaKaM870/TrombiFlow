import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import Modal from "./Modal";

const EMPTY_FORM = { firstName: "", lastName: "", email: "", classId: "", photo: null };
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function StudentProfileModal({ student, classes, canManage = false, onClose, onSave, onAskDelete }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const formId = useId();

  useEffect(() => {
    setForm({
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      email: student?.email || "",
      classId: student?.classId || "",
      photo: null,
    });
    setPreview(student?.photo || "");
    setError("");
  }, [student]);

  useEffect(() => {
    if (!form.photo) {
      setPreview(student?.photo || "");
      return;
    }

    const previewUrl = URL.createObjectURL(form.photo);
    setPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.photo, student?.photo]);

  const selectedClass = classes.find((cls) => cls.id === Number(form.classId)) || null;

  const submit = async (event) => {
    event.preventDefault();
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

    setSaving(true);
    try {
      await onSave?.(form);
      onClose();
    } catch (err) {
      setError(err.message || "Impossible de mettre a jour l'etudiant.");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${form.firstName || ""} ${form.lastName || ""}`.trim()[0]?.toUpperCase() || "E";

  return (
    <Modal
      title="Fiche etudiant"
      onClose={onClose}
      className="student-profile-modal"
      footer={
        <>
          {canManage && (
            <button className="btn btn-danger student-profile-delete" type="button" onClick={() => onAskDelete?.(student)}>
              <Icon name="trash" /> Supprimer
            </button>
          )}
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            {canManage ? "Annuler" : "Fermer"}
          </button>
          {canManage && (
            <button className="btn btn-primary" type="submit" form={formId} disabled={saving}>
              <Icon name="check" /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </>
      }
    >
      <form id={formId} className="student-profile-form" onSubmit={submit}>
        <div className="student-profile-hero">
          <div className="student-profile-photo-wrap">
            {preview ? (
              <img className="student-profile-photo" src={preview} alt="" />
            ) : (
              <div className="student-profile-photo student-profile-photo-fallback">{initials}</div>
            )}
            {canManage && (
              <button
                className="student-profile-photo-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Changer la photo de l'etudiant"
              >
                <Icon name="camera" size={15} />
              </button>
            )}
          </div>

          <div className="student-profile-identity">
            <div className="student-profile-name">{form.firstName || "Prenom"} {form.lastName || "Nom"}</div>
            <div className="student-profile-email">{form.email || "email@etudiant.fr"}</div>
            <div className="student-profile-meta">
              <span className="badge badge-blue">{selectedClass?.label || "Sans classe"}</span>
              {selectedClass?.year && <span className="badge badge-navy">{selectedClass.year}</span>}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="student-profile-file"
            disabled={!canManage}
            onChange={(event) => setForm({ ...form, photo: event.target.files?.[0] || null })}
          />
        </div>

        {error && <div className="profile-error">{error}</div>}

        <div className="student-profile-fields">
          <div className="form-group">
            <label className="form-label">Prenom</label>
            <input className="form-input" value={form.firstName} disabled={!canManage} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="form-input" value={form.lastName} disabled={!canManage} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} disabled={!canManage} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Classe</label>
            <select className="form-input filter-select" value={form.classId} disabled={!canManage} onChange={(event) => setForm({ ...form, classId: event.target.value })}>
              <option value="">Selectionner une classe</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.label} ({cls.year || "annee"})</option>
              ))}
            </select>
          </div>

          <div className="student-profile-detail">
            <span>Identifiant</span>
            <strong>#{student?.id}</strong>
          </div>

          <div className="student-profile-detail">
            <span>Inscrit le</span>
            <strong>{student?.createdAt || "Non renseigne"}</strong>
          </div>
        </div>
      </form>
    </Modal>
  );
}
