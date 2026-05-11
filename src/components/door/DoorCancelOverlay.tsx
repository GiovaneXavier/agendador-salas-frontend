import { useState } from 'react'
import type { Booking } from '../../types/booking'
import type { Room } from '../../types/room'
import { useCancelBooking } from '../../hooks/useCancelBooking'
import { parseApiError } from '../../lib/api-client'
import { Spinner } from '../ui/Spinner'
import { KnoxScanner } from '../KnoxScanner'
import { DoorOverlayShell } from './DoorOverlayShell'

interface DoorCancelOverlayProps {
  booking: Booking
  room: Room
  date: string
  onClose: () => void
  onSuccess: () => void
}

export function DoorCancelOverlay({ booking, room, date, onClose, onSuccess }: DoorCancelOverlayProps) {
  const [error, setError] = useState('')
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const cancelMutation = useCancelBooking(room.id, date)

  const handleScan = (username: string) => {
    setError('')
    setPendingUser(username)
    cancelMutation.mutate(
      { id: booking.id, payload: { username } },
      {
        onSuccess: () => onSuccess(),
        onError: (err) => {
          setError(parseApiError(err))
          setPendingUser(null)
        },
      },
    )
  }

  return (
    <DoorOverlayShell
      eyebrow="CANCELAR RESERVA"
      title="Aproxime o crachá do organizador"
      onClose={onClose}
      footer={
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
          >
            ← VOLTAR
          </button>
        </div>
      }
    >
      <div className="flex gap-8 h-full">
        <div className="w-80 flex-shrink-0 space-y-3">
          <div className="border border-red-200 rounded-2xl p-5 bg-red-50">
            <p className="text-[10px] tracking-widest text-red-400 mb-2">SERÁ CANCELADA</p>
            <p className="font-bold text-gray-900">
              {room.name} · {booking.start_time}–{booking.end_time}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              organizador: <strong>{booking.full_name}</strong>
            </p>
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
        <div className="flex-1 min-w-0">
          <KnoxScanner onScan={handleScan} />
        </div>
      </div>
    </DoorOverlayShell>
  )
}
