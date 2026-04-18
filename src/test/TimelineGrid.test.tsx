import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimelineGrid } from '../components/TimelineGrid'
import { Booking } from '../types/booking'

const noop = () => {}

const makeBooking = (id: string, start: number, duration: 30 | 60 | 90 | 120): Booking => ({
  id,
  room_id: 'room-1',
  date: '2024-06-15',
  start_minute: start,
  duration_minutes: duration,
  end_minute: start + duration,
  start_time: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
  end_time: `${String(Math.floor((start + duration) / 60)).padStart(2, '0')}:${String((start + duration) % 60).padStart(2, '0')}`,
  username: 'g.xavier',
  created_at: '2024-06-15T08:00:00Z',
})

describe('TimelineGrid', () => {
  it('renderiza 26 labels de horário (07:00 a 20:00)', () => {
    render(
      <TimelineGrid
        bookings={[]}
        accentColor="#4a3d2f"
        bgColor="#eae4dc"
        onSlotClick={noop}
        onExtend={noop}
        onCancel={noop}
        extendingId={null}
      />
    )
    expect(screen.getByText('07:00')).toBeInTheDocument()
    expect(screen.getByText('20:00')).toBeInTheDocument()
  })

  it('renderiza o username da reserva', () => {
    const booking = makeBooking('b1', 480, 60)
    render(
      <TimelineGrid
        bookings={[booking]}
        accentColor="#4a3d2f"
        bgColor="#eae4dc"
        onSlotClick={noop}
        onExtend={noop}
        onCancel={noop}
        extendingId={null}
      />
    )
    expect(screen.getByText('g.xavier')).toBeInTheDocument()
  })

  it('chama onSlotClick ao clicar em slot vazio', async () => {
    const onSlotClick = vi.fn()
    render(
      <TimelineGrid
        bookings={[]}
        accentColor="#4a3d2f"
        bgColor="#eae4dc"
        onSlotClick={onSlotClick}
        onExtend={noop}
        onCancel={noop}
        extendingId={null}
      />
    )
    const slot = screen.getByTitle('Reservar 07:00')
    await userEvent.click(slot)
    expect(onSlotClick).toHaveBeenCalledWith(420)
  })

  it('slot ocupado fica desabilitado', () => {
    const booking = makeBooking('b1', 420, 30)
    render(
      <TimelineGrid
        bookings={[booking]}
        accentColor="#4a3d2f"
        bgColor="#eae4dc"
        onSlotClick={noop}
        onExtend={noop}
        onCancel={noop}
        extendingId={null}
      />
    )
    const slotOccupied = screen.queryByTitle('Reservar 07:00')
    expect(slotOccupied).toBeNull()
  })
})
