import { useRef, useState } from "react";
import CsvImport from "../components/CsvImport";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import StudentForm from "../components/StudentForm";
import StudentGrid from "../components/StudentGrid";
import { AVATARS } from "../services/api";

export default function StudentsPage({ students, setStudents, classes, toast }) {
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const formRef = useRef(null);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q);
    const matchC = filterClass === "all" || s.classId === +filterClass;
    return matchQ && matchC;
  });

  const saveStudent = (form) => {
    const newS = {
      id: Date.now(),
      ...form,
      classId: +form.classId || 1,
      photo: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setStudents(s => [...s, newS]);
    setShowModal(false);
    toast("Étudiant ajouté ✓");
  };

  const delStudent = (id) => { setStudents(s => s.filter(x => x.id !== id)); toast("Étudiant supprimé", "error"); };

  const simulateCSV = () => {
    const created = Math.floor(Math.random() * 18) + 8;
    const errors = Math.floor(Math.random() * 4);
    setCsvResult({ created, errors });
    toast(`Import CSV : ${created} créés, ${errors} erreurs`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Étudiants</h1>
          <p className="page-subtitle">{filtered.length} étudiant{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => { setShowCSV(true); setCsvResult(null); }}><Icon name="upload" /> Importer CSV</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Icon name="plus" /> Ajouter</button>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-box" style={{ flex: 1, maxWidth: 320 }}>
            <Icon name="search" size={14} />
            <input placeholder="Rechercher par nom, email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="all">Toutes les classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <div style={{ marginLeft: "auto" }}>
            <div className="view-toggle">
              <button className={`view-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}><Icon name="grid" size={13} /></button>
              <button className={`view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}><Icon name="list" size={13} /></button>
            </div>
          </div>
        </div>

        <StudentGrid students={filtered} classes={classes} view={view} onDelete={delStudent} />
      </div>

      {showModal && (
        <Modal
          title="Ajouter un étudiant"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={() => formRef.current?.requestSubmit()}><Icon name="check" /> Ajouter</button>
            </>
          }
        >
          <StudentForm ref={formRef} classes={classes} onSubmit={saveStudent} />
        </Modal>
      )}

      {showCSV && (
        <Modal
          title="Importer des étudiants (CSV)"
          onClose={() => { setShowCSV(false); setCsvResult(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowCSV(false); setCsvResult(null); }}>Fermer</button>
              {!csvResult && <button className="btn btn-primary" onClick={simulateCSV}><Icon name="upload" /> Importer</button>}
            </>
          }
        >
          <CsvImport csvResult={csvResult} />
        </Modal>
      )}
    </div>
  );
}
