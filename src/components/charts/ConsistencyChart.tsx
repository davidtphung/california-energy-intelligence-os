import { SOURCE_CONSISTENCY, type SourceConsistency } from '../../data/sourceConsistency'
import { TECH_COLORS } from '../../lib/utils'
import { useApp } from '../../context/AppContext'

interface Props {
  active: string | null
  onSelect: (tech: string) => void
}

/** Horizontal dual bars: inconsistency then consistency share */
export function ConsistencyChart({ active, onSelect }: Props) {
  const rows = [...SOURCE_CONSISTENCY].sort((a, b) => b.consistencyScore - a.consistencyScore)

  return (
    <div className="cchart" role="list" aria-label="Energy source consistency ranking">
      <div className="cchart-head" aria-hidden>
        <span className="cchart-head-spacer" />
        <span className="cchart-head-axis">
          <span>More inconsistent</span>
          <span>More consistent</span>
        </span>
        <span className="cchart-head-score">C / I</span>
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
              <span className="cchart-label-text">{r.label}</span>
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
              <span className="muted">/{r.inconsistencyScore}</span>
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
  // Short labels so they never clip the radar edge
  const metrics = [
    { k: 'Consist.', full: 'Consistency', v: row.consistencyScore },
    { k: 'Firm', full: 'Firm credit', v: Math.round(row.firmCredit * 100) },
    { k: 'CF', full: 'CF typical', v: Math.round(row.capacityFactorTypical * 100) },
    { k: 'Diurnal', full: 'Low diurnal swing', v: 100 - row.diurnalSwing },
    { k: 'Season', full: 'Low seasonal swing', v: 100 - row.seasonalSwing },
    { k: 'Fcst', full: 'Forecast skill', v: Math.max(0, 100 - row.forecastErrorPct * 3) },
  ]
  const stroke = theme === 'dark' ? '#86efac' : '#1a5f3a'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  // Roomy canvas so axis labels never clip the edge
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const R = 72
  const labelR = R + 36
  const n = metrics.length
  const pts = metrics.map((m, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const rr = (m.v / 100) * R
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)] as const
  })
  const poly = pts.map((p) => p.join(',')).join(' ')
  const rings = [0.33, 0.66, 1]

  return (
    <div className="cchart-radar-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="cchart-radar"
        role="img"
        aria-label={`Consistency profile for ${row.label}`}
        style={{ overflow: 'visible' }}
      >
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
          const lx = cx + labelR * Math.cos(ang)
          const ly = cy + labelR * Math.sin(ang)
          const anchor =
            Math.abs(Math.cos(ang)) < 0.2 ? 'middle' : Math.cos(ang) > 0 ? 'start' : 'end'
          return (
            <g key={m.k}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={grid} strokeWidth={0.8} />
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill="var(--mute)"
                fontSize={11}
                fontFamily="var(--font-mono)"
              >
                <title>{m.full}</title>
                {m.k}
              </text>
            </g>
          )
        })}
        <polygon points={poly} fill={stroke} fillOpacity={0.2} stroke={stroke} strokeWidth={1.5} />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill={stroke} />
        ))}
      </svg>
      <ul className="cchart-radar-legend" aria-label="Radar metrics">
        {metrics.map((m) => (
          <li key={m.k}>
            <span className="mono">{m.k}</span>
            <span className="muted">{m.full}</span>
            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--highlight)' }}>
              {m.v}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
