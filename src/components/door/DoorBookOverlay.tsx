import { useMemo, useState } from 'react'
import type { Room } from '../../types/room'
import type { Booking, ValidDuration } from '../../types/booking'
import { DAY_END, DAY_START } from '../../lib/constants'
import { useCreateBooking } from '../../hooks/useCreateBooking'
import { parseApiError } from '../../lib/api-client'
import { deriveFullName } from '../../lib/utils'
import { Spinner } from '../ui/Spinner'
import { DurationPicker } from '../DurationPicker'
import { KnoxScanner } from '../KnoxScanner'
import { DoorOverlayShell } from './DoorOverlayShell'

function minuteToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function nextSlotMinute() {
  const d = new Date()
  const now = d.getHours() * 60 + d.getMinutes()
  return Math.max(DAY_START, Math.ceil(now / 30) * 30)
}

type Step = 'duration' | 'scan'

interface DoorBookOverlayProps {
  room: Room
  date: string
  onClose: () => void
  onSuccess: (booking: Booking, fullName: string) => void
}

export function DoorBookOverlay({ room, date, onClose, onSuccess }: DoorBookOverlayProps) {
  const [step, setStep] = useState<Step>('duration')
  const [duration, setDuration] = useState<ValidDuration>(30)
  const [error, setError] = useState('')
  const [pendingUser, setPendingUser] = useState<string | null>(null)

  const startMinute = useMemo(() => nextSlotMinute(), [])
  const startTime = minuteToTime(startMinute)
  const endTime = minuteToTime(startMinute + duration)
  const tooLate = startMinute + duration > DAY_END

  const createMutation = useCreateBooking(room.id, date)

  const handleScan = (username: string) => {
    setError('')
    setPendingUser(username)
    createMutation.mutate(
      { room_id: room.id, date, start_minute: startMinute, duration_minutes: duration, username },
      {
        onSuccess: (booking) => {
          onSuccess(booking, booking.full_name || deriveFullName(username))
        },
        onError: (err) => {
          setError(parseApiError(err))
          setPendingUser(null)
        },
      },
    )
  }

  if (step === 'duration') {
    return (
      <DoorOverlayShell
        eyebrow="RESERVAR AGORA · PASSO 1 DE 2"
        title="Quanto tempo?"
        onClose={onClose}
        footer={
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
            >
              ← CANCELAR
            </button>
            <button
              type="button"
              disabled={tooLate}
              onClick={() => setStep('scan')}
              className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm hover:bg-gray-700 cursor-pointer tracking-wider disabled:opacity-40"
            >
              CONTINUAR →
            </button>
          </div>
        }
      >
        <div className="flex gap-8 h-full">
          <div className="w-72 flex-shrink-0 border border-gray-200 rounded-2xl p-6 bg-white space-y-4">
            <div>
              <p className="text-[10px] tracking-widest text-gray-400 mb-1">SALA</p>
              <p className="font-bold text-lg text-gray-900">{room.name}</p>
            </div>
            <div className="border-t border-dashed border-gray-200" />
            <div>
              <p className="text-[10px] tracking-widest text-gray-400 mb-1">INÍCIO</p>
              <p className="font-script text-4xl" style={{ color: room.color_accent }}>{startTime}</p>
            </div>
            <div className="border-t border-dashed border-gray-200" />
            <div>
              <p className="text-[10px] tracking-widest text-gray-400 mb-1">FIM</p>
              <p className="text-2xl font-bold text-gray-900">
                {endTime} <span className="text-sm font-normal text-gray-400">{duration}min</span>
              </p>
            </div>
            {tooLate && (
              <p className="text-xs text-red-500">Ultrapassa o fim do expediente.</p>
            )}
          </div>

          <div className="flex-1">
            <p className="text-[11px] tracking-widest text-gray-400 mb-4">ESCOLHA A DURAÇÃO</p>
            <DurationPicker
              value={duration}
              onChange={setDuration}
              accentColor={room.color_accent}
              accentBg={room.color_bg}
            />
          </div>
        </div>
      </DoorOverlayShell>
    )
  }

  return (
    <DoorOverlayShell
      eyebrow="RESERVAR AGORA · PASSO 2 DE 2"
      title="Aproxime seu crachá Knox"
      onClose={onClose}
      footer={
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => { setStep('duration'); setError(''); setPendingUser(null) }}
            className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
          >
            ← VOLTAR
          </button>
        </div>
      }
    >
      <div className="flex gap-8 h-full">
        <div className="w-80 flex-shrink-0 space-y-3">
          <div className="border border-gray-200 rounded-2xl p-5 bg-white">
            <p className="text-[10px] tracking-widest text-gray-400 mb-2">RESERVA</p>
            <p className="font-bold text-gray-900">{room.name}</p>
            <p className="text-sm text-gray-500">{startTime} – {endTime}</p>
          </div>
          {pendingUser && createMutation.isPending && (
            <div className="border border-gray-200 rounded-2xl p-5 bg-white flex items-center gap-3">
              <Spinner size={18} />
              <div>
                <p className="text-[10px] tracking-widest text-gray-400">CONFIRMANDO</p>
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
