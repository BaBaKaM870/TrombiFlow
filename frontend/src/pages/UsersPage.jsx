import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import { approveAdminRequest, rejectAdminRequest } from "../services/clientAPI";
import Modal from "../components/Modal";

const EMPTY_FORM = { username: "", email: "", password: "", role: "teacher" };

function roleLabel(role) {
  return role === "admin" ? "Administrateur" : "Enseignant";
}

export default function UsersPage({
  users,
  exportsLog,
  currentUser,
  adminRequests = [],
  onReloadAdminRequests,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  toast,
}) {
  const [detailsUser, setDetailsUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const detailsHistory = useMemo(
    () => exportsLog.filter((entry) => entry.generatedById === detailsUser?.id),
    [exportsLog, detailsUser?.id]
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, email: user.email, password: "", role: user.role || "teacher" });
    setShowModal(true);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.email.trim() || (!editingUser && !form.password.trim())) {
      toast?.("Nom, email et mot de passe sont obligatoires", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
      };
      if (form.password.trim()) payload.password = form.password.trim();

      if (editingUser) {
        await onUpdateUser(editingUser.id, payload);
        toast?.("Compte mis a jour", "success");
      } else {
        const created = await onCreateUser(payload);
        setDetailsUser(created);
        toast?.("Compte cree", "success");
      }

      setShowModal(false);
    } catch (error) {
      toast?.(error.message || "Impossible d'enregistrer le compte", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Supprimer le compte ${user.email} ?`)) return;
    try {
      await onDeleteUser(user.id);
      if (detailsUser?.id === user.id) setDetailsUser(null);
      toast?.("Compte supprime", "error");
    } catch (error) {
      toast?.(error.message || "Impossible de supprimer le compte", "error");
    }
  };

  return (
    <div className="page users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">{users.length} compte{users.length > 1 ? "s" : ""} enregistre{users.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Icon name="plus" /> Nouveau compte
        </button>
      </div>

      <div className="users-layout">
        {currentUser?.role === "admin" && (
          <div className="card admin-requests-card">
            <div className="card-header">
              <span className="card-title">Demandes admin ({adminRequests.length})</span>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => onReloadAdminRequests?.()}>
                Actualiser
              </button>
            </div>
            <div style={{ padding: 12 }}>
              {adminRequests.length === 0 && <div>Aucune demande en attente.</div>}
              {adminRequests.map((req) => (
                <div key={req.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <strong>{req.username || req.email}</strong>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>{new Date(req.requested_at).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select defaultValue={1} id={`dur-${req.id}`}>
                      {Array.from({ length: 72 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>{h} h</option>
                      ))}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={async () => {
                      const sel = document.getElementById(`dur-${req.id}`);
                      const hours = Number(sel?.value || 1);
                      try {
                        await approveAdminRequest(req.id, hours);
                        toast?.("Accès administrateur accordé", "success");
                        await onReloadAdminRequests?.();
                      } catch (err) {
                        toast?.(err.message || "Erreur lors de l'acceptation", "error");
                      }
                    }}>
                      Accepter
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={async () => {
                      try {
                        await rejectAdminRequest(req.id);
                        toast?.("Demande refusée", "error");
                        await onReloadAdminRequests?.();
                      } catch (err) {
                        toast?.(err.message || "Erreur lors du refus", "error");
                      }
                    }}>
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card users-table-card">
          <div className="card-header">
            <span className="card-title">Comptes</span>
            <Icon name="users" size={16} />
          </div>
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th><th>Role</th><th>Cree le</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="user-row" onClick={() => setDetailsUser(user)}>
                  <td>
                    <div className="user-cell">
                      {user.photoUrl ? (
                        <img className="user-avatar-sm user-avatar-img" src={user.photoUrl} alt="" />
                      ) : (
                        <div className="user-avatar-sm">{user.username?.[0]?.toUpperCase() || "U"}</div>
                      )}
                      <div>
                        <div className="user-cell-name">{user.username}</div>
                        <div className="user-cell-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${user.role === "admin" ? "badge-coral" : "badge-blue"}`}>{roleLabel(user.role)}</span></td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{user.createdAt || "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" type="button" onClick={(event) => { event.stopPropagation(); openEdit(user); }}>
                        <Icon name="edit" size={12} /> Modifier
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        type="button"
                        disabled={user.id === currentUser?.id}
                        onClick={(event) => { event.stopPropagation(); remove(user); }}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailsUser && (
        <Modal
          title="Fiche utilisateur"
          onClose={() => setDetailsUser(null)}
          className="user-details-modal"
          footer={
            <>
              <button className="btn btn-secondary" type="button" onClick={() => setDetailsUser(null)}>Fermer</button>
              <button className="btn btn-primary" type="button" onClick={() => { setDetailsUser(null); openEdit(detailsUser); }}>
                <Icon name="edit" /> Modifier
              </button>
            </>
          }
        >
          <div className="user-details">
            <div className="user-details-hero">
              {detailsUser.photoUrl ? (
                <img className="user-details-avatar" src={detailsUser.photoUrl} alt="" />
              ) : (
                <div className="user-details-avatar user-details-avatar-fallback">{detailsUser.username?.[0]?.toUpperCase() || "U"}</div>
              )}
              <div>
                <div className="user-details-name">{detailsUser.username}</div>
                <div className="user-details-email">{detailsUser.email}</div>
                <div className="user-details-meta">
                  <span className={`badge ${detailsUser.role === "admin" ? "badge-coral" : "badge-blue"}`}>{roleLabel(detailsUser.role)}</span>
                  <span className="badge badge-navy">{detailsHistory.length} export{detailsHistory.length > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            <div className="user-details-main">
              <div className="user-details-grid">
                <div className="user-details-stat">
                  <span>Identifiant</span>
                  <strong>#{detailsUser.id}</strong>
                </div>
                <div className="user-details-stat">
                  <span>Role</span>
                  <strong>{roleLabel(detailsUser.role)}</strong>
                </div>
                <div className="user-details-stat">
                  <span>Cree le</span>
                  <strong>{detailsUser.createdAt || "Non renseigne"}</strong>
                </div>
              </div>

              <div className="user-details-history">
                <div className="user-details-history-head">
                  <span>Historique des exports</span>
                  <Icon name="log" size={16} />
                </div>
                <table>
                  <thead>
                    <tr><th>Classe</th><th>Format</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {detailsHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td><span className="badge badge-navy">{entry.class}</span></td>
                        <td><span className={`badge ${entry.format === "PDF" ? "badge-coral" : "badge-blue"}`}>{entry.format}</span></td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{entry.date}</td>
                      </tr>
                    ))}
                    {detailsHistory.length === 0 && (
                      <tr><td colSpan="3" className="empty-table-cell">Aucun export pour ce compte.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal
          title={editingUser ? "Modifier le compte" : "Nouveau compte"}
          onClose={() => setShowModal(false)}
          className="user-edit-modal"
          footer={
            <>
              <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" type="submit" form="user-form" disabled={saving}>
                <Icon name="check" /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </>
          }
        >
          <form id="user-form" className="user-form" onSubmit={save}>
            <div className="user-form-hero">
              {editingUser?.photoUrl ? (
                <img className="user-form-avatar" src={editingUser.photoUrl} alt="" />
              ) : (
                <div className="user-form-avatar user-form-avatar-fallback">{form.username?.[0]?.toUpperCase() || "U"}</div>
              )}
              <div>
                <div className="user-form-kicker">Compte</div>
                <div className="user-form-title">{form.username || "Nouveau compte"}</div>
                <div className="user-form-subtitle">{form.email || "email@esiee-it.fr"}</div>
                <div className="user-form-meta">
                  <span className={`badge ${form.role === "admin" ? "badge-coral" : "badge-blue"}`}>{roleLabel(form.role)}</span>
                </div>
              </div>
            </div>

            <div className="user-form-grid">
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{editingUser ? "Nouveau mot de passe" : "Mot de passe"}</label>
                <input className="form-input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input filter-select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  <option value="teacher">Enseignant</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
