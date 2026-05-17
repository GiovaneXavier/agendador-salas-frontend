import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Room } from '../../types/room'
import type { Booking, ValidDuration } from '../../types/booking'
import { DAY_END, DAY_START, VALID_DURATIONS } from '../../lib/constants'
import { useCreateBooking } from '../../hooks/useCreateBooking'
import { parseApiError } from '../../lib/api-client'
import { deriveFullName } from '../../lib/utils'
import { Spinner } from '../ui/Spinner'
import { KnoxOCRScanner } from '../KnoxOCRScanner'
import { WheelPicker } from '../WheelPicker'
import { DoorOverlayShell } from './DoorOverlayShell'

function minuteToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function nextSlotMinute() {
  const d = new Date()
  const now = d.getHours() * 60 + d.getMinutes()
  return Math.max(DAY_START, Math.min(DAY_END - 30, Math.ceil(now / 15) * 15))
}

// Hours 07–20 (inclusive); end of day is 21:00, so 21 isn't a valid start.
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) as readonly number[]
const MINUTES = [0, 15, 30, 45] as const

// Backend aceita {30,60,90,120}. Presets 30/60 ficam expostos; o "Personalizado"
// expõe os demais valores válidos.
const PRESET_DURATIONS = [30, 60] as const
const CUSTOM_DURATIONS = (VALID_DURATIONS as readonly ValidDuration[]).filter(
  (d) => !PRESET_DURATIONS.includes(d as 30 | 60),
)

type Step = 'time' | 'identify'

interface DoorBookOverlayProps {
  room: Room
  date: string
  onClose: () => void
  onSuccess: (booking: Booking, fullName: string) => void
}

export function DoorBookOverlay({ room, date, onClose, onSuccess }: DoorBookOverlayProps) {
  const initialStart = useMemo(() => nextSlotMinute(), [])

  const [step, setStep] = useState<Step>('time')
  const [hour, setHour] = useState<number>(Math.floor(initialStart / 60))
  const [minute, setMinute] = useState<number>(
    [0, 15, 30, 45].reduce((a, b) =>
      Math.abs(b - (initialStart % 60)) < Math.abs(a - (initialStart % 60)) ? b : a,
    0),
  )
  const [duration, setDuration] = useState<ValidDuration>(30)
  const [customMode, setCustomMode] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [pendingUser, setPendingUser] = useState<string | null>(null)

  const startMinute = hour * 60 + minute
  const endMinute = startMinute + duration
  const startTime = minuteToTime(startMinute)
  const endTime = minuteToTime(endMinute)
  const tooLate = endMinute > DAY_END
  const dateLabel = format(new Date(date + 'T12:00:00'), "EEE d MMM", { locale: ptBR })

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

  // ---------- STEP 1: time + duration (wheel picker) ----------
  if (step === 'time') {
    return (
      <DoorOverlayShell
        eyebrow={`RESERVAR AGORA · PASSO 1 DE 2 · ${room.name.toUpperCase()} · ${dateLabel.toUpperCase()}`}
        title="Quando começa?"
        onClose={onClose}
        footer={
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
            >
              CANCELAR
            </button>
            <button
              type="button"
              disabled={tooLate}
              onClick={() => setStep('identify')}
              className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm hover:bg-gray-700 cursor-pointer tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
            >
              CONTINUAR →
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-8 h-full overflow-y-auto">
          {/* Horário de início — wheel pickers */}
          <section>
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] tracking-widest text-gray-400">HORÁRIO DE INÍCIO</p>
              <p className="text-[11px] tracking-wider text-gray-400 font-mono">
                07:00 — 20:45 · passos de 15 min
              </p>
            </div>
            <div className="flex items-center justify-center gap-5 mt-4">
              <WheelPicker
                values={HOURS}
                value={hour}
                onChange={setHour}
                format={(v) => String(v).padStart(2, '0')}
                accentColor={room.color_accent}
              />
              <span
                className="font-script text-5xl text-gray-300 leading-none"
                style={{ marginTop: -8 }}
              >
                :
              </span>
              <WheelPicker
                values={MINUTES as unknown as readonly number[]}
                value={minute}
                onChange={(v) => setMinute(v)}
                format={(v) => String(v).padStart(2, '0')}
                accentColor={room.color_accent}
              />
            </div>
          </section>

          {/* Duração */}
          <section>
            <p className="text-[10px] tracking-widest text-gray-400">DURAÇÃO</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <DurationCard
                active={!customMode && duration === 30}
                onClick={() => {
                  setCustomMode(false)
                  setDuration(30)
                }}
                main="30"
                sub="MINUTOS"
                accentColor={room.color_accent}
                accentBg={room.color_bg}
              />
              <DurationCard
                active={!customMode && duration === 60}
                onClick={() => {
                  setCustomMode(false)
                  setDuration(60)
                }}
                main="60"
                sub="MINUTOS"
                accentColor={room.color_accent}
                accentBg={room.color_bg}
              />
              <DurationCard
                active={customMode}
                onClick={() => {
                  setCustomMode(true)
                  if (!CUSTOM_DURATIONS.includes(duration)) {
                    setDuration(CUSTOM_DURATIONS[0])
                  }
                }}
                main={customMode ? String(duration) : '⋯'}
                sub={customMode ? 'MIN · PERSONALIZADO' : 'PERSONALIZADO'}
                accentColor={room.color_accent}
                accentBg={room.color_bg}
              />
            </div>

            {customMode && (
              <div className="mt-3 border border-gray-200 bg-gray-50 rounded-2xl px-4 py-4">
                <p className="text-[10px] tracking-widest text-gray-400 mb-3">
                  ESCOLHA A DURAÇÃO
                </p>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_DURATIONS.map((d) => {
                    const active = duration === d
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={[
                          'px-4 py-2.5 rounded-full font-mono text-sm font-semibold border-2 cursor-pointer tracking-wider min-w-16 transition-colors',
                          active
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400',
                        ].join(' ')}
                      >
                        {d} min
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Preview pill */}
          <div
            className="flex items-center justify-center gap-4 rounded-2xl border-2 px-6 py-4"
            style={{
              borderColor: tooLate ? '#fecaca' : room.color_accent,
              backgroundColor: tooLate ? '#fef2f2' : room.color_bg,
              color: tooLate ? '#b91c1c' : room.color_accent,
            }}
          >
            <span className="text-[10px] font-bold tracking-widest uppercase">
              {tooLate ? 'Fim do expediente' : 'Reserva'}
            </span>
            <span className="font-script text-3xl">
              {startTime} <span className="opacity-40">→</span> {endTime}
            </span>
            <span className="font-mono text-xs opacity-70 tracking-wider">({duration} min)</span>
          </div>
        </div>
      </DoorOverlayShell>
    )
  }

  // ---------- STEP 2: summary + Knox scanner ----------
  return (
    <DoorOverlayShell
      eyebrow={`RESERVAR AGORA · PASSO 2 DE 2 · ${room.name.toUpperCase()} · ${dateLabel.toUpperCase()}`}
      title="Aproxime seu crachá Knox"
      onClose={onClose}
      footer={
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => {
              setStep('time')
              setError('')
              setPendingUser(null)
            }}
            className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
          >
            ← VOLTAR
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 rounded-xl px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer tracking-wider"
          >
            CANCELAR
          </button>
        </div>
      }
    >
      <div className="flex gap-8 h-full min-h-0">
        {/* Resumo da reserva */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-3">
          <p className="text-[10px] tracking-widest text-gray-400">RESUMO DA RESERVA</p>

          <div className="border border-gray-200 rounded-2xl p-5 bg-white space-y-4">
            <SummaryRow
              label="SALA"
              value={room.name}
              sub={
                room.capacity > 0 || room.resources.length > 0
                  ? [
                      room.capacity > 0 ? `${room.capacity} pessoas` : null,
                      ...room.resources,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : undefined
              }
            />
            <div className="h-px bg-gray-100" />
            <SummaryRow label="DATA" value={dateLabel} sub={date.slice(0, 4)} />
            <div className="h-px bg-gray-100" />
            <SummaryRow
              label="HORÁRIO"
              value={
                <span className="font-mono">
                  {startTime} – {endTime}
                </span>
              }
              sub={`${duration} minutos`}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setStep('time')
              setError('')
              setPendingUser(null)
            }}
            className="border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer tracking-wider self-start"
          >
            ← ALTERAR HORÁRIO OU DURAÇÃO
          </button>

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
        </aside>

        {/* Scanner Knox (câmera + fallback manual) */}
        <section className="flex-1 min-w-0 flex flex-col">
          <p className="text-[10px] tracking-widest text-gray-400 mb-2">
            IDENTIFICAÇÃO · KNOX ID
          </p>
          <div className="flex-1 min-h-0">
            <KnoxOCRScanner onScan={handleScan} />
          </div>
        </section>
      </div>
    </DoorOverlayShell>
  )
}

interface DurationCardProps {
  active: boolean
  onClick: () => void
  main: string
  sub: string
  accentColor: string
  accentBg: string
}

function DurationCard({ active, onClick, main, sub, accentColor, accentBg }: DurationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? { borderColor: accentColor, backgroundColor: accentBg, color: accentColor }
          : undefined
      }
      className={[
        'rounded-2xl py-5 px-3 cursor-pointer transition-colors border-2 flex flex-col items-center gap-1',
        active ? '' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-900',
      ].join(' ')}
    >
      <span
        className={
          main.length > 3
            ? 'text-xl font-bold leading-none tracking-tight'
            : 'font-mono text-3xl font-bold leading-none tabular-nums'
        }
      >
        {main}
      </span>
      <span className="text-[10px] tracking-widest text-gray-400 font-mono">{sub}</span>
    </button>
  )
}

interface SummaryRowProps {
  label: string
  value: React.ReactNode
  sub?: string
}

function SummaryRow({ label, value, sub }: SummaryRowProps) {
  return (
    <div>
      <p className="text-[10px] tracking-widest text-gray-400">{label}</p>
      <div className="text-base font-semibold text-gray-900 mt-1">{value}</div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
