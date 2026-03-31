import { fireEvent, render, screen } from '@testing-library/react'
import TableauBord from './TableauBord'

describe('TableauBord', () => {
  test('renders dashboard view by default', () => {
    render(<TableauBord />)

    expect(screen.getByText('Système opérationnel')).toBeInTheDocument()
    expect(screen.getByText('Répartition des classes')).toBeInTheDocument()
    expect(screen.getByText('Derniers ajouts')).toBeInTheDocument()
  })

  test('shows navigation badges and export section', () => {
    const { container } = render(<TableauBord />)

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
    const badges = container.querySelectorAll('.nav-badge')
    expect(badges).toHaveLength(2)
    expect(badges[0]).toHaveTextContent('5')
    expect(badges[1]).toHaveTextContent('32')
  })

  test('navigates to classes page when clicking Classes', () => {
    render(<TableauBord />)

    fireEvent.click(screen.getAllByText('Classes')[0])

    expect(screen.getByText('5 classes enregistrées')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Rechercher une classe...')).toBeInTheDocument()
  })

  test('navigates to students page when clicking Étudiants', () => {
    render(<TableauBord />)

    fireEvent.click(screen.getAllByText('Étudiants')[0])

    expect(screen.getAllByText('Étudiants').length).toBeGreaterThan(1)
  })
})
