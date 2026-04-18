import { Room } from '../types/room'

interface RoomCardProps {
  room: Room
  bookingCount: number
  onClick: () => void
}

export function RoomCard({ room, bookingCount, onClick }: RoomCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ backgroundColor: room.color_bg }}
    >
      <div
        className="w-10 h-10 rounded-xl mb-4"
        style={{ backgroundColor: room.color_accent }}
      />
      <h2 className="text-lg font-semibold" style={{ color: room.color_accent }}>
        {room.name}
      </h2>
      <p className="text-sm mt-1" style={{ color: room.color_accent, opacity: 0.7 }}>
        {bookingCount === 0
          ? 'Nenhuma reserva hoje'
          : `${bookingCount} reserva${bookingCount > 1 ? 's' : ''} hoje`}
      </p>
    </button>
  )
}
