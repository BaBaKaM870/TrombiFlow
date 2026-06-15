import { useEffect, useMemo, useState } from "react";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ClassesPage from "./pages/ClassesPage";
import StudentsPage from "./pages/StudentsPage";
import GeneratePage from "./pages/GeneratePage";
import UsersPage from "./pages/UsersPage";
import Icon from "./components/Icon";
import Modal from "./components/Modal";
import ProfileModal from "./components/ProfileModal";
import { ToastContainer, useToasts } from "./components/Toast";
import {
  createClass,
  createStudent,
  createUser,
  deleteClass,
  deleteExport,
  deleteStudent,
  deleteUser,
  downloadExport,
  generateTrombi,
  getClasses,
  getExports,
  getMe,
  getStats,
  getStudents,
  getUsers,
  importStudentsCSV,
  login,
  register,
  registerWithPhoto,
  updateClass,
  updateCurrentUser,
  updateStudent,
  updateUser,
  uploadCurrentUserPhoto,
  requestAdminAccess,
  getAdminRequests,
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
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [exportToDelete, setExportToDelete] = useState(null);
  const [deletingExport, setDeletingExport] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [storageBytes, setStorageBytes] = useState(null);
  const [adminRequests, setAdminRequests] = useState([]);
  const { toasts, add: addToast } = useToasts();
  const roleLabel = (role) => (role === "admin" ? "Administrateur" : "Enseignant");

  const isAdmin = currentUser?.role === "admin";

  const reloadAdminRequests = async (activeUser = currentUser) => {
    if (activeUser?.role !== "admin") {
      setAdminRequests([]);
      return;
    }
    try {
      const list = await getAdminRequests();
      setAdminRequests(Array.isArray(list) ? list : []);
    } catch (error) {
      setAdminRequests([]);
      addToast(error.message || "Impossible de charger les demandes admin", "error");
    }
  };

  const reloadData = async (activeUser = currentUser) => {
    const [classesData, studentsData, exportsData, statsData, usersData] = await Promise.all([
      getClasses(),
      getStudents(),
      getExports(),
      getStats().catch(() => null),
      activeUser?.role === "admin" ? getUsers() : Promise.resolve([]),
    ]);

    setClasses(classesData);
    setStudents(studentsData);
    setExportsLog(exportsData);
    setUsers(usersData);
    if (statsData) setStorageBytes(statsData.storage_bytes);
    await reloadAdminRequests(activeUser);
  };

  useEffect(() => {
    if (page === "users" && isAdmin) {
      reloadAdminRequests();
    }
  }, [page, isAdmin, currentUser?.id]);

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
        await reloadData(user);
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
    await reloadData(user);
    setPage("dashboard");
  };

  const handleLogin = async ({ email, password }) => {
    const result = await login(email, password);
    await handleAuthSuccess(result);
    return result;
  };

  const ensureAdmin = () => {
    if (!isAdmin) {
      throw new Error("Action réservée aux administrateurs");
    }
  };

  const handleRegister = async (form) => {
    if (form.photo) {
      const formData = new FormData();
      formData.append("username", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("photo", form.photo);
      await registerWithPhoto(formData);
    } else {
      await register({
        username: form.name,
        email: form.email,
        password: form.password,
      });
    }

    const result = await login(form.email, form.password);
    await handleAuthSuccess(result);
    return result;
  };

  const handleClassSave = async (form, editingId = null) => {
    ensureAdmin();
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
    ensureAdmin();
    await deleteClass(id);
    addToast("Classe supprimée", "error");
    await reloadData();
  };

  const handleStudentSave = async (form, editingId = null) => {
    ensureAdmin();
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
    ensureAdmin();
    await deleteStudent(id);
    addToast("Étudiant supprimé", "error");
    await reloadData();
  };

  const handleCsvImport = async (file) => {
    ensureAdmin();
    const result = await importStudentsCSV(file);
    addToast(`Import CSV : ${result.created} créés`, "success");
    await reloadData();
    return result;
  };

  const handleStudentPhotoUpload = async (id, file) => {
    ensureAdmin();
    await uploadStudentPhoto(id, file);
    addToast("Photo mise à jour ✓");
    await reloadData();
  };

  const handleProfileSave = async ({ username, email, password, photo }) => {
    const payload = { username, email };
    if (password?.trim()) payload.password = password.trim();

    let updatedUser = await updateCurrentUser(payload);
    if (photo) {
      updatedUser = await uploadCurrentUserPhoto(photo);
    }

    setCurrentUser(updatedUser);
    addToast("Profil mis à jour ✓");
  };

  const handleRequestAdminAccess = async () => {
    try {
      await requestAdminAccess();
      addToast("Demande envoyée ✓");
    } catch (error) {
      addToast(error.message || "Impossible d'envoyer la demande", "error");
      throw error;
    }
  };

  const handleCreateUser = async (payload) => {
    ensureAdmin();
    const created = await createUser(payload);
    await reloadData(currentUser);
    return created;
  };

  const handleUpdateUser = async (id, payload) => {
    ensureAdmin();
    const updated = await updateUser(id, payload);
    await reloadData(currentUser);
    if (id === currentUser?.id) setCurrentUser(updated);
    return updated;
  };

  const handleDeleteUser = async (id) => {
    ensureAdmin();
    await deleteUser(id);
    await reloadData(currentUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setShowProfile(false);
    setClasses([]);
    setStudents([]);
    setExportsLog([]);
    setUsers([]);
    setStorageBytes(null);
    setPage("landing");
    addToast("Session fermée");
  };

  const handleGenerateTrombi = async (classId, format) => {
    const response = await generateTrombi(classId, format);
    await reloadData();
    return response;
  };

  const handleDownloadExport = async (entry) => {
    if (!entry?.id || (entry.format !== "HTML" && !entry.filePath)) {
      addToast("Aucun fichier disponible pour cet export", "error");
      return;
    }

    const response = await downloadExport(entry.id);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const extension = entry.format === "HTML" ? "html" : "pdf";
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `trombi-${entry.class || "all"}.${extension}`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleDeleteExport = async (entry) => {
    ensureAdmin();
    setExportToDelete(entry);
    return;
    if (!window.confirm(`Supprimer l'export ${entry.format} de ${entry.class || "toutes les classes"} ?`)) {
      return;
    }

    await deleteExport(entry.id);
    addToast("Export supprimé", "error");
    await reloadData(currentUser);
  };

  const confirmDeleteExport = async () => {
    if (!exportToDelete?.id) return;
    ensureAdmin();
    setDeletingExport(true);
    try {
      await deleteExport(exportToDelete.id);
      addToast("Export supprimé", "error");
      setExportToDelete(null);
      await reloadData(currentUser);
    } catch (error) {
      addToast(error.message || "Impossible de supprimer l'export", "error");
    } finally {
      setDeletingExport(false);
    }
  };

  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: "dashboard", section: "NAVIGATION" },
    { id: "classes", label: "Classes", icon: "classes", section: null, badge: classesView.length },
    { id: "students", label: "Étudiants", icon: "students", section: null, badge: students.length },
    { id: "generate", label: "Générer", icon: "generate", section: "EXPORT" },
    ...(isAdmin ? [{ id: "users", label: "Utilisateurs", icon: "users", section: "ADMIN", badge: users.length }] : []),
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
          <button className="sidebar-user" type="button" onClick={() => setShowProfile(true)}>
            {currentUser?.photoUrl ? (
              <img className="user-avatar-sm user-avatar-img" src={currentUser.photoUrl} alt="" />
            ) : (
              <div className="user-avatar-sm">{currentUser?.username?.[0]?.toUpperCase() || "A"}</div>
            )}
            <div>
              <div className="user-info-name">{currentUser?.username || "Admin"}</div>
              <div className="user-info-role">{roleLabel(currentUser?.role)}</div>
            </div>
          </button>
        </aside>

        <main className={`main main-${page}`}>
          <div className="topbar">
            <div className="topbar-title">
              {page === "dashboard" && <>Tableau de <span>bord</span></>}
              {page === "classes" && <>Gestion des <span>classes</span></>}
              {page === "students" && <>Gestion des <span>étudiants</span></>}
              {page === "generate" && <>Générer un <span>trombinoscope</span></>}
              {page === "users" && <>Gestion des <span>utilisateurs</span></>}
            </div>
            {(page === "students" || page === "classes") && (
              <div className="search-box">
                <Icon name="search" size={14} />
                <input placeholder="Recherche rapide…" />
              </div>
            )}
            <span className="badge badge-blue session-badge">Session active</span>
          </div>

          {page === "dashboard" && <DashboardPage classes={classesView} students={students} exports={exportsLog} storageBytes={storageBytes} canDeleteExports={isAdmin} onDownloadExport={handleDownloadExport} onDeleteExport={handleDeleteExport} />}
          {page === "classes" && <ClassesPage classes={classesView} students={students} canManage={isAdmin} onSaveClass={handleClassSave} onDeleteClass={handleClassDelete} toast={addToast} />}
          {page === "students" && <StudentsPage students={students} classes={classesView} canManage={isAdmin} onSaveStudent={handleStudentSave} onDeleteStudent={handleStudentDelete} onImportCsv={handleCsvImport} onUploadPhoto={handleStudentPhotoUpload} toast={addToast} />}
          {page === "generate" && <GeneratePage classes={classesView} students={students} onGenerateTrombi={handleGenerateTrombi} toast={addToast} />}
          {page === "users" && isAdmin && (
            <UsersPage
              users={users}
              exportsLog={exportsLog}
              currentUser={currentUser}
              adminRequests={adminRequests}
              onReloadAdminRequests={reloadAdminRequests}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              toast={addToast}
            />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} />
      {showProfile && currentUser && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onSave={handleProfileSave}
          onLogout={handleLogout}
          onRequestAdminAccess={handleRequestAdminAccess}
        />
      )}
      {exportToDelete && (
        <Modal
          title="Confirmer la suppression"
          onClose={() => !deletingExport && setExportToDelete(null)}
          className="confirm-modal"
          footer={
            <>
              <button className="btn btn-secondary" type="button" disabled={deletingExport} onClick={() => setExportToDelete(null)}>
                Annuler
              </button>
              <button className="btn btn-danger" type="button" disabled={deletingExport} onClick={confirmDeleteExport}>
                <Icon name="trash" /> {deletingExport ? "Suppression..." : "Supprimer"}
              </button>
            </>
          }
        >
          <div className="confirm-delete">
            <div className="confirm-delete-icon"><Icon name="trash" size={22} /></div>
            <div>
              <div className="confirm-delete-title">Supprimer cet export ?</div>
              <p>
                Cette action supprimera l'export <strong>{exportToDelete.format}</strong> de{" "}
                <strong>{exportToDelete.class || "toutes les classes"}</strong> ainsi que le fichier genere s'il existe.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
