const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['LIMPAR','z','x','c','v','b','n','m','.'],
]

interface VirtualKeyboardProps {
  value: string
  onChange: (value: string) => void
}

export function VirtualKeyboard({ value, onChange }: VirtualKeyboardProps) {
  const press = (key: string) => {
    if (key === 'LIMPAR') { onChange(''); return }
    onChange(value + key)
  }

  const backspace = () => onChange(value.slice(0, -1))

  return (
    <div className="space-y-2 select-none">
      <p className="text-[10px] tracking-widest text-gray-400 mb-3">TECLADO</p>
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className={[
                'border border-gray-300 rounded text-sm font-medium bg-white active:bg-gray-100 cursor-pointer transition-colors',
                key === 'LIMPAR'
                  ? 'px-3 py-3 text-[11px] tracking-wider text-gray-500 flex-shrink-0'
                  : 'flex-1 py-3 uppercase',
              ].join(' ')}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      {/* Backspace */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={backspace}
          className="border border-gray-300 rounded bg-white active:bg-gray-100 cursor-pointer w-12 py-3 flex items-center justify-center"
          aria-label="Apagar"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
