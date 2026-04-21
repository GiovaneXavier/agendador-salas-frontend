interface StatusBadgeProps {
  color: string
  label: string
  size?: 'sm' | 'lg'
}

export function StatusBadge({ color, label, size = 'sm' }: StatusBadgeProps) {
  const dotSize = size === 'lg' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'
  const textSize = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-[11px] px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-white ${textSize}`}
      style={{ backgroundColor: color }}
    >
      <span className={`${dotSize} rounded-full bg-white opacity-80 animate-pulse`} />
      {label}
    </span>
  )
}
