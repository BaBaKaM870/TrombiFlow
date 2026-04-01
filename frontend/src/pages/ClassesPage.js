import { useState } from 'react'
import { CLASSES_LIST } from '../data/ClassesList'
import AddClassModal from '../components/AddClassModal'

export default function Classes() {
  const [search, setSearch] = useState('')
  const [classes, setClasses] = useState(CLASSES_LIST)
  const [showModal, setShowModal] = useState(false)

  const filtered = classes.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id) => {
    setClasses(prev => prev.filter(c => c.id !== id))
  }

  const handleAdd = (newClass) => {
    setClasses(prev => [...prev, { ...newClass, id: Date.now() }])
  }

  return (
    <div className="content">
      {showModal && (
        <AddClassModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">Classes</div>
          <div className="page-subtitle">{classes.length} classes enregistrées</div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nouvelle classe</button>
      </div>

      {/* Table card */}
      <div className="card">
        {/* Search + result count */}
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Rechercher une classe..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="result-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <table className="classes-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Libellé</th>
              <th>Année</th>
              <th>Étudiants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="table-row">
                <td>
                  <span className="color-dot" style={{ background: c.color }} />
                </td>
                <td className="label-cell">{c.label}</td>
                <td>
                  <span className="year-badge">{c.year}</span>
                </td>
                <td className="students-cell">
                  <strong>{c.students}</strong>
                  <span className="eleves-text"> élèves</span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-edit">✎ Modifier</button>
                    <button className="btn-delete" onClick={() => handleDelete(c.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">Aucune classe trouvée.</div>
        )}
      </div>
    </div>
  )
}