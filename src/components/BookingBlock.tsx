import type { Booking } from '../types/booking'
import { DAY_START } from '../lib/constants'
import { Button } from './ui/Button'

interface BookingBlockProps {
  booking: Booking
  accentColor: string
  bgColor: string
  onExtend: (id: string) => void
  onCancel: (booking: Booking) => void
  isExtending: boolean
}

export function BookingBlock({
  booking,
  accentColor,
  bgColor,
  onExtend,
  onCancel,
  isExtending,
}: BookingBlockProps) {
  const colStart = (booking.start_minute - DAY_START) / 30 + 1
  const colSpan  = booking.duration_minutes / 30

  return (
    <div
      className="relative rounded-xl px-3 py-2 flex flex-col justify-between overflow-hidden group min-w-0"
      style={{
        gridColumnStart: colStart,
        gridColumnEnd: `span ${colSpan}`,
        backgroundColor: accentColor,
        color: bgColor,
      }}
    >
      <div className="truncate text-xs font-semibold">{booking.username}</div>
      <div className="text-[11px] opacity-80">
        {booking.start_time} – {booking.end_time}
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />

      <div className="absolute bottom-1 right-1 hidden group-hover:flex gap-1">
        <Button
          variant="ghost"
          className="!px-2 !py-0.5 !text-[10px] !border-white/60 !text-white hover:!bg-white/20"
          onClick={() => onExtend(booking.id)}
          loading={isExtending}
          title="+30 min"
        >
          +30
        </Button>
        <Button
          variant="ghost"
          className="!px-2 !py-0.5 !text-[10px] !border-white/60 !text-white hover:!bg-white/20"
          onClick={() => onCancel(booking)}
          title="Cancelar"
        >
          ✕
        </Button>
      </div>
    </div>
  )
}
