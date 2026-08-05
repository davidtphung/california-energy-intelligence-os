import { SOURCE_CONSISTENCY, type SourceConsistency } from '../../data/sourceConsistency'
import { TECH_COLORS } from '../../lib/utils'
import { useApp } from '../../context/AppContext'

interface Props {
  active: string | null
  onSelect: (tech: string) => void
}

/** Horizontal dual bars: consistency (left→right green) vs inconsistency */
export function ConsistencyChart({ active, onSelect }: Props) {
  const rows = [...SOURCE_CONSISTENCY].sort((a, b) => b.consistencyScore - a.consistencyScore)

  return (
    <div className="cchart" role="list" aria-label="Energy source consistency ranking">
      <div className="cchart-head" aria-hidden>
        <span>More inconsistent</span>
        <span>More consistent</span>
      </div>
      {rows.map((r) => {
        const isOn = active === r.technology
        return (
          <button
            key={r.technology}
            type="button"
            role="listitem"
            className={`cchart-row${isOn ? ' is-on' : ''}`}
            onClick={() => onSelect(r.technology)}
          >
            <span className="cchart-label">
              <i style={{ background: TECH_COLORS[r.technology] }} />
              {r.label}
            </span>
            <div className="cchart-track" aria-hidden>
              <div
                className="cchart-incons"
                style={{ width: `${r.inconsistencyScore}%` }}
                title={`Inconsistency ${r.inconsistencyScore}`}
              />
              <div
                className="cchart-cons"
                style={{
                  width: `${r.consistencyScore}%`,
                  background: TECH_COLORS[r.technology],
                }}
                title={`Consistency ${r.consistencyScore}`}
              />
            </div>
            <span className="cchart-score mono">
              {r.consistencyScore}
              <span className="muted"> / {r.inconsistencyScore}</span>
            </span>
          </button>
        )
      })}
      <p className="cchart-foot mono muted">
        Score pair: consistency / inconsistency (sum 100). Click a row for detail.
      </p>
    </div>
  )
}

export function ConsistencyRadarLite({ row }: { row: SourceConsistency }) {
  const { theme } = useApp()
  const metrics = [
    { k: 'Consistency', v: row.consistencyScore },
    { k: 'Firm credit', v: Math.round(row.firmCredit * 100) },
    { k: 'CF typical', v: Math.round(row.capacityFactorTypical * 100) },
    { k: 'Low diurnal', v: 100 - row.diurnalSwing },
    { k: 'Low seasonal', v: 100 - row.seasonalSwing },
    { k: 'Forecast skill', v: Math.max(0, 100 - row.forecastErrorPct * 3) },
  ]
  const stroke = theme === 'dark' ? '#86efac' : '#1a5f3a'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const cx = 100
  const cy = 100
  const R = 70
  const n = metrics.length
  const pts = metrics.map((m, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const rr = (m.v / 100) * R
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)] as const
  })
  const poly = pts.map((p) => p.join(',')).join(' ')
  const rings = [0.33, 0.66, 1]

  return (
    <svg viewBox="0 0 200 200" className="cchart-radar" aria-hidden>
      {rings.map((t) => (
        <polygon
          key={t}
          fill="none"
          stroke={grid}
          strokeWidth={0.8}
          points={metrics
            .map((_, i) => {
              const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
              const rr = t * R
              return `${cx + rr * Math.cos(ang)},${cy + rr * Math.sin(ang)}`
            })
            .join(' ')}
        />
      ))}
      {metrics.map((m, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
        const x = cx + R * Math.cos(ang)
        const y = cy + R * Math.sin(ang)
        const lx = cx + (R + 16) * Math.cos(ang)
        const ly = cy + (R + 16) * Math.sin(ang)
        return (
          <g key={m.k}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={grid} strokeWidth={0.8} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--mute)"
              fontSize={7.5}
              fontFamily="var(--font-mono)"
            >
              {m.k}
            </text>
          </g>
        )
      })}
      <polygon points={poly} fill={stroke} fillOpacity={0.2} stroke={stroke} strokeWidth={1.5} />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.2} fill={stroke} />
      ))}
    </svg>
  )
}
