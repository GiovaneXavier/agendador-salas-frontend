import { useState } from 'react'
import { useNav } from '../contexts/NavigationContext'
import type { Booking } from '../types/booking'
import type { Room } from '../types/room'
import { VirtualKeyboard } from '../components/VirtualKeyboard'
import { useCancelBooking } from '../hooks/useCancelBooking'
import { parseApiError } from '../lib/api-client'
import { Spinner } from '../components/ui/Spinner'

interface Props {
  booking: Booking
  room: Room
}

export function CancelConfirmScreen({ booking, room }: Props) {
  const { navigate, selectedDate } = useNav()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const cancelMutation = useCancelBooking(booking.room_id, selectedDate)

  const isValid = username.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(username)

  const handleCancel = () => {
    setError('')
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
        onError: (err) => setError(parseApiError(err)),
      },
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4">
        <p className="text-[11px] tracking-widest text-red-400">CONFIRMAR CANCELAMENTO</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Confirme seu usuário para cancelar</h1>
        <p className="font-script text-gray-400 mt-1">só o organizador (ou um admin) pode cancelar</p>
      </div>

      <div className="flex-1 flex gap-8 px-8 pb-4">
        {/* Preview + input */}
        <div className="w-80 flex-shrink-0 space-y-3">
          {/* Booking being cancelled */}
          <div className="border border-red-200 rounded-2xl p-5 bg-red-50">
            <p className="text-[10px] tracking-widest text-red-400 mb-2">SERÁ CANCELADA</p>
            <p className="font-bold text-gray-900">
              {room.name} · {booking.start_time}–{booking.end_time}
            </p>
            <p className="text-sm text-gray-500 mt-1">organizador: <strong>{booking.full_name}</strong></p>
          </div>

          {/* Username input display */}
          <div className="border border-gray-200 rounded-2xl p-5 bg-white">
            <p className="text-[10px] tracking-widest text-gray-400 mb-2">SEU USUÁRIO</p>
            <p className="font-mono text-2xl font-bold text-gray-900 min-h-8">
              {username || <span className="text-gray-300">nome.sobrenome</span>}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Keyboard */}
        <div className="flex-1">
          <VirtualKeyboard value={username} onChange={setUsername} />
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
        <button
          onClick={handleCancel}
          disabled={!isValid || cancelMutation.isPending}
          className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm hover:bg-gray-700 cursor-pointer tracking-wider disabled:opacity-40 flex items-center gap-2"
        >
          {cancelMutation.isPending && <Spinner size={14} />}
          CANCELAR RESERVA ×
        </button>
      </div>
    </div>
  )
}
