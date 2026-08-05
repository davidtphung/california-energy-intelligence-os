import { useMemo, useState, useId } from 'react'
import {
  PATHWAY_GATES,
  PATHWAY_LAYERS,
  gateCurveY,
  gateMetric,
  type PathwayGate,
  type PathwayLayer,
} from '../../data/energyPathway'
import { useApp } from '../../context/AppContext'

/** ViewBox geometry - labels live in reserved bands so they never collide */
const VB = { w: 1000, h: 420 }
const PAD = { l: 36, r: 36, t: 72, b: 88 }
const RAIL_Y = 48
const LINE_Y = VB.h - PAD.b
const CHART_TOP = PAD.t + 28
const CHART_BOT = LINE_Y - 28

function xAt(p: number) {
  return PAD.l + p * (VB.w - PAD.l - PAD.r)
}

function yAt(norm: number) {
  const n = Math.min(1, Math.max(0, norm))
  return CHART_BOT - n * (CHART_BOT - CHART_TOP)
}

/** Smooth path through gates for the active layer metric */
function buildCurve(layer: PathwayLayer) {
  const pts = PATHWAY_GATES.map((g) => ({
    x: xAt(g.p),
    y: yAt(gateCurveY(g, layer)),
  }))
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const mx = (a.x + b.x) / 2
    d += ` C ${mx.toFixed(1)} ${a.y.toFixed(1)}, ${mx.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
  }
  return d
}

function buildArea(layer: PathwayLayer) {
  const curve = buildCurve(layer)
  const last = PATHWAY_GATES[PATHWAY_GATES.length - 1]
  const first = PATHWAY_GATES[0]
  return `${curve} L ${xAt(last.p).toFixed(1)} ${LINE_Y} L ${xAt(first.p).toFixed(1)} ${LINE_Y} Z`
}

/** Alternate peak callouts above/below the curve tip to avoid collision */
function peakOffset(index: number, gate: PathwayGate): { dy: number; side: 'up' | 'down' } {
  if (!gate.peakCallout && !gate.highlight) return { dy: 0, side: 'up' }
  // Explicit callouts: even indices float higher, odds slightly lower band
  return index % 2 === 0 ? { dy: -38, side: 'up' } : { dy: -22, side: 'up' }
}

export function EnergyPathwayMap() {
  const { setDrilldown, theme } = useApp()
  const [layer, setLayer] = useState<PathwayLayer>('pathway')
  const [activeId, setActiveId] = useState<string>(PATHWAY_GATES[2].id)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const uid = useId().replace(/:/g, '')

  const active = useMemo(
    () => PATHWAY_GATES.find((g) => g.id === activeId) ?? PATHWAY_GATES[0],
    [activeId]
  )
  const hover = hoverId ? PATHWAY_GATES.find((g) => g.id === hoverId) : null
  const focus = hover ?? active

  const curvePath = useMemo(() => buildCurve(layer), [layer])
  const areaPath = useMemo(() => buildArea(layer), [layer])
  const layerMeta = PATHWAY_LAYERS.find((l) => l.id === layer)!

  const ink = theme === 'dark' ? '#e8e4db' : '#2e2b23'
  const mute = theme === 'dark' ? '#8a8478' : '#7a7468'
  const line = theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'
  const accent = theme === 'dark' ? '#86efac' : '#1a5f3a'
  const surface = theme === 'dark' ? '#1c1a17' : '#ffffff'

  const selectGate = (g: PathwayGate) => {
    setActiveId(g.id)
    setDrilldown(`pathway:${g.year}`)
  }

  return (
    <div className="ep">
      <div className="ep-head">
        <div>
          <p className="kicker">Pathway map</p>
          <h2 className="page-h2">California clean energy gates</h2>
          <p className="sub" style={{ marginBottom: 0 }}>
            {layerMeta.hint}. Click a year - detail opens below. Labels sit in fixed bands so nothing
            overlaps.
          </p>
        </div>
        <div className="ep-seg" role="tablist" aria-label="Pathway layer">
          {PATHWAY_LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={layer === l.id}
              className={`ep-seg-btn${layer === l.id ? ' is-on' : ''}`}
              onClick={() => setLayer(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ep-ends" aria-hidden>
        <span className="ep-end">2025</span>
        <span className="ep-end ep-end-mid">Build · retire · firm</span>
        <span className="ep-end">2045</span>
      </div>

      <div className="ep-stage">
        <svg
          className="ep-svg"
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          role="img"
          aria-label={`California energy pathway ${layerMeta.label} from 2025 to 2045`}
        >
          <defs>
            <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
              <stop offset="100%" stopColor={accent} stopOpacity="1" />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Top rail (depth) */}
          <line
            x1={PAD.l}
            x2={VB.w - PAD.r}
            y1={RAIL_Y}
            y2={RAIL_Y}
            stroke={line}
            strokeWidth={1}
          />

          {/* Vertical stubs from rail to markers for highlight gates only */}
          {PATHWAY_GATES.filter((g) => g.highlight || g.peakCallout).map((g) => (
            <g key={`stub-${g.id}`}>
              <line
                x1={xAt(g.p)}
                x2={xAt(g.p)}
                y1={RAIL_Y}
                y2={RAIL_Y + 10}
                stroke={line}
                strokeWidth={1}
              />
            </g>
          ))}

          {/* Baseline track */}
          <line
            className="ep-draw"
            x1={PAD.l}
            x2={VB.w - PAD.r}
            y1={LINE_Y}
            y2={LINE_Y}
            stroke={line}
            strokeWidth={1.25}
          />

          {/* Area + curve */}
          <path d={areaPath} fill={`url(#${uid}-area)`} className="ep-fade" />
          <path
            d={curvePath}
            fill="none"
            stroke={`url(#${uid}-stroke)`}
            strokeWidth={2}
            strokeLinecap="round"
            className="ep-draw"
            filter={`url(#${uid}-glow)`}
          />

          {/* Soft horizontal guides - no labels on guides to avoid clutter */}
          {[0.25, 0.5, 0.75].map((n) => (
            <line
              key={n}
              x1={PAD.l}
              x2={VB.w - PAD.r}
              y1={yAt(n)}
              y2={yAt(n)}
              stroke={line}
              strokeWidth={0.5}
              strokeDasharray="3 6"
              opacity={0.55}
            />
          ))}

          {/* Peak callouts - reserved top band, staggered heights */}
          {PATHWAY_GATES.map((g, i) => {
            if (!g.peakCallout && !g.highlight) return null
            const m = gateMetric(g, layer)
            const { dy } = peakOffset(i, g)
            const cx = xAt(g.p)
            const cy = yAt(gateCurveY(g, layer)) + dy
            const text = g.peakCallout ?? `${m.value}${m.unit.startsWith('%') ? '%' : ''}`
            return (
              <g key={`peak-${g.id}`} className="ep-fade" style={{ animationDelay: `${0.35 + i * 0.06}s` }}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={yAt(gateCurveY(g, layer)) - 6}
                  y2={cy + 14}
                  stroke={line}
                  strokeWidth={1}
                />
                <rect
                  x={cx - 46}
                  y={cy - 12}
                  width={92}
                  height={24}
                  rx={4}
                  fill={surface}
                  stroke={line}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={12}
                  fontWeight={600}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {text}
                </text>
              </g>
            )
          })}

          {/* Gate markers + year labels (bottom band only) */}
          {PATHWAY_GATES.map((g, i) => {
            const cx = xAt(g.p)
            const cy = yAt(gateCurveY(g, layer))
            const isActive = g.id === activeId
            const isHover = g.id === hoverId
            const m = gateMetric(g, layer)
            return (
              <g
                key={g.id}
                className="ep-fade"
                style={{ animationDelay: `${0.45 + i * 0.07}s` }}
              >
                {/* Drop from curve to baseline */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={cy}
                  y2={LINE_Y}
                  stroke={isActive || isHover ? accent : line}
                  strokeWidth={isActive ? 1.5 : 1}
                  opacity={0.85}
                />
                {/* Tick on baseline */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={LINE_Y - 5}
                  y2={LINE_Y + 5}
                  stroke={isActive ? ink : mute}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                {/* Curve node */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive || isHover ? 5.5 : 4}
                  fill={isActive || isHover ? accent : surface}
                  stroke={isActive || isHover ? accent : ink}
                  strokeWidth={1.5}
                />
                {/* Year - exclusive bottom label row */}
                <text
                  x={cx}
                  y={LINE_Y + 28}
                  textAnchor="middle"
                  fill={isActive ? ink : mute}
                  fontSize={13}
                  fontWeight={isActive ? 650 : 550}
                  fontFamily="inherit"
                >
                  {g.short}
                </text>
                {/* Metric under year - second bottom row, mono, never collides with peaks */}
                <text
                  x={cx}
                  y={LINE_Y + 46}
                  textAnchor="middle"
                  fill={mute}
                  fontSize={10}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {m.value}
                  <tspan fontSize={9} fill={mute}>
                    {m.unit.includes('%') ? '%' : ''}
                  </tspan>
                </text>
                {/* Hit target */}
                <rect
                  x={cx - 28}
                  y={CHART_TOP - 8}
                  width={56}
                  height={LINE_Y - CHART_TOP + 60}
                  fill="transparent"
                  className="ep-hit"
                  onMouseEnter={() => setHoverId(g.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => selectGate(g)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectGate(g)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${g.year} ${g.title}`}
                />
              </g>
            )
          })}

          {/* Now / goal endcaps */}
          <circle cx={xAt(PATHWAY_GATES[0].p)} cy={LINE_Y} r={3} fill={ink} />
          <circle
            cx={xAt(PATHWAY_GATES[PATHWAY_GATES.length - 1].p)}
            cy={LINE_Y}
            r={4.5}
            fill={accent}
            filter={`url(#${uid}-glow)`}
          />
        </svg>

        {/* Floating tooltip - fixed position under stage, not over SVG labels */}
        {hover && (
          <div className="ep-tip" role="tooltip">
            <span className="ep-tip-tag">{hover.year}</span>
            <span className="ep-tip-title">{hover.title}</span>
            <span className="ep-tip-sub">
              {gateMetric(hover, layer).value} {gateMetric(hover, layer).unit} · peak{' '}
              {hover.peakGw} GW · storage {hover.storageGw} GW
            </span>
          </div>
        )}
      </div>

      {/* Detail depth panel - structured, not crowded on the chart */}
      <div className="ep-detail" key={focus.id}>
        <div className="ep-detail-top">
          <div>
            <p className="kicker">
              {focus.year} · {focus.short}
            </p>
            <h3 className="page-h2" style={{ marginBottom: 4 }}>
              {focus.title}
            </h3>
            <p className="sub" style={{ marginBottom: 0 }}>
              {focus.gate}
            </p>
          </div>
          <div className="ep-detail-metrics">
            {(
              [
                ['Clean', `${focus.cleanPct}%`],
                ['Peak', `${focus.peakGw} GW`],
                ['Capacity', `${focus.capacityGw} GW`],
                ['Storage', `${focus.storageGw} GW`],
                ['Solar', `${focus.solarGw} GW`],
                ['Wind', `${focus.windGw} GW`],
                ['Gas left', `${focus.gasGw} GW`],
                ['Reserve', `${focus.reservePct}%`],
                ['Emissions', `${focus.emissionsMt} Mt`],
                ['Imports', `${focus.netImportsGw} GW`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="ep-dm">
                <span className="ep-dm-k">{k}</span>
                <span className="ep-dm-v">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ep-detail-grid">
          <div>
            <p className="kicker">The gate</p>
            <p className="ep-prose">{focus.gate}</p>
          </div>
          <div>
            <p className="kicker">Today</p>
            <p className="ep-prose">{focus.today}</p>
          </div>
          <div>
            <p className="kicker">A slip costs</p>
            <p className="ep-prose">{focus.slip}</p>
          </div>
        </div>

        {/* Mini stack bars - capacity composition at selected gate */}
        <div className="ep-stack" aria-hidden={false}>
          <p className="kicker">Capacity stack · {focus.year}</p>
          <div className="ep-stack-bar">
            {(
              [
                { key: 'solar', w: focus.solarGw, c: '#b45309' },
                { key: 'wind', w: focus.windGw, c: '#0369a1' },
                { key: 'storage', w: focus.storageGw, c: accent },
                { key: 'gas', w: focus.gasGw, c: mute },
                {
                  key: 'other',
                  w: Math.max(
                    0,
                    focus.capacityGw - focus.solarGw - focus.windGw - focus.storageGw - focus.gasGw
                  ),
                  c: line,
                },
              ] as const
            ).map((s) => (
              <div
                key={s.key}
                className="ep-stack-seg"
                style={{
                  width: `${(s.w / focus.capacityGw) * 100}%`,
                  background: s.c,
                }}
                title={`${s.key}: ${s.w} GW`}
              />
            ))}
          </div>
          <div className="ep-stack-legend">
            <span>
              <i style={{ background: '#b45309' }} /> Solar {focus.solarGw} GW
            </span>
            <span>
              <i style={{ background: '#0369a1' }} /> Wind {focus.windGw} GW
            </span>
            <span>
              <i style={{ background: accent }} /> Storage {focus.storageGw} GW
            </span>
            <span>
              <i style={{ background: mute }} /> Gas {focus.gasGw} GW
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
