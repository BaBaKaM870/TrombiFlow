import { useState } from 'react'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'
import StatsGrid from '../components/StatsGrid'
import ClassesCard from '../components/ClassesCard'
import StudentsCard from '../components/StudentsCard'
import Classes from './ClassesPage'

const PAGES = {
  0: 'dashboard',
  1: 'classes',
  2: 'students',
}

export default function TableauBord() {
  const [activeNav, setActiveNav] = useState(0)
  const page = PAGES[activeNav]

  return (
    <div className="app">
      <SideNav activeNav={activeNav} setActiveNav={setActiveNav} />
      <main className="main">

        {page === 'dashboard' && (
          <>
            <TopBar title="Tableau de" accent="bord" />
            <div className="content">
              <div className="page-header">
                <div>
                  <div className="page-title">Tableau de bord</div>
                  <div className="page-subtitle">
                    Vue d'ensemble de votre établissement — Année 2025-2026
                  </div>
                </div>
                <div className="status-badge">
                  <div className="status-dot" />
                  Système opérationnel
                </div>
              </div>
              <StatsGrid />
              <div className="bottom-grid">
                <ClassesCard />
                <StudentsCard />
              </div>
            </div>
          </>
        )}

        {page === 'classes' && (
          <>
            <TopBar title="Gestion des" accent="classes" showSearch />
            <Classes />
          </>
        )}

        {page === 'students' && (
          <>
            <TopBar title="Gestion des" accent="étudiants" showSearch />
            <div className="content">
              <div className="page-title">Étudiants</div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}