import { fireEvent, render, screen } from '@testing-library/react'
import Classes from './ClassesPage'

describe('ClassesPage', () => {
  test('renders initial class count', () => {
    render(<Classes />)

    expect(screen.getByText('5 classes enregistrées')).toBeInTheDocument()
  })

  test('filters classes by search input', () => {
    render(<Classes />)

    fireEvent.change(screen.getByPlaceholderText('Rechercher une classe...'), {
      target: { value: '3A' },
    })

    expect(screen.getByText('3A')).toBeInTheDocument()
    expect(screen.getByText('1 résultat')).toBeInTheDocument()
  })

  test('shows empty state when search has no match', () => {
    render(<Classes />)

    fireEvent.change(screen.getByPlaceholderText('Rechercher une classe...'), {
      target: { value: 'XYZ' },
    })

    expect(screen.getByText('Aucune classe trouvée.')).toBeInTheDocument()
    expect(screen.getByText('0 résultats')).toBeInTheDocument()
  })

  test('deletes a class from the list', () => {
    render(<Classes />)

    const deleteButtons = document.querySelectorAll('.btn-delete')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText('4 classes enregistrées')).toBeInTheDocument()
    expect(screen.queryByText('3A')).not.toBeInTheDocument()
  })

  test('opens and closes modal from action buttons', () => {
    render(<Classes />)

    fireEvent.click(screen.getByText('+ Nouvelle classe'))
    expect(screen.getByText('Nouvelle classe')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Annuler'))
    expect(screen.queryByText('Nouvelle classe')).not.toBeInTheDocument()
  })

  test('adds a new class via modal form', () => {
    render(<Classes />)

    fireEvent.click(screen.getByText('+ Nouvelle classe'))
    fireEvent.change(screen.getByPlaceholderText('ex: 3A, M1 MIAGE...'), {
      target: { value: 'M2 DEVOPS' },
    })
    fireEvent.click(screen.getByText('Créer la classe'))

    expect(screen.getByText('M2 DEVOPS')).toBeInTheDocument()
    expect(screen.getByText('6 classes enregistrées')).toBeInTheDocument()
  })
})
