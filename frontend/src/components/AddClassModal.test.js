import { fireEvent, render, screen } from '@testing-library/react'
import AddClassModal from './AddClassModal'

describe('AddClassModal', () => {
  test('renders modal fields and default year', () => {
    render(<AddClassModal onClose={jest.fn()} onAdd={jest.fn()} />)

    expect(screen.getByText('Nouvelle classe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ex: 3A, M1 MIAGE...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025-2026')).toBeInTheDocument()
  })

  test('shows validation error when label is empty', () => {
    render(<AddClassModal onClose={jest.fn()} onAdd={jest.fn()} />)

    fireEvent.click(screen.getByText('Créer la classe'))

    expect(screen.getByText('Le libellé est requis.')).toBeInTheDocument()
  })

  test('calls onAdd and onClose with trimmed label', () => {
    const onAdd = jest.fn()
    const onClose = jest.fn()
    render(<AddClassModal onClose={onClose} onAdd={onAdd} />)

    fireEvent.change(screen.getByPlaceholderText('ex: 3A, M1 MIAGE...'), {
      target: { value: '  5B  ' },
    })
    fireEvent.click(screen.getByText('Créer la classe'))

    expect(onAdd).toHaveBeenCalledWith({
      label: '5B',
      year: '2025-2026',
      color: '#e85d3a',
      students: 0,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test('closes modal when clicking on overlay', () => {
    const onClose = jest.fn()
    const { container } = render(<AddClassModal onClose={onClose} onAdd={jest.fn()} />)

    fireEvent.click(container.querySelector('.modal-overlay'))

    expect(onClose).toHaveBeenCalled()
  })
})
