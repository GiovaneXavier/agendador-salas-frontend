import { useEffect, useState } from 'react'
import { useNav } from '../contexts/NavigationContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  variant: 'created' | 'cancelled' | 'extended'
  roomName: string
  startTime: string
  endTime: string
  date: string
  fullName?: string
}

const CONFIG = {
  created: {
    bg: 'bg-[#d4e8d4]',
    icon: '✓',
    iconColor: 'text-green-600',
    borderColor: 'border-green-400',
    title: 'Reserva confirmada!',
    titleColor: 'text-green-900',
  },
  extended: {
    bg: 'bg-[#d4e8d4]',
    icon: '✓',
    iconColor: 'text-green-600',
    borderColor: 'border-green-400',
    title: 'Extensão confirmada!',
    titleColor: 'text-green-900',
  },
  cancelled: {
    bg: 'bg-[#f5f3ef]',
    icon: '×',
    iconColor: 'text-gray-700',
    borderColor: 'border-gray-400',
    title: 'Reserva cancelada',
    titleColor: 'text-gray-900',
  },
}

export function ConfirmationScreen({ variant, roomName, startTime, endTime, date, fullName }: Props) {
  const { goHome } = useNav()
  const [remaining, setRemaining] = useState(5)
  const cfg = CONFIG[variant]

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); goHome(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [goHome])

  const dateLabel = (() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (date === today) return 'Hoje'
    return format(new Date(date + 'T12:00:00'), "EEE d MMM", { locale: ptBR })
  })()

  return (
    <div className={`flex flex-col h-full items-center justify-center ${cfg.bg}`}>
      {/* Icon */}
      <div className={`w-20 h-20 rounded-full border-2 border-dashed ${cfg.borderColor} flex items-center justify-center mb-6`}>
        <span className={`text-3xl font-bold ${cfg.iconColor}`}>{cfg.icon}</span>
      </div>

      {/* Title */}
      <h1 className={`font-script text-5xl ${cfg.titleColor} mb-8`}>{cfg.title}</h1>

      {/* Card */}
      <div className="border border-gray-200 bg-white rounded-2xl px-10 py-6 w-96 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] tracking-widest text-gray-400">
            {variant === 'cancelled' ? 'LIBERADO' : 'SALA'}
          </span>
          <span className="font-semibold text-gray-900">{roomName}</span>
        </div>
        <div className="border-t border-gray-100" />
        <div className="flex justify-between items-center">
          <span className="text-[11px] tracking-widest text-gray-400">
            {variant === 'cancelled' ? 'HORÁRIO' : 'QUANDO'}
          </span>
          <span className="font-semibold text-gray-900">
            {variant !== 'cancelled' && `${dateLabel} · `}{startTime} – {endTime}
          </span>
        </div>
        {fullName && variant !== 'cancelled' && (
          <>
            <div className="border-t border-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-[11px] tracking-widest text-gray-400">RESERVADO POR</span>
              <span className="font-semibold text-gray-900">{fullName}</span>
            </div>
          </>
        )}
      </div>

      {/* Countdown */}
      <p className="text-xs text-gray-400 tracking-widest mt-6 font-mono">
        voltando {variant === 'cancelled' ? '' : 'à tela inicial '}em {remaining}s…
      </p>

      <button
        onClick={goHome}
        className="mt-4 border border-gray-300 rounded-xl px-8 py-3 text-sm tracking-widest text-gray-600 hover:bg-gray-100 cursor-pointer"
      >
        VOLTAR AGORA
      </button>
    </div>
  )
}
