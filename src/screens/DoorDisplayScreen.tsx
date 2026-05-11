import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { STATUS_API_URL, STATUS_WS_URL } from '../lib/constants'
import type { RoomStatusData } from '../types/roomStatus'
import type { Booking } from '../types/booking'
import { useRooms } from '../hooks/useRooms'
import { useBookings } from '../hooks/useBookings'
import { VerticalTimeline } from '../components/VerticalTimeline'
import { DoorBookOverlay } from '../components/door/DoorBookOverlay'
import { DoorCancelOverlay } from '../components/door/DoorCancelOverlay'
import { DoorExtendOverlay } from '../components/door/DoorExtendOverlay'
import { DoorSuccessOverlay } from '../components/door/DoorSuccessOverlay'

const STATUS_BG: Record<string, string> = {
  LIVRE: '#16a34a',
  RESERVADO: '#d97706',
  OCUPADO: '#dc2626',
  USO_NAO_AGENDADO: '#9333ea',
}

type DoorFlow =
  | { kind: 'idle' }
  | { kind: 'book' }
  | { kind: 'cancel'; booking: Booking }
  | { kind: 'extend'; booking: Booking }
  | {
      kind: 'success'
      variant: 'created' | 'cancelled' | 'extended'
      startTime: string
      endTime: string
      fullName?: string
    }

function Clock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="tabular-nums">
      {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

interface DoorDisplayScreenProps {
  roomId: string
}

export function DoorDisplayScreen({ roomId }: DoorDisplayScreenProps) {
  const [status, setStatus] = useState<RoomStatusData | null>(null)
  const [flow, setFlow] = useState<DoorFlow>({ kind: 'idle' })
  const wsRef = useRef<WebSocket | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), "EEE d MMM", { locale: ptBR }).toUpperCase()
  const { data: rooms } = useRooms()
  const room = rooms?.find((r) => r.id === roomId)
  const { data: bookings = [] } = useBookings(roomId, today)

  const activeBooking = useMemo<Booking | null>(() => {
    if (!status?.active_booking) return null
    return bookings.find((b) => b.id === status.active_booking?.booking_id) ?? null
  }, [bookings, status])

  // Fetch inicial status
  useEffect(() => {
    fetch(`${STATUS_API_URL}/rooms/status/${roomId}`)
      .then((r) => r.json())
      .then((data: RoomStatusData) => setStatus(data))
      .catch(() => {})
  }, [roomId])

  // WebSocket para esta sala
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
        } catch {
          // ignore malformed frames
        }
      }
      ws.onclose = () => setTimeout(connect, 3000)
    }
    connect()
    return () => wsRef.current?.close()
  }, [roomId])

  const bg = status ? STATUS_BG[status.status] ?? '#1f2937' : '#1f2937'
  const roomName = room?.name ?? roomId
  const isFree = status?.status === 'LIVRE'
  const canBook = isFree && !!room
  const closeFlow = () => setFlow({ kind: 'idle' })

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none">
      {/* STATUS — 55% */}
      <div
        className="basis-0 grow-[55] flex flex-col text-white transition-colors duration-700 relative"
        style={{ backgroundColor: bg }}
      >
        <div className="flex items-start justify-between px-10 pt-8">
          <div className="flex items-center gap-2 text-white/70 text-xs tracking-widest">
            <span
              className={`w-2.5 h-2.5 rounded-full bg-white ${status?.presence ? 'animate-pulse' : 'opacity-30'}`}
            />
            {status?.presence ? 'PRESENÇA DETECTADA' : 'SEM PRESENÇA'}
          </div>
          <div className="text-white/75 text-2xl font-light">
            <Clock />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center gap-6">
          <h1 className="font-script text-7xl leading-none">{roomName}</h1>
          <p className="text-3xl font-semibold tracking-wide uppercase opacity-95">
            {status?.label ?? '—'}
          </p>
          {status?.active_booking && (
            <div className="mt-2 space-y-1 text-white/85">
              <p className="text-xl">{status.active_booking.username}</p>
              <p className="text-lg font-light tabular-nums">
                {new Date(status.active_booking.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(status.active_booking.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="px-10 pb-10 flex gap-3">
          {canBook && (
            <button
              type="button"
              onClick={() => setFlow({ kind: 'book' })}
              className="flex-1 bg-white text-gray-900 rounded-2xl py-5 text-base font-semibold tracking-wide cursor-pointer hover:bg-white/90"
            >
              Reservar agora
            </button>
          )}
          {activeBooking && (
            <>
              <button
                type="button"
                onClick={() => setFlow({ kind: 'extend', booking: activeBooking })}
                className="flex-1 bg-white/15 hover:bg-white/25 text-white rounded-2xl py-5 text-base font-semibold tracking-wide cursor-pointer backdrop-blur-sm border border-white/30"
              >
                Estender +30
              </button>
              <button
                type="button"
                onClick={() => setFlow({ kind: 'cancel', booking: activeBooking })}
                className="flex-1 bg-white text-gray-900 rounded-2xl py-5 text-base font-semibold tracking-wide cursor-pointer hover:bg-white/90"
              >
                Cancelar
              </button>
            </>
          )}
          {!canBook && !activeBooking && (
            <button
              type="button"
              disabled
              className="flex-1 bg-white/10 text-white/70 rounded-2xl py-5 text-base font-semibold tracking-wide cursor-not-allowed backdrop-blur-sm border border-white/20"
            >
              Sem ações disponíveis
            </button>
          )}
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center">
              <span className="text-gray-900 text-[10px] font-bold">S</span>
            </div>
            <span className="text-white text-[10px] tracking-[0.3em]">SAMSUNG</span>
          </div>
        </div>
      </div>

      {/* AGENDA — 45% */}
      <div className="basis-0 grow-[45] bg-[#f5f3ef] flex flex-col">
        <div className="px-8 pt-8 pb-4">
          <p className="text-[10px] tracking-widest text-gray-400">AGENDA DO DIA</p>
          <h2 className="font-script text-3xl text-gray-800 mt-1">{todayLabel}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {bookings.length === 0
              ? 'Nenhuma reserva hoje'
              : `${bookings.length} reserva${bookings.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex-1 px-6 pb-6 min-h-0">
          <div className="relative h-full bg-white rounded-2xl border border-gray-200 px-4 py-6 overflow-hidden">
            <VerticalTimeline
              bookings={bookings}
              isToday
              accentColor={room?.color_accent ?? '#171412'}
            />
          </div>
        </div>
      </div>

      {/* Overlays */}
      {flow.kind === 'book' && room && (
        <DoorBookOverlay
          room={room}
          date={today}
          onClose={closeFlow}
          onSuccess={(booking, fullName) =>
            setFlow({
              kind: 'success',
              variant: 'created',
              startTime: booking.start_time,
              endTime: booking.end_time,
              fullName,
            })
          }
        />
      )}

      {flow.kind === 'cancel' && room && (
        <DoorCancelOverlay
          booking={flow.booking}
          room={room}
          date={today}
          onClose={closeFlow}
          onSuccess={() =>
            setFlow({
              kind: 'success',
              variant: 'cancelled',
              startTime: flow.booking.start_time,
              endTime: flow.booking.end_time,
            })
          }
        />
      )}

      {flow.kind === 'extend' && room && (
        <DoorExtendOverlay
          booking={flow.booking}
          room={room}
          date={today}
          onClose={closeFlow}
          onSuccess={(updated) =>
            setFlow({
              kind: 'success',
              variant: 'extended',
              startTime: updated.start_time,
              endTime: updated.end_time,
              fullName: updated.full_name,
            })
          }
        />
      )}

      {flow.kind === 'success' && (
        <DoorSuccessOverlay
          variant={flow.variant}
          roomName={roomName}
          startTime={flow.startTime}
          endTime={flow.endTime}
          fullName={flow.fullName}
          onDone={closeFlow}
        />
      )}
    </div>
  )
}
