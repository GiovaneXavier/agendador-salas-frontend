import { useEffect, useRef, useState } from 'react'
import type { Booking } from '../../types/booking'
import type { Room } from '../../types/room'
import { useExtendBooking } from '../../hooks/useExtendBooking'
import { parseApiError } from '../../lib/api-client'
import { Spinner } from '../ui/Spinner'
import { DoorOverlayShell } from './DoorOverlayShell'

interface DoorExtendOverlayProps {
  booking: Booking
  room: Room
  date: string
  onClose: () => void
  onSuccess: (updated: Booking) => void
}

export function DoorExtendOverlay({ booking, room, date, onClose, onSuccess }: DoorExtendOverlayProps) {
  const [error, setError] = useState('')
  const triggeredRef = useRef(false)
  const extendMutation = useExtendBooking(room.id, date)

  useEffect(() => {
    if (triggeredRef.current) return
    triggeredRef.current = true
    extendMutation.mutate(booking.id, {
      onSuccess: (updated) => onSuccess(updated),
      onError: (err) => setError(parseApiError(err)),
    })
  }, [booking.id, extendMutation, onSuccess])

  return (
    <DoorOverlayShell
      eyebrow="ESTENDER RESERVA · +30 MIN"
      title={room.name}
      onClose={error ? onClose : undefined}
      footer={
        error ? (
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
            >
              ← VOLTAR
            </button>
          </div>
        ) : null
      }
    >
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
        {!error ? (
          <>
            <Spinner size={36} />
            <p className="text-lg text-gray-700">Estendendo reserva atual em +30 minutos…</p>
            <p className="text-sm text-gray-500">
              {booking.start_time} – {booking.end_time} · organizador {booking.full_name}
            </p>
          </>
        ) : (
          <div className="rounded-xl bg-red-50 border border-red-200 px-6 py-4 text-sm text-red-600 max-w-md">
            {error}
          </div>
        )}
      </div>
    </DoorOverlayShell>
  )
}
