import { useId, useMemo, useState } from 'react'
import {
  BASELOAD_GATES,
  BASELOAD_LAYERS,
  DENSITY_RANK,
  baseloadCurveY,
  baseloadMetric,
  type BaseloadGate,
  type BaseloadLayer,
} from '../../data/baseloadTimeline'
import { useApp } from '../../context/AppContext'

const VB = { w: 1100, h: 460 }
const PAD = { l: 40, r: 40, t: 56, b: 96 }
const RAIL_Y = 36
const LINE_Y = VB.h - PAD.b
const CHART_TOP = PAD.t + 36
const CHART_BOT = LINE_Y - 32

function xAt(p: number) {
  return PAD.l + p * (VB.w - PAD.l - PAD.r)
}

function yAt(n: number) {
  const v = Math.min(1, Math.max(0, n))
  return CHART_BOT - v * (CHART_BOT - CHART_TOP)
}

function buildCurve(layer: BaseloadLayer) {
  const pts = BASELOAD_GATES.map((g) => ({ x: xAt(g.p), y: yAt(baseloadCurveY(g, layer)) }))
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const mx = (a.x + b.x) / 2
    d += ` C ${mx.toFixed(1)} ${a.y.toFixed(1)}, ${mx.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
  }
  return d
}

function buildArea(layer: BaseloadLayer) {
  const curve = buildCurve(layer)
  const first = BASELOAD_GATES[0]
  const last = BASELOAD_GATES[BASELOAD_GATES.length - 1]
  return `${curve} L ${xAt(last.p).toFixed(1)} ${LINE_Y} L ${xAt(first.p).toFixed(1)} ${LINE_Y} Z`
}

/** Small glyph icons on the timeline (mars.design object vibe) */
function GateIcon({
  type,
  x,
  y,
  ink,
  accent,
  active,
}: {
  type: BaseloadGate['icon']
  x: number
  y: number
  ink: string
  accent: string
  active: boolean
}) {
  const s = active ? 1.08 : 1
  const stroke = active ? accent : ink
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={active ? 1 : 0.88}>
      <circle r={18} fill="var(--surface)" stroke={stroke} strokeWidth={1.25} />
      {type === 'atom' && (
        <>
          <circle r={3} fill={stroke} />
          <ellipse rx={12} ry={5} fill="none" stroke={stroke} strokeWidth={1.2} />
          <ellipse rx={12} ry={5} fill="none" stroke={stroke} strokeWidth={1.2} transform="rotate(60)" />
          <ellipse rx={12} ry={5} fill="none" stroke={stroke} strokeWidth={1.2} transform="rotate(120)" />
        </>
      )}
      {type === 'flame' && (
        <path
          d="M0 10 C-8 2 -6 -6 0 -12 C4 -4 8 2 0 10 Z"
          fill={active ? stroke : 'transparent'}
          stroke={stroke}
          strokeWidth={1.2}
        />
      )}
      {type === 'geo' && (
        <>
          <path d="M-10 8 L0 -10 L10 8 Z" fill="none" stroke={stroke} strokeWidth={1.3} />
          <path d="M-5 8 L0 -2 L5 8" fill="none" stroke={stroke} strokeWidth={1.1} />
        </>
      )}
      {type === 'water' && (
        <path
          d="M0 -11 C6 -2 8 4 0 12 C-8 4 -6 -2 0 -11 Z"
          fill="none"
          stroke={stroke}
          strokeWidth={1.3}
        />
      )}
      {type === 'cell' && (
        <>
          <rect x={-9} y={-7} width={18} height={14} rx={2} fill="none" stroke={stroke} strokeWidth={1.3} />
          <line x1={-4} y1={-10} x2={-4} y2={-7} stroke={stroke} strokeWidth={1.3} />
          <line x1={4} y1={-10} x2={4} y2={-7} stroke={stroke} strokeWidth={1.3} />
          <line x1={-5} y1={0} x2={5} y2={0} stroke={stroke} strokeWidth={1.2} />
        </>
      )}
      {type === 'sun' && (
        <>
          <circle r={5} fill="none" stroke={stroke} strokeWidth={1.3} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1={0}
              y1={-8}
              x2={0}
              y2={-12}
              stroke={stroke}
              strokeWidth={1.2}
              transform={`rotate(${a})`}
            />
          ))}
        </>
      )}
      {type === 'flag' && (
        <>
          <line x1={-6} y1={-12} x2={-6} y2={12} stroke={stroke} strokeWidth={1.4} />
          <path d="M-6 -12 L10 -8 L-6 -2 Z" fill={stroke} opacity={0.85} />
        </>
      )}
    </g>
  )
}

export function BaseloadDensityTimeline() {
  const { setDrilldown, theme } = useApp()
  const [layer, setLayer] = useState<BaseloadLayer>('density')
  const [activeId, setActiveId] = useState(BASELOAD_GATES[0].id)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const uid = useId().replace(/:/g, '')

  const focus =
    BASELOAD_GATES.find((g) => g.id === (hoverId ?? activeId)) ?? BASELOAD_GATES[0]
  const layerMeta = BASELOAD_LAYERS.find((l) => l.id === layer)!

  const curvePath = useMemo(() => buildCurve(layer), [layer])
  const areaPath = useMemo(() => buildArea(layer), [layer])

  const ink = theme === 'dark' ? '#e8e4db' : '#2e2b23'
  const mute = theme === 'dark' ? '#8a8478' : '#7a7468'
  const line = theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'
  const accent = theme === 'dark' ? '#86efac' : '#1a5f3a'
  const surface = theme === 'dark' ? '#1c1a17' : '#e4e0d7'
  const warm = theme === 'dark' ? '#fbbf24' : '#b45309'

  const select = (g: BaseloadGate) => {
    setActiveId(g.id)
    setDrilldown(`baseload:${g.year}`)
  }

  const stackTotal =
    focus.stack.nuclear +
    focus.stack.geothermal +
    focus.stack.hydro +
    focus.stack.gas +
    focus.stack.storageFirm +
    focus.stack.otherFirm

  const stackParts = [
    { key: 'Nuclear', w: focus.stack.nuclear, c: '#7c3aed' },
    { key: 'Geothermal', w: focus.stack.geothermal, c: warm },
    { key: 'Hydro', w: focus.stack.hydro, c: '#0369a1' },
    { key: 'Gas', w: focus.stack.gas, c: mute },
    { key: 'Storage firm', w: focus.stack.storageFirm, c: accent },
    { key: 'Other firm', w: focus.stack.otherFirm, c: line },
  ]

  return (
    <div className="btl">
      {/* Hero head - mars.design post-hero cadence */}
      <div className="btl-hero">
        <p className="btl-kicker">Baseload · energy density</p>
        <h2 className="btl-date">{focus.year}</h2>
        <p className="btl-sub">{focus.title}</p>
        <p className="btl-note">
          A visual timeline of California firm power: what is dense enough to run when the sun is
          down. Click a gate. Curve follows {layerMeta.label.toLowerCase()}.
        </p>
      </div>

      <div className="btl-seg" role="tablist" aria-label="Baseload timeline layer">
        {BASELOAD_LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={layer === l.id}
            className={`btl-seg-btn${layer === l.id ? ' is-on' : ''}`}
            onClick={() => setLayer(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="btl-ends" aria-hidden>
        <span className="btl-end">2025</span>
        <span className="btl-end btl-end-mid">{layerMeta.hint}</span>
        <span className="btl-end">2045</span>
      </div>

      <div className="btl-stage">
        <svg
          className="btl-svg"
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          role="img"
          aria-label="California baseload and energy density timeline 2025 to 2045"
        >
          <defs>
            <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={warm} stopOpacity="0.7" />
              <stop offset="55%" stopColor={accent} stopOpacity="0.95" />
              <stop offset="100%" stopColor={accent} stopOpacity="1" />
            </linearGradient>
            <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Top rail + drops (mars.design depth) */}
          <line x1={PAD.l} x2={VB.w - PAD.r} y1={RAIL_Y} y2={RAIL_Y} stroke={line} strokeWidth={1} />
          {BASELOAD_GATES.map((g) => (
            <g key={`rail-${g.id}`}>
              <line
                x1={xAt(g.p)}
                x2={xAt(g.p)}
                y1={RAIL_Y}
                y2={RAIL_Y + 12}
                stroke={line}
                strokeWidth={1}
              />
              <line
                x1={xAt(g.p) - 10}
                x2={xAt(g.p) + 10}
                y1={RAIL_Y + 12}
                y2={RAIL_Y + 12}
                stroke={line}
                strokeWidth={1}
              />
            </g>
          ))}

          {/* Horizontal guide lines - no text on guides */}
          {[0.25, 0.5, 0.75].map((n) => (
            <line
              key={n}
              x1={PAD.l}
              x2={VB.w - PAD.r}
              y1={yAt(n)}
              y2={yAt(n)}
              stroke={line}
              strokeWidth={0.6}
              strokeDasharray="3 7"
              opacity={0.5}
            />
          ))}

          {/* Baseline */}
          <line
            className="btl-draw"
            x1={PAD.l}
            x2={VB.w - PAD.r}
            y1={LINE_Y}
            y2={LINE_Y}
            stroke={line}
            strokeWidth={1.35}
          />

          {/* Area + curve */}
          <path d={areaPath} fill={`url(#${uid}-area)`} className="btl-fade" />
          <path
            d={curvePath}
            fill="none"
            stroke={`url(#${uid}-stroke)`}
            strokeWidth={2.25}
            strokeLinecap="round"
            className="btl-draw"
            filter={`url(#${uid}-soft)`}
          />

          {/* Peak callouts - top label band only */}
          {BASELOAD_GATES.map((g, i) => {
            const cx = xAt(g.p)
            const cy = yAt(baseloadCurveY(g, layer))
            const peakY = CHART_TOP - 8 + (i % 2) * 4
            const m = baseloadMetric(g, layer)
            return (
              <g key={`peak-${g.id}`} className="btl-fade" style={{ animationDelay: `${0.3 + i * 0.05}s` }}>
                <line x1={cx} x2={cx} y1={cy - 20} y2={peakY + 10} stroke={line} strokeWidth={1} />
                <rect
                  x={cx - 52}
                  y={peakY - 11}
                  width={104}
                  height={22}
                  rx={5}
                  fill={surface}
                  stroke={g.highlight ? accent : line}
                />
                <text
                  x={cx}
                  y={peakY + 4}
                  textAnchor="middle"
                  fill={ink}
                  fontSize={11}
                  fontWeight={600}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {g.peak}
                </text>
                {/* tiny metric under peak pill for layer - still in top band */}
                <text
                  x={cx}
                  y={peakY + 22}
                  textAnchor="middle"
                  fill={mute}
                  fontSize={9}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {m.value}
                  {m.unit === '%' ? '%' : m.unit === 'idx' ? '' : ''}
                </text>
              </g>
            )
          })}

          {/* Gates: icon objects, drops, years */}
          {BASELOAD_GATES.map((g, i) => {
            const cx = xAt(g.p)
            const cy = yAt(baseloadCurveY(g, layer))
            const isActive = g.id === activeId
            const isHover = g.id === hoverId
            const m = baseloadMetric(g, layer)
            const iconY = cy - 36
            return (
              <g key={g.id} className="btl-fade" style={{ animationDelay: `${0.4 + i * 0.06}s` }}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={cy}
                  y2={LINE_Y}
                  stroke={isActive || isHover ? accent : line}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                <line
                  x1={cx}
                  x2={cx}
                  y1={LINE_Y - 5}
                  y2={LINE_Y + 5}
                  stroke={isActive ? ink : mute}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive || isHover ? 5.5 : 4}
                  fill={isActive || isHover ? accent : surface}
                  stroke={ink}
                  strokeWidth={1.4}
                />
                <GateIcon
                  type={g.icon}
                  x={cx}
                  y={iconY}
                  ink={ink}
                  accent={accent}
                  active={isActive || isHover}
                />
                {/* Year - bottom band only */}
                <text
                  x={cx}
                  y={LINE_Y + 28}
                  textAnchor="middle"
                  fill={isActive ? ink : mute}
                  fontSize={13}
                  fontWeight={isActive ? 650 : 550}
                >
                  {g.short}
                </text>
                <text
                  x={cx}
                  y={LINE_Y + 46}
                  textAnchor="middle"
                  fill={mute}
                  fontSize={10}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {m.value}
                  {layer === 'firm' ? '%' : ''}
                </text>
                <rect
                  x={cx - 32}
                  y={RAIL_Y}
                  width={64}
                  height={LINE_Y - RAIL_Y + 56}
                  fill="transparent"
                  className="btl-hit"
                  role="button"
                  tabIndex={0}
                  aria-label={`${g.year} ${g.title}`}
                  onMouseEnter={() => setHoverId(g.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => select(g)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      select(g)
                    }
                  }}
                />
              </g>
            )
          })}

          <circle cx={xAt(BASELOAD_GATES[0].p)} cy={LINE_Y} r={3.2} fill={ink} />
          <circle
            cx={xAt(BASELOAD_GATES[BASELOAD_GATES.length - 1].p)}
            cy={LINE_Y}
            r={5}
            fill={accent}
            filter={`url(#${uid}-soft)`}
          />
        </svg>

        {hoverId && (
          <div className="btl-tip" role="tooltip">
            <span className="btl-tip-tag">{focus.year}</span>
            <span className="btl-tip-title">{focus.title}</span>
            <span className="btl-tip-sub">
              density {focus.densityIndex} · baseload {focus.baseloadGw} GW · firm {focus.firmPct}% ·
              gas {focus.gasGw} GW
            </span>
          </div>
        )}
      </div>

      {/* Detail: gate / today / slip - mars.design cadence */}
      <div className="btl-detail" key={focus.id}>
        <div className="btl-detail-head">
          <div>
            <p className="kicker">
              {focus.year} · {focus.short}
            </p>
            <h3 className="page-h2">{focus.title}</h3>
          </div>
          <div className="btl-stats">
            {(
              [
                ['Density idx', `${focus.densityIndex}`],
                ['Baseload', `${focus.baseloadGw} GW`],
                ['Firm of peak', `${focus.firmPct}%`],
                ['Gas residual', `${focus.gasGw} GW`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="btl-stat">
                <span className="btl-stat-k">{k}</span>
                <span className="btl-stat-v">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="btl-tri">
          <div>
            <p className="kicker">The gate</p>
            <p className="btl-prose">{focus.gate}</p>
          </div>
          <div>
            <p className="kicker">Today</p>
            <p className="btl-prose">{focus.today}</p>
          </div>
          <div>
            <p className="kicker">A slip costs</p>
            <p className="btl-prose">{focus.slip}</p>
          </div>
        </div>

        <p className="kicker">Baseload stack · {focus.year}</p>
        <div className="btl-stack-bar">
          {stackParts.map((s) => (
            <div
              key={s.key}
              className="btl-stack-seg"
              style={{ width: `${(s.w / stackTotal) * 100}%`, background: s.c }}
              title={`${s.key}: ${s.w} GW`}
            />
          ))}
        </div>
        <div className="btl-stack-legend">
          {stackParts.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.c }} />
              {s.key} {s.w} GW
            </span>
          ))}
        </div>

        <p className="kicker" style={{ marginTop: '1.25rem' }}>
          Relative energy density rank
        </p>
        <table className="list-table">
          <tbody>
            {DENSITY_RANK.map((r) => (
              <tr key={r.tech}>
                <th scope="row">{r.rel}</th>
                <td>
                  <strong style={{ color: 'var(--highlight)', fontWeight: 600 }}>{r.tech}</strong>
                  <span className="muted"> · {r.note}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
