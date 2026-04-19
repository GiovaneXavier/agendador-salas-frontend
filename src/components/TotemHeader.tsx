import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function TotemHeader() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = format(now, "EEE, d MMM", { locale: ptBR }).toUpperCase()
  const timeStr = format(now, 'HH:mm')

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 text-xs tracking-widest">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
        <span className="text-gray-500 font-medium">TOTEM · ANDAR 3 · HALL SALAS A &amp; B</span>
      </div>
      <div className="text-gray-500 font-medium flex gap-4">
        <span>{dateStr}</span>
        <span className="text-gray-800 font-semibold tabular-nums">{timeStr}</span>
      </div>
    </header>
  )
}
