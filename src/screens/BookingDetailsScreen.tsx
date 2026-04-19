import { useState } from 'react'
import { useNav } from '../contexts/NavigationContext'
import type { Booking } from '../types/booking'
import type { Room } from '../types/room'
import { useExtendBooking } from '../hooks/useExtendBooking'
import { parseApiError } from '../lib/api-client'
import { Spinner } from '../components/ui/Spinner'

interface Props {
  booking: Booking
  room: Room
}

export function BookingDetailsScreen({ booking, room }: Props) {
  const { navigate, goHome, selectedDate } = useNav()
  const [extendError, setExtendError] = useState('')
  const extendMutation = useExtendBooking(booking.room_id, selectedDate)

  const handleExtend = () => {
    setExtendError('')
    extendMutation.mutate(booking.id, {
      onSuccess: (updated) => {
        navigate({
          kind: 'confirmation',
          variant: 'extended',
          roomName: room.name,
          startTime: updated.start_time,
          endTime: updated.end_time,
          date: updated.date,
          fullName: updated.full_name,
        })
      },
      onError: (err) => setExtendError(parseApiError(err)),
    })
  }

  return (
    <div className="flex flex-col h-full px-8 py-6">
      {/* Título */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] tracking-widest text-gray-400 mb-1">DETALHES DA RESERVA</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {room.name} · {booking.start_time} – {booking.end_time}
          </h1>
        </div>
        <button
          onClick={goHome}
          className="border border-gray-300 rounded-lg w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div className="flex gap-6 flex-1">
        {/* Card de info da reserva */}
        <div className="flex-1 border border-gray-200 rounded-2xl p-6 bg-white space-y-5">
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 mb-1">ORGANIZADOR</p>
            <p className="text-xl font-bold text-gray-900">{booking.full_name}</p>
          </div>

          <div className="border-t border-dashed border-gray-200" />

          <div className="flex gap-12">
            <div>
              <p className="text-[10px] tracking-widest text-gray-400 mb-1">INÍCIO</p>
              <p className="font-script text-4xl" style={{ color: room.color_accent }}>
                {booking.start_time}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-widest text-gray-400 mb-1">FIM</p>
              <p className="font-script text-4xl" style={{ color: room.color_accent }}>
                {booking.end_time}
              </p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200" />

          <p className="text-sm text-gray-400 italic">
            para mexer nessa reserva você precisa confirmar com seu usuário →
          </p>

          {extendError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {extendError}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="w-72 space-y-3">
          {/* Estender */}
          <button
            onClick={handleExtend}
            disabled={extendMutation.isPending}
            className="w-full border border-gray-300 rounded-2xl p-4 flex items-center gap-4 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors text-left"
          >
            <div className="w-12 h-12 border border-gray-300 rounded-xl flex items-center justify-center font-bold text-gray-800 flex-shrink-0">
              {extendMutation.isPending ? <Spinner size={16} /> : '+30'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Estender</p>
              <p className="text-xs text-gray-400">adiciona 30 min ao fim, se o próximo estiver livre</p>
            </div>
          </button>

          {/* Cancelar */}
          <button
            onClick={() => navigate({ kind: 'cancel-confirm', booking, room })}
            className="w-full border border-red-200 rounded-2xl p-4 flex items-center gap-4 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors text-left"
          >
            <div className="w-12 h-12 border border-red-300 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0 text-xl">
              ×
            </div>
            <div>
              <p className="font-semibold text-red-600">Cancelar reserva</p>
              <p className="text-xs text-red-400">libera este horário para outras pessoas</p>
            </div>
          </button>

          {/* Voltar */}
          <button
            onClick={goHome}
            className="w-full border border-gray-200 rounded-2xl p-4 flex items-center gap-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors text-left"
          >
            <div className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
              ←
            </div>
            <div>
              <p className="font-semibold text-gray-700">Voltar</p>
              <p className="text-xs text-gray-400">sem mudanças</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
