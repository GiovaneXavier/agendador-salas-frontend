import type { ValidDuration } from '../types/booking'
import { VALID_DURATIONS } from '../lib/constants'

const DURATIONS = VALID_DURATIONS as unknown as ValidDuration[]

interface DurationPickerProps {
  value: ValidDuration
  onChange: (duration: ValidDuration) => void
  accentColor?: string
  accentBg?: string
}

export function DurationPicker({
  value,
  onChange,
  accentColor = '#171412',
  accentBg = '#f5f3ef',
}: DurationPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {DURATIONS.map((d) => {
        const selected = value === d
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            style={selected ? { borderColor: accentColor, backgroundColor: accentBg } : {}}
            className={[
              'border-2 rounded-2xl p-6 text-left cursor-pointer transition-colors',
              selected ? '' : 'border-gray-200 bg-white hover:border-gray-300',
            ].join(' ')}
          >
            <p className="text-4xl font-bold text-gray-900">{d}</p>
            <p className="text-xs tracking-widest text-gray-400 mt-1">MINUTOS</p>
          </button>
        )
      })}
    </div>
  )
}
