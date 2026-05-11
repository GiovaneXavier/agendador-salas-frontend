import { useEffect } from 'react'

type SuccessVariant = 'created' | 'cancelled' | 'extended'

const VARIANT_COPY: Record<SuccessVariant, { title: string; icon: string; bg: string; fg: string }> = {
  created:   { title: 'Reservado!',         icon: '✓', bg: '#16a34a', fg: '#ffffff' },
  cancelled: { title: 'Reserva cancelada',  icon: '×', bg: '#171412', fg: '#ffffff' },
  extended:  { title: '+30 min adicionados', icon: '+', bg: '#d97706', fg: '#ffffff' },
}

interface DoorSuccessOverlayProps {
  variant: SuccessVariant
  roomName: string
  startTime: string
  endTime: string
  fullName?: string
  durationMs?: number
  onDone: () => void
}

export function DoorSuccessOverlay({
  variant,
  roomName,
  startTime,
  endTime,
  fullName,
  durationMs = 4000,
  onDone,
}: DoorSuccessOverlayProps) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onDone])

  const c = VARIANT_COPY[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-10 select-none"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <div className="w-24 h-24 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center text-5xl font-bold mb-6">
        {c.icon}
      </div>
      <h1 className="font-script text-6xl mb-3">{c.title}</h1>
      <p className="text-2xl font-light">{roomName}</p>
      <p className="text-lg opacity-80 tabular-nums mt-1">
        {startTime} – {endTime}
      </p>
      {fullName && <p className="text-base opacity-70 mt-2">{fullName}</p>}
      <button
        type="button"
        onClick={onDone}
        className="mt-10 text-[11px] tracking-widest uppercase opacity-70 hover:opacity-100 underline underline-offset-4 cursor-pointer"
      >
        Concluir agora
      </button>
    </div>
  )
}
