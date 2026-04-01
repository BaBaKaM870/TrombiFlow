import { useState } from 'react'

const COLORS = ['#e85d3a', '#4c7ef3', '#2ecc71', '#9b59b6', '#f39c12', '#e91e8c', '#00bcd4']

export default function AddClassModal({ onClose, onAdd }) {
  const [label, setLabel] = useState('')
  const [year, setYear] = useState('2025-2026')
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!label.trim()) {
      setError('Le libellé est requis.')
      return
    }
    onAdd({ label: label.trim(), year, color, students: 0 })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nouvelle classe</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Libellé</label>
            <input
              className="form-input"
              placeholder="ex: 3A, M1 MIAGE..."
              value={label}
              onChange={e => { setLabel(e.target.value); setError('') }}
              autoFocus
            />
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Année scolaire</label>
            <select
              className="form-input"
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              <option>2024-2025</option>
              <option>2025-2026</option>
              <option>2026-2027</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Couleur</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSubmit}>Créer la classe</button>
        </div>
      </div>
    </div>
  )
}