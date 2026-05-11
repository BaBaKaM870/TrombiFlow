import { useEffect, useMemo, useState } from "react";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ClassesPage from "./pages/ClassesPage";
import StudentsPage from "./pages/StudentsPage";
import GeneratePage from "./pages/GeneratePage";
import Icon from "./components/Icon";
import { ToastContainer, useToasts } from "./components/Toast";
import {
  createClass,
  createStudent,
  deleteClass,
  deleteStudent,
  downloadExport,
  generateTrombi,
  getClasses,
  getExports,
  getMe,
  getStats,
  getStudents,
  importStudentsCSV,
  login,
  register,
  registerWithPhoto,
  updateClass,
  updateStudent,
  uploadStudentPhoto,
} from "./services/clientAPI";
import esieeLogo from "./images/logo-esiee-it.png";
import trombiFlowLogo from "./images/LOGO_TROMBIFLOW.png";
import "./styles.css";

export default function App() {
  const [page, setPage] = useState("landing");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exportsLog, setExportsLog] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [storageBytes, setStorageBytes] = useState(null);
  const { toasts, add: addToast } = useToasts();

  const reloadData = async () => {
    const [classesData, studentsData, exportsData, statsData] = await Promise.all([
      getClasses(),
      getStudents(),
      getExports(),
      getStats().catch(() => null),
    ]);

    setClasses(classesData);
    setStudents(studentsData);
    setExportsLog(exportsData);
    if (statsData) setStorageBytes(statsData.storage_bytes);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setBootstrapping(false);
      return;
    }

    (async () => {
      try {
        const user = await getMe();
        setCurrentUser(user);
        await reloadData();
        setPage("dashboard");
      } catch {
        localStorage.removeItem("token");
        setCurrentUser(null);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const classesView = useMemo(
    () => classes.map((cls) => ({ ...cls, count: students.filter((student) => student.classId === cls.id).length })),
    [classes, students]
  );

  const handleAuthSuccess = async ({ token, user }) => {
    localStorage.setItem("token", token);
    setCurrentUser(user);
    await reloadData();
    setPage("dashboard");
  };

  const handleLogin = async ({ email, password }) => {
    const result = await login(email, password);
    await handleAuthSuccess(result);
    return result;
  };

  const handleRegister = async (form) => {
    if (form.photo) {
      const formData = new FormData();
      formData.append("username", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("role", "teacher");
      formData.append("photo", form.photo);
      await registerWithPhoto(formData);
    } else {
      await register({
        username: form.name,
        email: form.email,
        password: form.password,
        role: "teacher",
      });
    }

    const result = await login(form.email, form.password);
    await handleAuthSuccess(result);
    return result;
  };

  const handleClassSave = async (form, editingId = null) => {
    const payload = {
      label: form.label.trim(),
      year: form.year?.trim() || null,
    };

    if (editingId) {
      await updateClass(editingId, payload);
      addToast("Classe mise à jour ✓");
    } else {
      await createClass(payload);
      addToast("Classe créée ✓");
    }

    await reloadData();
  };

  const handleClassDelete = async (id) => {
    await deleteClass(id);
    addToast("Classe supprimée", "error");
    await reloadData();
  };

  const handleStudentSave = async (form, editingId = null) => {
    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim() || null,
      class_id: form.classId ? Number(form.classId) : null,
    };

    if (editingId) {
      await updateStudent(editingId, payload);
      if (form.photo) {
        try {
          await uploadStudentPhoto(editingId, form.photo);
        } catch (error) {
          await reloadData();
          addToast(`Etudiant mis a jour, mais photo non envoyee : ${error.message}`, "error");
          return;
        }
      }
      addToast("Étudiant mis à jour ✓");
    } else {
      const created = await createStudent(payload);
      if (form.photo) {
        try {
          await uploadStudentPhoto(created.id, form.photo);
        } catch (error) {
          await reloadData();
          addToast(`Etudiant ajoute, mais photo non envoyee : ${error.message}`, "error");
          return;
        }
      }
      addToast("Étudiant ajouté ✓");
    }

    await reloadData();
  };

  const handleStudentDelete = async (id) => {
    await deleteStudent(id);
    addToast("Étudiant supprimé", "error");
    await reloadData();
  };

  const handleCsvImport = async (file) => {
    const result = await importStudentsCSV(file);
    addToast(`Import CSV : ${result.created} créés`, "success");
    await reloadData();
    return result;
  };

  const handleStudentPhotoUpload = async (id, file) => {
    await uploadStudentPhoto(id, file);
    addToast("Photo mise à jour ✓");
    await reloadData();
  };

  const handleGenerateTrombi = async (classId, format) => {
    const response = await generateTrombi(classId, format);
    await reloadData();
    return response;
  };

  const handleDownloadExport = async (entry) => {
    if (!entry?.id || !entry.filePath) {
      addToast("Aucun fichier disponible pour cet export", "error");
      return;
    }

    const response = await downloadExport(entry.id);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `trombi-${entry.class || "all"}.pdf`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: "dashboard", section: "NAVIGATION" },
    { id: "classes", label: "Classes", icon: "classes", section: null, badge: classesView.length },
    { id: "students", label: "Étudiants", icon: "students", section: null, badge: students.length },
    { id: "generate", label: "Générer", icon: "generate", section: "EXPORT" },
  ];

  if (page === "landing") {
    return (
      <>
        <LandingPage
          classCount={classesView.length}
          onEnter={() => {
            if (!localStorage.getItem("token")) {
              addToast("Connectez-vous d'abord", "error");
              return;
            }
            setPage("dashboard");
          }}
          onLogin={handleLogin}
          onRegister={handleRegister}
          toast={addToast}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  if (bootstrapping && page !== "landing") {
    return (
      <div className="app" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ padding: 24 }}>Chargement…</div>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-row">
              <a
                className="sidebar-logo-title sidebar-logo-link"
                id="home-link"
                href="/"
                onClick={(event) => {
                  event.preventDefault();
                  setPage("landing");
                }}
                aria-label="Aller a la page d'accueil"
              >
                <img className="sidebar-logo-platform" src={trombiFlowLogo} alt="" aria-hidden="true" />
                <span className="brand-wordmark">Trombi<span className="brand-accent">Flow</span></span>
              </a>
              <div className="sidebar-logo-wrap">
                <img className="sidebar-logo-img" src={esieeLogo} alt="ESIEE-IT" />
              </div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {nav.map((item) => (
              <div key={item.id}>
                {item.section && <div className="nav-section-label">{item.section}</div>}
                <button className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                  <span className="nav-item-icon"><Icon name={item.icon} size={16} /></span>
                  {item.label}
                  {item.badge !== undefined && <span className="nav-badge">{item.badge}</span>}
                </button>
              </div>
            ))}
          </nav>
          <div className="sidebar-user">
            <div className="user-avatar-sm">{currentUser?.username?.[0]?.toUpperCase() || "A"}</div>
            <div>
              <div className="user-info-name">{currentUser?.username || "Admin"}</div>
              <div className="user-info-role">{currentUser?.role || "Administrateur"}</div>
            </div>
          </div>
        </aside>

        <main className={`main main-${page}`}>
          <div className="topbar">
            <div className="topbar-title">
              {page === "dashboard" && <>Tableau de <span>bord</span></>}
              {page === "classes" && <>Gestion des <span>classes</span></>}
              {page === "students" && <>Gestion des <span>étudiants</span></>}
              {page === "generate" && <>Générer un <span>trombinoscope</span></>}
            </div>
            {(page === "students" || page === "classes") && (
              <div className="search-box">
                <Icon name="search" size={14} />
                <input placeholder="Recherche rapide…" />
              </div>
            )}
            <span className="badge badge-blue session-badge">Session active</span>
          </div>

          {page === "dashboard" && <DashboardPage classes={classesView} students={students} exports={exportsLog} storageBytes={storageBytes} onDownloadExport={handleDownloadExport} />}
          {page === "classes" && <ClassesPage classes={classesView} students={students} onSaveClass={handleClassSave} onDeleteClass={handleClassDelete} toast={addToast} />}
          {page === "students" && <StudentsPage students={students} classes={classesView} onSaveStudent={handleStudentSave} onDeleteStudent={handleStudentDelete} onImportCsv={handleCsvImport} onUploadPhoto={handleStudentPhotoUpload} toast={addToast} />}
          {page === "generate" && <GeneratePage classes={classesView} students={students} onGenerateTrombi={handleGenerateTrombi} toast={addToast} />}
        </main>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}
