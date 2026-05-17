interface ProgressRingProps {
  /** Tentativas feitas. O anel enche linearmente até `cap`. */
  attempts: number
  /** Número de tentativas pra encher completo. Default 15. */
  cap?: number
  size?: number
  /** Cor da parte preenchida. */
  color?: string
}

export function ProgressRing({
  attempts,
  cap = 15,
  size = 48,
  color = '#4ade80',
}: ProgressRingProps) {
  const stroke = 3
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.min(attempts / cap, 1)
  const offset = circumference * (1 - progress)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          transition: 'stroke-dashoffset 0.4s ease-out',
        }}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        fontWeight={600}
        fill="white"
      >
        {attempts}
      </text>
    </svg>
  )
}
