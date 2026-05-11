import { useEffect, useState } from 'react'
import type { Booking } from '../types/booking'
import { DAY_END, DAY_START } from '../lib/constants'

const TOTAL = DAY_END - DAY_START
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i)

function toPercent(minute: number) {
  return ((minute - DAY_START) / TOTAL) * 100
}

function nowMinute() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

interface VerticalTimelineProps {
  bookings: Booking[]
  isToday: boolean
  accentColor?: string
  blockTextColor?: string
}

export function VerticalTimeline({
  bookings,
  isToday,
  accentColor = '#171412',
  blockTextColor = '#ffffff',
}: VerticalTimelineProps) {
  const [now, setNow] = useState(nowMinute())

  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => setNow(nowMinute()), 30_000)
    return () => clearInterval(id)
  }, [isToday])

  const nowPct = isToday ? Math.min(Math.max(toPercent(now), 0), 100) : -1

  return (
    <div className="relative w-full h-full">
      {/* Hour labels + gridlines */}
      <div className="absolute inset-0">
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-center gap-2 -translate-y-1/2"
            style={{ top: `${toPercent(h * 60)}%` }}
          >
            <span className="text-[10px] tabular-nums text-gray-400 w-7 text-right tracking-wider">
              {String(h).padStart(2, '0')}:00
            </span>
            <div className="flex-1 border-t border-dashed border-gray-200" />
          </div>
        ))}
      </div>

      {/* Booking blocks */}
      <div className="absolute inset-y-0 left-10 right-0">
        {bookings.map((b) => {
          const top = toPercent(b.start_minute)
          const height = (b.duration_minutes / TOTAL) * 100
          const past = isToday && b.end_minute <= now
          return (
            <div
              key={b.id}
              className="absolute left-0 right-2 rounded-lg px-3 py-1.5 flex flex-col justify-center overflow-hidden shadow-sm"
              style={{
                top: `${top}%`,
                height: `${height}%`,
                backgroundColor: accentColor,
                color: blockTextColor,
                opacity: past ? 0.45 : 1,
              }}
            >
              <span className="text-xs font-semibold truncate">{b.full_name}</span>
              <span className="text-[10px] opacity-80 truncate tabular-nums">
                {b.start_time}–{b.end_time}
              </span>
            </div>
          )
        })}
      </div>

      {/* Now indicator */}
      {nowPct >= 0 && nowPct <= 100 && (
        <div
          className="absolute left-0 right-0 pointer-events-none flex items-center gap-2 -translate-y-1/2"
          style={{ top: `${nowPct}%` }}
        >
          <span className="text-[10px] tabular-nums font-semibold text-red-500 w-7 text-right tracking-wider">
            {String(Math.floor(now / 60)).padStart(2, '0')}:{String(now % 60).padStart(2, '0')}
          </span>
          <div className="flex-1 h-px bg-red-500 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
          </div>
        </div>
      )}
    </div>
  )
}
