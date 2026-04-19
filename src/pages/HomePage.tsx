import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useRooms } from '../hooks/useRooms'
import { useBookings } from '../hooks/useBookings'
import { RoomCard } from '../components/RoomCard'
import { Spinner } from '../components/ui/Spinner'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import type { Room } from '../types/room'

const today = format(new Date(), 'yyyy-MM-dd')

function RoomCardWithCount({ room }: { room: Room }) {
  const { data: bookings = [] } = useBookings(room.id, today)
  const navigate = useNavigate()
  return (
    <RoomCard
      room={room}
      bookingCount={bookings.length}
      onClick={() => navigate(`/rooms/${room.id}`)}
    />
  )
}

export function HomePage() {
  const { data: rooms, isLoading, isError } = useRooms()

  return (
    <div className="min-h-screen bg-[#f5f3ef] px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Agendador de Salas</h1>
      <p className="text-sm text-gray-500 mb-8">Selecione uma sala para ver ou criar reservas</p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {isError && <ErrorAlert message="Não foi possível carregar as salas. Verifique a API." />}

      {rooms && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map(room => (
            <RoomCardWithCount key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}
