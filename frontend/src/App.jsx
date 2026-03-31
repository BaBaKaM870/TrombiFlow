import { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import ClassesPage from "./pages/ClassesPage";
import StudentsPage from "./pages/StudentsPage";
import GeneratePage from "./pages/GeneratePage";
import Icon from "./components/Icon";
import { ToastContainer, useToasts } from "./components/Toast";
import { EXPORTS_LOG, INITIAL_CLASSES, INITIAL_STUDENTS } from "./services/api";
import "./styles.css";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [exports, setExports] = useState(EXPORTS_LOG);
  const { toasts, add: addToast } = useToasts();

  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: "dashboard", section: "NAVIGATION" },
    { id: "classes", label: "Classes", icon: "classes", section: null, badge: classes.length },
    { id: "students", label: "Étudiants", icon: "students", section: null, badge: students.length },
    { id: "generate", label: "Générer", icon: "generate", section: "EXPORT" },
  ];

  return (
    <>
      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-title">Trombi<span>scope</span></div>
            <div className="sidebar-logo-sub">École Supérieure · 2025-2026</div>
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
            <div className="user-avatar-sm">A</div>
            <div>
              <div className="user-info-name">Admin</div>
              <div className="user-info-role">Administrateur</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
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
            <span className="badge badge-blue" style={{ fontSize: 11, padding: "5px 12px" }}>✦ Session active</span>
          </div>

          {page === "dashboard" && <DashboardPage classes={classes} students={students} exports={exports} />}
          {page === "classes" && <ClassesPage classes={classes} setClasses={setClasses} students={students} toast={addToast} />}
          {page === "students" && <StudentsPage students={students} setStudents={setStudents} classes={classes} toast={addToast} />}
          {page === "generate" && <GeneratePage classes={classes} students={students} setExports={setExports} toast={addToast} />}
        </main>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}