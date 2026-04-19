import type { Room } from '../types/room'
import type { Booking } from '../types/booking'
import { InlineTimeline } from './InlineTimeline'

// Metadados temporários — serão vindos da API quando disponíveis
const ROOM_META: Record<string, { capacity: number; resource: string }> = {
  'a1b2c3d4-0001-0001-0001-000000000001': { capacity: 8, resource: 'TV' },
  'a1b2c3d4-0002-0002-0002-000000000002': { capacity: 4, resource: 'WHITEBOARD' },
}

function getRoomStatus(bookings: Booking[], isToday: boolean): string {
  if (!isToday) {
    const n = bookings.length
    return n === 0 ? 'Livre o dia todo' : `${n} reserva${n > 1 ? 's' : ''}`
  }
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const current = bookings.find(b => b.start_minute <= nowMin && nowMin < b.end_minute)
  if (current) return `Ocupada · até ${current.end_time}`
  const next = [...bookings].sort((a, b) => a.start_minute - b.start_minute)
    .find(b => b.start_minute > nowMin)
  if (next) return `Livre · próxima às ${next.start_time}`
  return 'Livre'
}

interface RoomRowProps {
  room: Room
  bookings: Booking[]
  date: string
  isToday: boolean
  onSlotClick: (room: Room, date: string, startMinute: number) => void
  onBookingClick: (booking: Booking, room: Room) => void
}

export function RoomRow({ room, bookings, date, isToday, onSlotClick, onBookingClick }: RoomRowProps) {
  const meta = ROOM_META[room.id]
  const status = getRoomStatus(bookings, isToday)
  const isOccupied = isToday && status.startsWith('Ocupada')

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: room.color_bg }}
    >
      <div className="flex gap-6">
        {/* Left info panel */}
        <div className="w-44 flex-shrink-0">
          <h2 className="font-script text-3xl leading-tight" style={{ color: room.color_accent }}>
            {room.name}
          </h2>
          {meta && (
            <p className="text-[11px] tracking-widest mt-1" style={{ color: room.color_accent, opacity: 0.6 }}>
              {meta.capacity} PESSOAS · {meta.resource}
            </p>
          )}
          <p
            className="text-sm font-semibold mt-3"
            style={{ color: isOccupied ? room.color_accent : room.color_accent }}
          >
            {status}
          </p>
        </div>

        {/* Timeline */}
        <div className="flex-1 min-w-0">
          <InlineTimeline
            bookings={bookings}
            accentColor={room.color_accent}
            bgColor={`${room.color_bg}cc`}
            isToday={isToday}
            onSlotClick={min => onSlotClick(room, date, min)}
            onBookingClick={b => onBookingClick(b, room)}
          />
        </div>
      </div>
    </div>
  )
}
