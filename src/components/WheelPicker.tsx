import { useEffect, useRef } from 'react'

interface WheelPickerProps<T extends number> {
  values: readonly T[]
  value: T
  onChange: (next: T) => void
  format?: (v: T) => string
  accentColor?: string
  width?: number
  itemHeight?: number
  visible?: number
}

export function WheelPicker<T extends number>({
  values,
  value,
  onChange,
  format,
  accentColor = '#171412',
  width = 120,
  itemHeight = 56,
  visible = 5,
}: WheelPickerProps<T>) {
  const ref = useRef<HTMLDivElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pad = Math.floor(visible / 2)
  const fmt = format ?? ((v: T) => String(v))

  useEffect(() => {
    if (!ref.current) return
    const idx = values.indexOf(value)
    if (idx < 0) return
    const target = idx * itemHeight
    if (Math.abs(ref.current.scrollTop - target) > 4) {
      ref.current.scrollTop = target
    }
  }, [value, values, itemHeight])

  const handleScroll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!ref.current) return
      const raw = ref.current.scrollTop / itemHeight
      const idx = Math.max(0, Math.min(values.length - 1, Math.round(raw)))
      const next = values[idx]
      if (next !== value) onChange(next)
    }, 100)
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white border border-gray-200"
      style={{ width, height: itemHeight * visible }}
    >
      {/* selection band */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-20 bg-white/80"
        style={{
          top: itemHeight * pad,
          height: itemHeight,
          borderTop: `1.5px solid ${accentColor}`,
          borderBottom: `1.5px solid ${accentColor}`,
        }}
      />
      {/* top fade */}
      <div
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          height: itemHeight * pad,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      {/* bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          height: itemHeight * pad,
          background: 'linear-gradient(0deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="wheel-scroll h-full overflow-y-scroll [scrollbar-width:none]"
        style={{
          scrollSnapType: 'y mandatory',
        }}
      >
        <div style={{ height: itemHeight * pad }} />
        {values.map((v) => {
          const active = v === value
          return (
            <div
              key={String(v)}
              onClick={() => onChange(v)}
              style={{
                height: itemHeight,
                scrollSnapAlign: 'center',
                fontSize: active ? 38 : 26,
                fontWeight: active ? 700 : 500,
                color: active ? accentColor : '#9ca3af',
                opacity: active ? 1 : 0.55,
                transition: 'font-size 0.18s ease, opacity 0.18s ease, color 0.18s ease',
              }}
              className="flex items-center justify-center font-mono tabular-nums cursor-pointer select-none"
            >
              {fmt(v)}
            </div>
          )
        })}
        <div style={{ height: itemHeight * pad }} />
      </div>

      <style>{`.wheel-scroll::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
