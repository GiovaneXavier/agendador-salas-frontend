import { useEffect, useRef, useState } from 'react'
import { STATUS_API_URL, STATUS_WS_URL } from '../lib/constants'
import type { RoomStatusData } from '../types/roomStatus'

const STATUS_BG: Record<string, string> = {
  LIVRE:            '#16a34a',
  RESERVADO:        '#d97706',
  OCUPADO:          '#dc2626',
  USO_NAO_AGENDADO: '#9333ea',
}

function Clock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span>
      {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

interface DoorDisplayScreenProps {
  roomId: string
}

export function DoorDisplayScreen({ roomId }: DoorDisplayScreenProps) {
  const [status, setStatus] = useState<RoomStatusData | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch inicial
  useEffect(() => {
    fetch(`${STATUS_API_URL}/rooms/status/${roomId}`)
      .then(r => r.json())
      .then((data: RoomStatusData) => setStatus(data))
      .catch(() => {})
  }, [roomId])

  // WebSocket — filtra apenas esta sala
  useEffect(() => {
    function connect() {
      const ws = new WebSocket(STATUS_WS_URL)
      wsRef.current = ws
      ws.onmessage = (e) => {
        try {
          const data: RoomStatusData = JSON.parse(e.data)
          if (data.type === 'room_status_update' && data.room_id === roomId) {
            setStatus(data)
          }
        } catch {}
      }
      ws.onclose = () => setTimeout(connect, 3000)
    }
    connect()
    return () => wsRef.current?.close()
  }, [roomId])

  const bg = status ? STATUS_BG[status.status] ?? '#6b7280' : '#1f2937'

  return (
    <div
      className="flex flex-col items-center justify-center h-screen w-screen transition-colors duration-700 select-none"
      style={{ backgroundColor: bg }}
    >
      {/* Relógio */}
      <div className="absolute top-8 right-10 text-white/60 text-2xl font-light tabular-nums">
        <Clock />
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col items-center gap-8 text-white text-center px-12">
        {/* Ícone de presença */}
        <div className={`w-6 h-6 rounded-full bg-white transition-opacity ${status?.presence ? 'opacity-90 animate-pulse' : 'opacity-20'}`} />

        {/* Nome da sala */}
        <h1 className="font-script text-7xl leading-tight">
          {status?.room_name ?? roomId}
        </h1>

        {/* Label do status */}
        <p className="text-3xl font-semibold tracking-wide uppercase opacity-90">
          {status?.label ?? '—'}
        </p>

        {/* Info da reserva ativa */}
        {status?.active_booking && (
          <div className="mt-4 text-center opacity-75 space-y-1">
            <p className="text-xl">{status.active_booking.username}</p>
            <p className="text-lg font-light">
              {new Date(status.active_booking.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {new Date(status.active_booking.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      {/* Logo rodapé */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-3 opacity-30">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-gray-900 text-sm font-bold">S</span>
          </div>
          <span className="text-white text-sm tracking-widest">SAMSUNG</span>
        </div>
      </div>
    </div>
  )
}
