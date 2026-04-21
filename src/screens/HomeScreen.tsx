import { format, addDays, isWeekend } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRooms } from '../hooks/useRooms'
import { useBookings } from '../hooks/useBookings'
import { useRoomStatusMap } from '../hooks/useRoomStatusMap'
import { RoomRow } from '../components/RoomRow'
import { Spinner } from '../components/ui/Spinner'
import { useNav } from '../contexts/NavigationContext'
import type { Room } from '../types/room'
import type { Booking } from '../types/booking'

function getWeekdays(count: number): { label: string; day: number; date: string }[] {
  const result = []
  let d = new Date()
  while (result.length < count) {
    if (!isWeekend(d)) {
      result.push({
        label: result.length === 0 ? 'Hoje' : format(d, 'EEE', { locale: ptBR }).replace('.', ''),
        day: d.getDate(),
        date: format(d, 'yyyy-MM-dd'),
      })
    }
    d = addDays(d, 1)
  }
  return result
}

function RoomRowWrapper({
  room, date, isToday, statusMap,
}: {
  room: Room
  date: string
  isToday: boolean
  statusMap: ReturnType<typeof useRoomStatusMap>
}) {
  const { data: bookings = [], isLoading } = useBookings(room.id, date)
  const { navigate } = useNav()

  if (isLoading) return (
    <div className="rounded-2xl p-5 flex items-center justify-center h-28" style={{ backgroundColor: room.color_bg }}>
      <Spinner size={20} />
    </div>
  )

  return (
    <RoomRow
      room={room}
      bookings={bookings}
      date={date}
      isToday={isToday}
      sensorStatus={statusMap[room.id]}
      onSlotClick={(r, d, min) => navigate({ kind: 'book-step1', room: r, date: d, startMinute: min })}
      onBookingClick={(b: Booking, r: Room) => navigate({ kind: 'booking-details', booking: b, room: r })}
    />
  )
}

export function HomeScreen() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: rooms, isLoading, isError } = useRooms()
  const { selectedDate, setSelectedDate, navigate } = useNav()
  const statusMap = useRoomStatusMap()
  const days = getWeekdays(4)
  const isToday = selectedDate === today

  return (
    <div className="flex flex-col h-full">
      {/* Header da tela principal */}
      <div className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <div>
            <h1 className="font-script text-2xl leading-none text-gray-800">Salas · Andar 3</h1>
            <p className="text-xs text-gray-400 mt-0.5 tracking-wide">
              {format(new Date(selectedDate + 'T12:00:00'), "EEE d MMM", { locale: ptBR }).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Navegação de dias */}
        <div className="flex gap-1">
          {days.map(d => (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={[
                'flex flex-col items-center px-4 py-2 rounded-xl cursor-pointer transition-colors text-sm',
                selectedDate === d.date
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              ].join(' ')}
            >
              <span className="text-[11px] tracking-wider capitalize">{d.label}</span>
              <span className="text-lg font-semibold leading-none">{d.day}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Salas */}
      <div className="flex-1 px-8 pb-6 space-y-4 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-gray-500 font-semibold">Não foi possível conectar à API</p>
            <p className="text-xs text-gray-400 tracking-wide">Verifique a conexão com o servidor</p>
          </div>
        )}
        {rooms?.map(room => (
          <RoomRowWrapper key={room.id} room={room} date={selectedDate} isToday={isToday} statusMap={statusMap} />
        ))}
      </div>

      {/* Rodapé */}
      <footer className="flex items-center justify-between px-8 text-xs text-gray-400 tracking-wider py-3 border-t border-gray-100">
        <span>Toque em um horário · Reservas até o fim do expediente (20:00)</span>
        <button
          onClick={() => navigate({ kind: 'dashboard' })}
          className="text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Painel geral
        </button>
      </footer>
    </div>
  )
}
