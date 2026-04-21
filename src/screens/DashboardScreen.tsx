import { useRooms } from '../hooks/useRooms'
import { useRoomStatusMap } from '../hooks/useRoomStatusMap'
import { useNav } from '../contexts/NavigationContext'
import { StatusBadge } from '../components/StatusBadge'
import { Spinner } from '../components/ui/Spinner'
import type { RoomStatusData } from '../types/roomStatus'

function RoomCard({ room, status }: { room: { id: string; name: string; color_bg: string; color_accent: string }, status?: RoomStatusData }) {
  const defaultStatus: RoomStatusData = {
    type: 'room_status_update',
    room_id: room.id,
    status: 'LIVRE',
    color: '#22c55e',
    label: 'Livre',
    presence: false,
    active_booking: null,
  }

  const s = status ?? defaultStatus

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3 min-h-[160px] justify-between"
      style={{ backgroundColor: room.color_bg }}
    >
      <div className="flex items-start justify-between">
        <h2 className="font-script text-3xl leading-tight" style={{ color: room.color_accent }}>
          {room.name}
        </h2>
        <StatusBadge color={s.color} label={s.label} size="lg" />
      </div>

      <div className="space-y-1">
        {s.presence && (
          <p className="text-xs font-medium" style={{ color: room.color_accent, opacity: 0.7 }}>
            Presença detectada
          </p>
        )}
        {s.active_booking && (
          <p className="text-xs" style={{ color: room.color_accent, opacity: 0.7 }}>
            {s.active_booking.username} · até {new Date(s.active_booking.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {!s.active_booking && !s.presence && (
          <p className="text-xs" style={{ color: room.color_accent, opacity: 0.5 }}>
            Sem reserva ativa
          </p>
        )}
      </div>
    </div>
  )
}

export function DashboardScreen() {
  const { data: rooms, isLoading } = useRooms()
  const statusMap = useRoomStatusMap()
  const { goHome } = useNav()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <div>
          <h1 className="font-script text-2xl text-gray-800">Painel de Salas</h1>
          <p className="text-xs text-gray-400 tracking-wide mt-0.5">Status em tempo real</p>
        </div>
        <button
          onClick={goHome}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-4 py-2 rounded-xl hover:bg-gray-100"
        >
          ← Voltar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading && (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        )}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {rooms?.map(room => (
            <RoomCard key={room.id} room={room} status={statusMap[room.id]} />
          ))}
        </div>
      </div>
    </div>
  )
}
