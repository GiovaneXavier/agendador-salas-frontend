import { useEffect, useState } from 'react'
import type { Booking } from '../types/booking'
import { DAY_START, DAY_END } from '../lib/constants'

const TOTAL = DAY_END - DAY_START // 780 min
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 7..20

function toPercent(minute: number) {
  return ((minute - DAY_START) / TOTAL) * 100
}

function nowMinute() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

interface InlineTimelineProps {
  bookings: Booking[]
  accentColor: string
  bgColor: string
  isToday: boolean
  onSlotClick: (startMinute: number) => void
  onBookingClick: (booking: Booking) => void
}

export function InlineTimeline({
  bookings,
  accentColor,
  bgColor,
  isToday,
  onSlotClick,
  onBookingClick,
}: InlineTimelineProps) {
  const [now, setNow] = useState(nowMinute())

  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => setNow(nowMinute()), 30_000)
    return () => clearInterval(id)
  }, [isToday])

  const nowPct = isToday ? Math.min(Math.max(toPercent(now), 0), 100) : -1
  const pastPct = nowPct >= 0 ? nowPct : 0

  return (
    <div className="w-full">
      {/* Hour labels */}
      <div className="relative h-5 mb-1">
        {HOURS.map(h => (
          <span
            key={h}
            className="absolute text-[10px] text-gray-400 -translate-x-1/2"
            style={{ left: `${toPercent(h * 60)}%` }}
          >
            {String(h).padStart(2, '0')}
          </span>
        ))}
      </div>

      {/* Timeline bar */}
      <div
        className="relative h-14 rounded-xl overflow-hidden cursor-pointer"
        style={{ backgroundColor: bgColor }}
        onClick={e => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          const minute = Math.round((DAY_START + pct * TOTAL) / 30) * 30
          const clamped = Math.max(DAY_START, Math.min(DAY_END - 30, minute))
          // only fire if slot isn't occupied
          const occupied = bookings.some(b => clamped >= b.start_minute && clamped < b.end_minute)
          if (!occupied) onSlotClick(clamped)
        }}
      >
        {/* Past area hatch */}
        {pastPct > 0 && (
          <div
            className="absolute inset-y-0 left-0 hatch"
            style={{ width: `${pastPct}%`, backgroundColor: bgColor }}
          />
        )}

        {/* Booking blocks */}
        {bookings.map(b => (
          <div
            key={b.id}
            className="absolute inset-y-1 rounded-lg px-2 flex flex-col justify-center overflow-hidden"
            style={{
              left: `${toPercent(b.start_minute)}%`,
              width: `${(b.duration_minutes / TOTAL) * 100}%`,
              backgroundColor: accentColor,
            }}
            onClick={e => { e.stopPropagation(); onBookingClick(b) }}
          >
            <span className="text-[11px] font-semibold truncate" style={{ color: bgColor }}>
              {b.full_name}
            </span>
            <span className="text-[10px] opacity-80 truncate" style={{ color: bgColor }}>
              {b.start_time}–{b.end_time}
            </span>
          </div>
        ))}

        {/* Now indicator */}
        {nowPct >= 0 && nowPct <= 100 && (
          <div
            className="absolute inset-y-0 w-px bg-green-500 pointer-events-none"
            style={{ left: `${nowPct}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 -translate-x-[4.5px] -translate-y-1.5" />
          </div>
        )}
      </div>
    </div>
  )
}
