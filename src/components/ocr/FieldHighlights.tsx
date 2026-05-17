import type { FieldHighlight } from '../../lib/ocr'

interface FieldHighlightsProps {
  highlights: FieldHighlight[]
  /** Dimensões do frame original que o OCR analisou. */
  imageWidth: number
  imageHeight: number
}

const STYLES: Record<FieldHighlight['field'], { stroke: string; fill: string; label: string }> = {
  'gen-label': { stroke: '#fbbf24', fill: 'rgba(251,191,36,0.18)', label: 'GEN' },
  'gen-value': { stroke: '#4ade80', fill: 'rgba(74,222,128,0.22)', label: 'GEN ID' },
  'name-label': { stroke: '#60a5fa', fill: 'rgba(96,165,250,0.14)', label: 'NOME' },
  'name-value': { stroke: '#60a5fa', fill: 'rgba(96,165,250,0.18)', label: 'NOME' },
}

export function FieldHighlights({ highlights, imageWidth, imageHeight }: FieldHighlightsProps) {
  if (highlights.length === 0 || imageWidth === 0 || imageHeight === 0) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      // Casa com o `object-cover` do <video> — corta margem mantendo aspect
      preserveAspectRatio="xMidYMid slice"
    >
      {highlights.map((h, i) => {
        const style = STYLES[h.field]
        const w = h.bbox.x1 - h.bbox.x0
        const hgt = h.bbox.y1 - h.bbox.y0
        return (
          <g key={`${h.field}-${i}`}>
            <rect
              x={h.bbox.x0 - 4}
              y={h.bbox.y0 - 4}
              width={w + 8}
              height={hgt + 8}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={2}
              rx={6}
              ry={6}
            >
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </rect>
            <text
              x={h.bbox.x0 - 2}
              y={h.bbox.y0 - 10}
              fill={style.stroke}
              fontSize={14}
              fontFamily="ui-monospace, monospace"
              fontWeight={700}
              style={{
                paintOrder: 'stroke',
                stroke: 'rgba(0,0,0,0.7)',
                strokeWidth: 3,
              }}
            >
              {style.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
