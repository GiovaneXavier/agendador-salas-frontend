import type { Booking } from '../types/booking'
import { DAY_START, DAY_END, TOTAL_SLOTS } from '../lib/constants'
import { BookingBlock } from './BookingBlock'

interface TimelineGridProps {
  bookings: Booking[]
  accentColor: string
  bgColor: string
  onSlotClick: (startMinute: number) => void
  onExtend: (id: string) => void
  onCancel: (booking: Booking) => void
  extendingId: string | null
}

function minuteToLabel(minute: number): string {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function isSlotOccupied(minute: number, bookings: Booking[]): boolean {
  return bookings.some(b => minute >= b.start_minute && minute < b.end_minute)
}

export function TimelineGrid({
  bookings,
  accentColor,
  bgColor,
  onSlotClick,
  onExtend,
  onCancel,
  extendingId,
}: TimelineGridProps) {
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => DAY_START + i * 30)

  return (
    <div className="w-full overflow-x-auto">
      {/* Rótulos de hora */}
      <div
        className="grid mb-1"
        style={{ gridTemplateColumns: `repeat(${TOTAL_SLOTS}, minmax(60px, 1fr))` }}
      >
        {slots.map(minute => (
          <div key={minute} className="text-[11px] text-gray-400 text-center select-none">
            {minuteToLabel(minute)}
          </div>
        ))}
        {/* último rótulo 20:00 */}
        <div className="text-[11px] text-gray-400 text-center select-none">
          {minuteToLabel(DAY_END)}
        </div>
      </div>

      {/* Grade de slots */}
      <div
        className="relative grid h-16 rounded-xl overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${TOTAL_SLOTS}, minmax(60px, 1fr))` }}
      >
        {/* Slots clicáveis (fundo) */}
        {slots.map(minute => {
          const occupied = isSlotOccupied(minute, bookings)
          return (
            <button
              key={minute}
              onClick={() => !occupied && onSlotClick(minute)}
              disabled={occupied}
              className={[
                'h-full border-r border-white/40 last:border-r-0 transition-colors',
                occupied
                  ? 'cursor-default'
                  : 'cursor-pointer hover:opacity-80',
              ].join(' ')}
              style={{ backgroundColor: occupied ? 'transparent' : bgColor }}
              title={occupied ? undefined : `Reservar ${minuteToLabel(minute)}`}
            />
          )
        })}

        {/* Blocos de reservas (sobrepostos via CSS grid) */}
        {bookings.map(booking => (
          <BookingBlock
            key={booking.id}
            booking={booking}
            accentColor={accentColor}
            bgColor={bgColor}
            onExtend={onExtend}
            onCancel={onCancel}
            isExtending={extendingId === booking.id}
          />
        ))}
      </div>
    </div>
  )
}
