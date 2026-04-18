import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DatePickerProps {
  date: string // YYYY-MM-DD
  onChange: (date: string) => void
}

export function DatePicker({ date, onChange }: DatePickerProps) {
  const current = new Date(date + 'T12:00:00')

  const go = (delta: number) => {
    const next = delta > 0 ? addDays(current, delta) : subDays(current, -delta)
    onChange(format(next, 'yyyy-MM-dd'))
  }

  const label = format(current, "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => go(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-gray-600 cursor-pointer"
        aria-label="Dia anterior"
      >
        ‹
      </button>
      <span className="text-sm font-medium text-gray-700 capitalize min-w-52 text-center">
        {label}
      </span>
      <button
        onClick={() => go(1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-gray-600 cursor-pointer"
        aria-label="Próximo dia"
      >
        ›
      </button>
    </div>
  )
}
