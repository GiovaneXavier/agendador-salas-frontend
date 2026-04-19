import { useState } from 'react'
import { useNav } from '../contexts/NavigationContext'
import type { Room } from '../types/room'
import type { ValidDuration } from '../types/booking'
import { VirtualKeyboard } from '../components/VirtualKeyboard'
import { useCreateBooking } from '../hooks/useCreateBooking'
import { parseApiError } from '../lib/api-client'
import { deriveFullName } from '../lib/utils'
import { Spinner } from '../components/ui/Spinner'

function minuteToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

interface Props {
  room: Room
  date: string
  startMinute: number
  duration: ValidDuration
}

export function BookingStep2Screen({ room, date, startMinute, duration }: Props) {
  const { navigate } = useNav()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const createMutation = useCreateBooking(room.id, date)

  const endTime = minuteToTime(startMinute + duration)
  const startTime = minuteToTime(startMinute)
  const isValid = username.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(username)

  const handleConfirm = () => {
    setError('')
    createMutation.mutate(
      { room_id: room.id, date, start_minute: startMinute, duration_minutes: duration, username },
      {
        onSuccess: (booking) => {
          navigate({
            kind: 'confirmation',
            variant: 'created',
            roomName: room.name,
            startTime: booking.start_time,
            endTime: booking.end_time,
            date: booking.date,
            fullName: booking.full_name || deriveFullName(username),
          })
        },
        onError: (err) => setError(parseApiError(err)),
      },
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="px-8 pt-6 pb-4">
        <p className="text-[11px] tracking-widest text-gray-400">PASSO 2 DE 2 · NOVA RESERVA</p>
        <div className="flex gap-1.5 mt-2">
          <div className="h-0.5 w-16 bg-gray-900 rounded-full" />
          <div className="h-0.5 w-16 bg-gray-900 rounded-full" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Qual seu ID de colaborador?</h1>
        <p className="font-script text-gray-400 mt-1">digite seu usuário</p>
        <p className="text-sm text-gray-400">ex: g.xavier, m.silva</p>
      </div>

      <div className="flex-1 flex gap-8 px-8 pb-4">
        {/* Preview + input */}
        <div className="w-80 flex-shrink-0 space-y-3">
          <div className="border border-gray-200 rounded-2xl p-5 bg-white">
            <p className="text-[10px] tracking-widest text-gray-400 mb-2">USUÁRIO</p>
            <p className="font-mono text-2xl font-bold text-gray-900 min-h-8">
              {username || <span className="text-gray-300">nome.sobrenome</span>}
            </p>
            {isValid && (
              <>
                <div className="border-t border-dashed border-gray-200 my-3" />
                <p className="text-[10px] tracking-widest text-green-600 mb-1">✓ FORMATO VÁLIDO</p>
                <p className="font-bold text-gray-900">{deriveFullName(username)}</p>
              </>
            )}
          </div>

          <div className="border border-gray-200 rounded-2xl p-5 bg-white">
            <p className="text-[10px] tracking-widest text-gray-400 mb-2">RESERVA</p>
            <p className="font-bold text-gray-900">{room.name}</p>
            <p className="text-sm text-gray-500">{startTime} – {endTime}</p>
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
          onClick={() => navigate({ kind: 'book-step1', room, date, startMinute })}
          className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
        >
          ← VOLTAR
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValid || createMutation.isPending}
          className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm hover:bg-gray-700 cursor-pointer tracking-wider disabled:opacity-40 flex items-center gap-2"
        >
          {createMutation.isPending && <Spinner size={14} />}
          CONFIRMAR →
        </button>
      </div>
    </div>
  )
}
