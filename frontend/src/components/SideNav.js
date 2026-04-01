import { NAV_ITEMS } from '../data/NavItems'

export default function SideNav({ activeNav, setActiveNav }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
            <div className="logo-title">
              Trombi<span>scope</span>
            </div>
            <div className="logo-sub">École Supérieure · 2025–2026</div>
          </div>
 
          <div className="nav-section">
            <div className="nav-label">Navigation</div>
            {NAV_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`nav-item ${activeNav === i ? "active" : ""}`}
                onClick={() => setActiveNav(i)}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
            ))}
          </div>
 
          <div className="nav-section" style={{ paddingTop: 8 }}>
            <div className="nav-label">Export</div>
            <div className="nav-item">
              <span style={{ fontSize: 16 }}>↺</span>
              Générer
            </div>
          </div>
 
          <div className="sidebar-spacer" />
 
          <div className="sidebar-user">
            <div className="user-avatar">A</div>
            <div>
              <div className="user-name">Admin</div>
              <div className="user-role">Administrateur</div>
            </div>
          </div>
    </aside>
  )
}
