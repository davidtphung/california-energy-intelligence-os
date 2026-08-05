import { useMemo, useState } from 'react'
import { projectUS, type USStateEnergy } from '../../data/usStates'

interface Props {
  states: USStateEnergy[]
  selected: string | null
  onSelect: (abbr: string) => void
  metric?: 'cleanPct' | 'capacityGw' | 'peakGw' | 'solarGw' | 'windGw'
}

function colorFor(value: number, max: number, min: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  // light gray -> deep green
  const g = Math.round(80 + t * 100)
  const r = Math.round(200 - t * 160)
  const b = Math.round(180 - t * 120)
  return `rgb(${r},${g},${b})`
}

export function USAMap({ states, selected, onSelect, metric = 'cleanPct' }: Props) {
  const [hover, setHover] = useState<string | null>(null)
  const W = 720
  const H = 460

  const { min, max } = useMemo(() => {
    const vals = states.map((s) => s[metric])
    return { min: Math.min(...vals), max: Math.max(...vals) }
  }, [states, metric])

  const focus =
    states.find((s) => s.abbr === (hover ?? selected)) ??
    states.find((s) => s.abbr === selected) ??
    null

  return (
    <div className="usamap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="usamap-svg"
        role="img"
        aria-label="United States energy map. Select a state."
      >
        <rect width={W} height={H} fill="var(--bg)" />

        {/* Contiguous outline (schematic) */}
        <path
          d="M 48 80 L 90 55 L 160 42 L 240 38 L 320 42 L 400 48 L 480 58 L 540 72 L 600 95 L 650 130 L 675 175 L 680 230 L 670 280 L 640 320 L 590 350 L 520 365 L 440 370 L 360 365 L 280 355 L 200 340 L 140 310 L 100 270 L 70 220 L 52 160 Z"
          fill="var(--fill)"
          stroke="var(--line)"
          strokeWidth={1.2}
        />

        {/* AK / HI inset frames */}
        <rect x={24} y={300} width={150} height={140} rx={4} fill="none" stroke="var(--line-soft)" strokeDasharray="3 3" />
        <text x={32} y={316} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
          AK
        </text>
        <rect x={168} y={360} width={120} height={80} rx={4} fill="none" stroke="var(--line-soft)" strokeDasharray="3 3" />
        <text x={176} y={376} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
          HI
        </text>

        {states.map((s) => {
          const { x, y } = projectUS(s.lon, s.lat, W, H)
          const val = s[metric]
          const r = 7 + (val / max) * 14
          const active = s.abbr === selected || s.abbr === hover
          return (
            <g key={s.abbr}>
              <circle
                cx={x}
                cy={y}
                r={active ? r + 2 : r}
                fill={colorFor(val, max, min)}
                fillOpacity={active ? 1 : 0.85}
                stroke={active ? 'var(--highlight)' : 'var(--bg)'}
                strokeWidth={active ? 2 : 1}
                className="usamap-dot"
                onMouseEnter={() => setHover(s.abbr)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(s.abbr)}
                role="button"
                tabIndex={0}
                aria-label={`${s.name}, ${metric} ${val}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(s.abbr)
                  }
                }}
              />
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fill={active ? 'var(--highlight)' : 'var(--ink)'}
                fontSize={active ? 9 : 8}
                fontWeight={600}
                fontFamily="var(--font-mono)"
                pointerEvents="none"
              >
                {s.abbr}
              </text>
            </g>
          )
        })}

        {/* Scale bar labels */}
        <text x={W - 140} y={H - 28} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
          low
        </text>
        <defs>
          <linearGradient id="us-scale" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colorFor(min, max, min)} />
            <stop offset="100%" stopColor={colorFor(max, max, min)} />
          </linearGradient>
        </defs>
        <rect x={W - 120} y={H - 38} width={80} height={8} rx={2} fill="url(#us-scale)" />
        <text x={W - 36} y={H - 28} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
          high
        </text>
      </svg>

      {focus && (
        <div className="usamap-tip" role="status">
          <span className="usamap-tip-tag">
            {focus.abbr} · {focus.grid}
          </span>
          <span className="usamap-tip-title">{focus.name}</span>
          <span className="usamap-tip-sub">
            {focus.capacityGw} GW cap · peak {focus.peakGw} GW · clean {focus.cleanPct}% · primary{' '}
            {focus.primary} · {focus.generationTwh} TWh/yr
          </span>
        </div>
      )}
    </div>
  )
}
