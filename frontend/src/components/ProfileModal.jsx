import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import Modal from "./Modal";

export default function ProfileModal({ user, onClose, onSave, onLogout }) {
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    photo: null,
  });
  const [preview, setPreview] = useState(user?.photoUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const formId = useId();

  useEffect(() => {
    if (!form.photo) {
      setPreview(user?.photoUrl || "");
      return;
    }

    const previewUrl = URL.createObjectURL(form.photo);
    setPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.photo, user?.photoUrl]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.username.trim() || !form.email.trim()) {
      setError("Nom et email sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      await onSave?.({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        photo: form.photo,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Impossible de mettre a jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.username || user?.email || "U").trim()[0]?.toUpperCase() || "U";

  return (
    <Modal
      title="Profil utilisateur"
      onClose={onClose}
      className="profile-modal"
      footer={
        <>
          <button className="btn btn-danger profile-logout" type="button" onClick={onLogout}>
            <Icon name="logout" /> Deconnexion
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" type="submit" form={formId} disabled={saving}>
            <Icon name="check" /> {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="profile-form">
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            {preview ? (
              <img className="profile-avatar" src={preview} alt="" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">{initials}</div>
            )}
            <button
              className="profile-photo-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Changer la photo"
            >
              <Icon name="camera" size={15} />
            </button>
          </div>

          <div className="profile-hero-copy">
            <div className="profile-name">{form.username || "Utilisateur"}</div>
            <div className="profile-email">{form.email || "email@exemple.fr"}</div>
            <span className="badge badge-blue profile-role">{user?.role || "teacher"}</span>
          </div>

          <input
            ref={fileInputRef}
            className="profile-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setForm({ ...form, photo: event.target.files?.[0] || null })}
          />
        </div>

        {error && <div className="profile-error">{error}</div>}

        <div className="profile-fields">
          <div className="form-group">
            <label className="form-label">Nom utilisateur</label>
            <input
              className="form-input"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-input" value={user?.role || "teacher"} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Nouveau mot de passe</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Laisser vide pour conserver l'actuel"
              autoComplete="new-password"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
