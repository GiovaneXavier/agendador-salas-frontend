import { useState } from 'react'
import { useNav } from '../contexts/NavigationContext'
import type { Booking } from '../types/booking'
import type { Room } from '../types/room'
import { KnoxScanner } from '../components/KnoxScanner'
import { useCancelBooking } from '../hooks/useCancelBooking'
import { parseApiError } from '../lib/api-client'
import { Spinner } from '../components/ui/Spinner'

interface Props {
  booking: Booking
  room: Room
}

export function CancelConfirmScreen({ booking, room }: Props) {
  const { navigate, selectedDate } = useNav()
  const [error, setError] = useState('')
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const cancelMutation = useCancelBooking(booking.room_id, selectedDate)

  const handleScan = (username: string) => {
    setError('')
    setPendingUser(username)
    cancelMutation.mutate(
      { id: booking.id, payload: { username } },
      {
        onSuccess: () => {
          navigate({
            kind: 'confirmation',
            variant: 'cancelled',
            roomName: room.name,
            startTime: booking.start_time,
            endTime: booking.end_time,
            date: booking.date,
          })
        },
        onError: (err) => {
          setError(parseApiError(err))
          setPendingUser(null)
        },
      },
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4">
        <p className="text-[11px] tracking-widest text-red-400">CONFIRMAR CANCELAMENTO</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Aproxime o crachá do organizador</h1>
        <p className="font-script text-gray-400 mt-1">só o organizador (ou um admin) pode cancelar</p>
      </div>

      <div className="flex-1 flex gap-8 px-8 pb-4 min-h-0">
        {/* Preview + status */}
        <div className="w-80 flex-shrink-0 space-y-3">
          <div className="border border-red-200 rounded-2xl p-5 bg-red-50">
            <p className="text-[10px] tracking-widest text-red-400 mb-2">SERÁ CANCELADA</p>
            <p className="font-bold text-gray-900">
              {room.name} · {booking.start_time}–{booking.end_time}
            </p>
            <p className="text-sm text-gray-500 mt-1">organizador: <strong>{booking.full_name}</strong></p>
          </div>

          {pendingUser && cancelMutation.isPending && (
            <div className="border border-gray-200 rounded-2xl p-5 bg-white flex items-center gap-3">
              <Spinner size={18} />
              <div>
                <p className="text-[10px] tracking-widest text-gray-400">VALIDANDO</p>
                <p className="font-mono text-base font-bold text-gray-900">{pendingUser}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Scanner */}
        <div className="flex-1 min-w-0">
          <KnoxScanner onScan={handleScan} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-8 py-4 flex justify-between">
        <button
          onClick={() => navigate({ kind: 'booking-details', booking, room })}
          className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
        >
          ← VOLTAR
        </button>
      </div>
    </div>
  )
}
