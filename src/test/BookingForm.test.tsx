import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingForm } from '../components/BookingForm'

describe('BookingForm', () => {
  it('renderiza os campos corretamente', () => {
    render(
      <BookingForm
        roomId="room-1"
        date="2024-06-15"
        initialStartMinute={480}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    )
    expect(screen.getByLabelText(/horário de início/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/duração/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument()
  })

  it('exibe erro quando username é muito curto', async () => {
    render(
      <BookingForm
        roomId="room-1"
        date="2024-06-15"
        initialStartMinute={480}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    )
    const usernameInput = screen.getByPlaceholderText('nome.sobrenome')
    await userEvent.type(usernameInput, 'ab')
    await userEvent.click(screen.getByText(/confirmar/i))
    expect(await screen.findByText(/mínimo 3 caracteres/i)).toBeInTheDocument()
  })

  it('exibe erro quando username contém caractere inválido', async () => {
    render(
      <BookingForm
        roomId="room-1"
        date="2024-06-15"
        initialStartMinute={480}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    )
    const usernameInput = screen.getByPlaceholderText('nome.sobrenome')
    await userEvent.type(usernameInput, 'nome@invalido')
    await userEvent.click(screen.getByText(/confirmar/i))
    expect(await screen.findByText(/apenas letras/i)).toBeInTheDocument()
  })

  it('chama onSubmit com payload correto quando formulário é válido', async () => {
    const onSubmit = vi.fn()
    render(
      <BookingForm
        roomId="room-abc"
        date="2024-06-15"
        initialStartMinute={480}
        onSubmit={onSubmit}
        isLoading={false}
      />
    )
    const usernameInput = screen.getByPlaceholderText('nome.sobrenome')
    await userEvent.type(usernameInput, 'g.xavier')
    await userEvent.click(screen.getByText(/confirmar/i))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        room_id: 'room-abc',
        date: '2024-06-15',
        start_minute: 480,
        username: 'g.xavier',
      })
    )
  })

  it('exibe apiError quando fornecido', () => {
    render(
      <BookingForm
        roomId="room-1"
        date="2024-06-15"
        initialStartMinute={480}
        onSubmit={vi.fn()}
        isLoading={false}
        apiError="Horário já está ocupado. Escolha outro slot."
      />
    )
    expect(screen.getByText(/horário já está ocupado/i)).toBeInTheDocument()
  })
})
