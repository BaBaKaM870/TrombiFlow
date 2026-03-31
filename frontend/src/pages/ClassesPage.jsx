import { useRef, useState } from "react";
import ClassForm from "../components/ClassForm";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { CLASS_COLORS } from "../services/api";

export default function ClassesPage({ classes, setClasses, students, toast }) {
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [search, setSearch] = useState("");
  const formRef = useRef(null);

  const openNew = () => { setEditClass(null); setShowModal(true); };
  const openEdit = (c) => { setEditClass(c); setShowModal(true); };
  const save = (form) => {
    if (editClass) {
      setClasses(cs => cs.map(c => c.id === editClass.id ? { ...c, ...form } : c));
      toast("Classe mise à jour ✓");
    } else {
      setClasses(cs => [...cs, { id: Date.now(), ...form, count: 0 }]);
      toast("Classe créée ✓");
    }
    setShowModal(false);
  };
  const del = (id) => {
    setClasses(cs => cs.filter(c => c.id !== id));
    toast("Classe supprimée", "error");
  };

  const filtered = classes.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">{classes.length} classes enregistrées</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Icon name="plus" /> Nouvelle classe</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{ width: 280 }}>
            <Icon name="search" size={14} />
            <input placeholder="Rechercher une classe…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th></th><th>Libellé</th><th>Année</th><th>Étudiants</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const count = students.filter(s => s.classId === c.id).length || c.count;
              return (
                <tr key={c.id}>
                  <td style={{ width: 40 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: CLASS_COLORS[i % CLASS_COLORS.length] }} />
                  </td>
                  <td><span style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</span></td>
                  <td><span className="badge badge-navy">{c.year}</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{count}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>élèves</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><Icon name="edit" size={12} /> Modifier</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(c.id)}><Icon name="trash" size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          title={editClass ? "Modifier la classe" : "Nouvelle classe"}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={() => formRef.current?.requestSubmit()}><Icon name="check" /> Enregistrer</button>
            </>
          }
        >
          <ClassForm ref={formRef} initialValue={editClass} onSubmit={save} />
        </Modal>
      )}
    </div>
  );
}
