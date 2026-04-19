import { useState } from 'react'
import { useNav } from '../contexts/NavigationContext'
import type { Room } from '../types/room'
import type { ValidDuration } from '../types/booking'
import { VALID_DURATIONS } from '../lib/constants'

const DURATIONS = VALID_DURATIONS as unknown as ValidDuration[]

interface Props {
  room: Room
  date: string
  startMinute: number
}

function minuteToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function BookingStep1Screen({ room, date, startMinute }: Props) {
  const { navigate, goHome } = useNav()
  const [selected, setSelected] = useState<ValidDuration>(30)

  const endMinute = startMinute + selected
  const endTime = minuteToTime(endMinute)
  const startTime = minuteToTime(startMinute)

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="px-8 pt-6 pb-4">
        <p className="text-[11px] tracking-widest text-gray-400">PASSO 1 DE 2 · NOVA RESERVA</p>
        <div className="flex gap-1.5 mt-2">
          <div className="h-0.5 w-16 bg-gray-900 rounded-full" />
          <div className="h-0.5 w-16 bg-gray-200 rounded-full" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Quanto tempo?</h1>
      </div>

      <div className="flex-1 flex gap-8 px-8 pb-8">
        {/* Preview card */}
        <div className="w-64 flex-shrink-0 border border-gray-200 rounded-2xl p-6 bg-white space-y-4">
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 mb-1">SALA</p>
            <p className="font-bold text-lg text-gray-900">{room.name}</p>
            {(room.capacity > 0 || room.resources.length > 0) && (
              <p className="text-[10px] tracking-widest mt-0.5" style={{ color: room.color_accent, opacity: 0.6 }}>
                {[room.capacity > 0 ? `${room.capacity} PESSOAS` : null, ...room.resources].filter(Boolean).join(' · ')}
              </p>
            )}
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
              {endTime} <span className="text-sm font-normal text-gray-400">{selected}min</span>
            </p>
          </div>
        </div>

        {/* Duration grid */}
        <div className="flex-1">
          <p className="text-[11px] tracking-widest text-gray-400 mb-4">ESCOLHA A DURAÇÃO</p>
          <div className="grid grid-cols-2 gap-3">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => setSelected(d)}
                style={selected === d ? { borderColor: room.color_accent, backgroundColor: room.color_bg } : {}}
                className={[
                  'border-2 rounded-2xl p-6 text-left cursor-pointer transition-colors',
                  selected === d ? '' : 'border-gray-200 bg-white hover:border-gray-300',
                ].join(' ')}
              >
                <p className="text-4xl font-bold text-gray-900">{d}</p>
                <p className="text-xs tracking-widest text-gray-400 mt-1">MINUTOS</p>
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-4 italic">→ próximo: identificação</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-8 py-4 flex justify-between">
        <button
          onClick={goHome}
          className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
        >
          ← VOLTAR
        </button>
        <button
          onClick={() => navigate({ kind: 'book-step2', room, date, startMinute, duration: selected })}
          className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm hover:bg-gray-700 cursor-pointer tracking-wider"
        >
          CONTINUAR →
        </button>
      </div>
    </div>
  )
}
