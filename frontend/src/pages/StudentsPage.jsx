import { useRef, useState } from "react";
import CsvImport from "../components/CsvImport";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import StudentForm from "../components/StudentForm";
import StudentGrid from "../components/StudentGrid";

export default function StudentsPage({ students, classes, onSaveStudent, onDeleteStudent, onImportCsv, onUploadPhoto, toast }) {
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [showCSV, setShowCSV] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const formRef = useRef(null);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q);
    const matchC = filterClass === "all" || s.classId === +filterClass;
    return matchQ && matchC;
  });

  const openNew = () => {
    setEditStudent(null);
    setShowModal(true);
  };

  const openEdit = (student) => {
    setEditStudent(student);
    setShowModal(true);
  };

  const saveStudent = async (form) => {
    try {
      await onSaveStudent(form, editStudent?.id || null);
      setShowModal(false);
      setEditStudent(null);
    } catch (error) {
      toast(error.message || "Impossible d'enregistrer l'etudiant", "error");
    }
  };

  const delStudent = async (id) => { await onDeleteStudent(id); };

  const importCSV = async () => {
    if (!csvFile) {
      toast("Choisissez un fichier CSV", "error");
      return;
    }

    const result = await onImportCsv(csvFile);
    setCsvResult({ created: result.created, errors: Array.isArray(result.errors) ? result.errors.length : 0 });
    setShowCSV(false);
    setCsvFile(null);
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
          <button className="btn btn-primary" onClick={openNew}><Icon name="plus" /> Ajouter</button>
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

        <StudentGrid students={filtered} classes={classes} view={view} onDelete={delStudent} onUploadPhoto={onUploadPhoto} onEdit={openEdit} />
      </div>

      {showModal && (
        <Modal
          title="Ajouter un étudiant"
          onClose={() => { setShowModal(false); setEditStudent(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditStudent(null); }}>Annuler</button>
              <button className="btn btn-primary" onClick={() => formRef.current?.requestSubmit()}><Icon name="check" /> {editStudent ? "Enregistrer" : "Ajouter"}</button>
            </>
          }
        >
          <StudentForm ref={formRef} classes={classes} initialValue={editStudent} onSubmit={saveStudent} />
        </Modal>
      )}

      {showCSV && (
        <Modal
          title="Importer des étudiants (CSV)"
          onClose={() => { setShowCSV(false); setCsvResult(null); setCsvFile(null); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowCSV(false); setCsvResult(null); setCsvFile(null); }}>Fermer</button>
              {!csvResult && <button className="btn btn-primary" onClick={importCSV}><Icon name="upload" /> Importer</button>}
            </>
          }
        >
          <CsvImport csvResult={csvResult} selectedFileName={csvFile?.name || ""} onFileChange={(event) => setCsvFile(event.target.files?.[0] || null)} />
        </Modal>
      )}
    </div>
  );
}
