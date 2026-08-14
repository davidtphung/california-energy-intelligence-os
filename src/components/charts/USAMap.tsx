import { useId, useMemo, useState } from 'react'
import { projectUS, type USStateEnergy } from '../../data/usStates'
import { useApp } from '../../context/AppContext'
import { UsBasemap } from '../grid/UsBasemap'

export type USAMapMetric =
  | 'capacityGw'
  | 'generationTwh'
  | 'peakGw'
  | 'cleanPct'
  | 'solarGw'
  | 'windGw'
  | 'gasGw'
  | 'coalGw'
  | 'nuclearGw'
  | 'hydroGw'
  | 'cf'

interface Props {
  states: USStateEnergy[]
  selected: string | null
  onSelect: (abbr: string) => void
  /** Color channel (bubble area always encodes capacity) */
  metric?: USAMapMetric
  /** When true, size encodes capacity and color encodes the metric */
  dualEncode?: boolean
  /** Larger canvas for map-centric layouts */
  large?: boolean
}

/** Approximate fleet capacity factor from annual gen and nameplate */
export function approxCapacityFactor(s: USStateEnergy): number {
  if (s.capacityGw <= 0) return 0
  // TWh / (GW · 8.76) ≈ CF as fraction (8.76 = 8760 h / 1000)
  const cf = s.generationTwh / (s.capacityGw * 8.76)
  return Math.max(0, Math.min(1.15, cf))
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

/** Map a value onto [0,1] with optional sqrt for heavy-tailed energy data */
function norm(value: number, min: number, max: number, curve: 'linear' | 'sqrt' = 'linear') {
  if (max <= min) return 0.5
  const t = clamp((value - min) / (max - min), 0, 1)
  return curve === 'sqrt' ? Math.sqrt(t) : t
}

/**
 * Bubble radius from capacity (area ∝ capacity is the realistic encoding).
 * Uses sqrt so TX (~165 GW) vs VT (~1 GW) stay readable without swallowing the map.
 */
function radiusFromCapacity(capacityGw: number, maxCap: number, large = false): number {
  const R_MIN = large ? 6.5 : 5.5
  const R_MAX = large ? 34 : 28
  // Area scale: r = rMin + (rMax-rMin) * sqrt(cap / max)
  const t = Math.sqrt(clamp(capacityGw / Math.max(maxCap, 1), 0, 1))
  return R_MIN + t * (R_MAX - R_MIN)
}

/** Sequential teal scale for capacity / generation magnitude */
function colorMagnitude(t: number, dark: boolean): string {
  // low muted → high accent energy teal
  const u = clamp(t, 0, 1)
  if (dark) {
    const r = Math.round(30 + u * 50)
    const g = Math.round(70 + u * 150)
    const b = Math.round(90 + u * 80)
    return `rgb(${r},${g},${b})`
  }
  const r = Math.round(200 - u * 170)
  const g = Math.round(210 - u * 40)
  const b = Math.round(200 - u * 100)
  return `rgb(${r},${g},${b})`
}

/** Clean share: gray → green */
function colorClean(t: number, dark: boolean): string {
  const u = clamp(t, 0, 1)
  if (dark) {
    return `rgb(${Math.round(80 + u * 40)}, ${Math.round(100 + u * 140)}, ${Math.round(90 + u * 40)})`
  }
  return `rgb(${Math.round(190 - u * 150)}, ${Math.round(200 - u * 40)}, ${Math.round(180 - u * 120)})`
}

function metricValue(s: USStateEnergy, metric: USAMapMetric): number {
  if (metric === 'cf') return approxCapacityFactor(s) * 100
  return s[metric] as number
}

function metricLabel(metric: USAMapMetric): string {
  switch (metric) {
    case 'capacityGw':
      return 'Capacity (GW)'
    case 'generationTwh':
      return 'Generation (TWh/yr)'
    case 'peakGw':
      return 'Peak load (GW)'
    case 'cleanPct':
      return 'Clean share (%)'
    case 'solarGw':
      return 'Solar (GW)'
    case 'windGw':
      return 'Wind (GW)'
    case 'gasGw':
      return 'Natural gas (GW)'
    case 'coalGw':
      return 'Coal (GW)'
    case 'nuclearGw':
      return 'Nuclear (GW)'
    case 'hydroGw':
      return 'Hydro (GW)'
    case 'cf':
      return 'Approx. capacity factor (%)'
  }
}

function formatMetric(metric: USAMapMetric, v: number): string {
  switch (metric) {
    case 'capacityGw':
    case 'peakGw':
    case 'solarGw':
    case 'windGw':
    case 'gasGw':
    case 'coalGw':
    case 'nuclearGw':
    case 'hydroGw':
      return `${v.toFixed(v >= 10 ? 0 : 1)} GW`
    case 'generationTwh':
      return `${v.toFixed(v >= 20 ? 0 : 1)} TWh`
    case 'cleanPct':
    case 'cf':
      return `${v.toFixed(0)}%`
  }
}

export function USAMap({
  states,
  selected,
  onSelect,
  metric = 'generationTwh',
  dualEncode = true,
  large = true,
}: Props) {
  const { theme } = useApp()
  const [hover, setHover] = useState<string | null>(null)
  const uid = useId().replace(/:/g, '')
  const W = large ? 960 : 760
  const H = large ? 580 : 500
  const isDark = theme === 'dark'

  const maxCap = useMemo(
    () => Math.max(...states.map((s) => s.capacityGw), 1),
    [states]
  )

  const { minM, maxM } = useMemo(() => {
    const vals = states.map((s) => metricValue(s, metric))
    return { minM: Math.min(...vals), maxM: Math.max(...vals) }
  }, [states, metric])

  // Size uses capacity always when dualEncode; otherwise size follows metric
  const sizeKey: USAMapMetric = dualEncode ? 'capacityGw' : metric
  const { minS, maxS } = useMemo(() => {
    const vals = states.map((s) => metricValue(s, sizeKey))
    return { minS: Math.min(...vals), maxS: Math.max(...vals) }
  }, [states, sizeKey])

  const focus =
    states.find((s) => s.abbr === (hover ?? selected)) ??
    states.find((s) => s.abbr === selected) ??
    null

  const colorFor = (s: USStateEnergy) => {
    const v = metricValue(s, metric)
    // Heavy-tailed energy metrics use sqrt for better mid-state contrast
    const curve: 'linear' | 'sqrt' =
      metric === 'cleanPct' || metric === 'cf' ? 'linear' : 'sqrt'
    const t = norm(v, minM, maxM, curve)
    if (metric === 'cleanPct' || metric === 'cf') return colorClean(t, isDark)
    return colorMagnitude(t, isDark)
  }

  const radiusFor = (s: USStateEnergy) => {
    if (dualEncode || sizeKey === 'capacityGw') {
      return radiusFromCapacity(s.capacityGw, maxCap, large)
    }
    // Area ∝ metric for non-capacity size modes
    const t = Math.sqrt(norm(metricValue(s, sizeKey), minS, maxS, 'linear'))
    return (large ? 6.5 : 5.5) + t * (large ? 28 : 22.5)
  }

  // Reference bubbles for legend (capacity GW)
  const legendCaps = useMemo(() => {
    const refs = [5, 25, 75, maxCap]
    const uniq = [...new Set(refs.map((n) => Math.round(n)))].filter((n) => n > 0)
    return uniq.slice(0, 4)
  }, [maxCap])

  // Draw large states first so small ones stay clickable on top
  const ordered = useMemo(
    () => [...states].sort((a, b) => b.capacityGw - a.capacityGw),
    [states]
  )

  return (
    <div className={`usamap${large ? ' usamap-large' : ''}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="usamap-svg"
        role="img"
        aria-label="United States energy map. Bubble size is capacity; color is the selected output metric."
      >
        <defs>
          <linearGradient id={`${uid}-scale`} x1="0" y1="0" x2="1" y2="0">
            <stop
              offset="0%"
              stopColor={
                metric === 'cleanPct' || metric === 'cf'
                  ? colorClean(0, isDark)
                  : colorMagnitude(0, isDark)
              }
            />
            <stop
              offset="100%"
              stopColor={
                metric === 'cleanPct' || metric === 'cf'
                  ? colorClean(1, isDark)
                  : colorMagnitude(1, isDark)
              }
            />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} fill="var(--bg)" />

        <UsBasemap w={W} h={H} fill="var(--fill)" fillOpacity={0.7} stroke="var(--line)" strokeWidth={0.75} />

        {/* AK / HI / PR inset frames */}
        <rect
          x={22}
          y={318}
          width={148}
          height={148}
          rx={4}
          fill="none"
          stroke="var(--line-soft)"
          strokeDasharray="3 3"
        />
        <text x={30} y={334} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
          AK
        </text>
        <rect
          x={178}
          y={378}
          width={118}
          height={88}
          rx={4}
          fill="none"
          stroke="var(--line-soft)"
          strokeDasharray="3 3"
        />
        <text x={186} y={394} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
          HI
        </text>
        <rect
          x={308}
          y={378}
          width={118}
          height={88}
          rx={4}
          fill="none"
          stroke="var(--line-soft)"
          strokeDasharray="3 3"
        />
        <text x={316} y={394} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
          PR
        </text>

        {ordered.map((s) => {
          const { x, y } = projectUS(s.lon, s.lat, W, H)
          const r = radiusFor(s)
          const active = s.abbr === selected || s.abbr === hover
          const fill = colorFor(s)
          const cf = approxCapacityFactor(s)
          // Inner disc area ∝ generation relative to capacity (visual CF), dual mode only
          const innerR =
            dualEncode && metric !== 'capacityGw'
              ? r * Math.sqrt(clamp(cf / 0.65, 0.12, 1))
              : r * 0.42

          return (
            <g key={s.abbr} className="usamap-node">
              {/* Outer: nameplate capacity (area) */}
              <circle
                cx={x}
                cy={y}
                r={active ? r + 1.5 : r}
                fill={fill}
                fillOpacity={active ? 0.92 : 0.78}
                stroke={active ? 'var(--highlight)' : 'var(--bg)'}
                strokeWidth={active ? 2.25 : 1.1}
                className="usamap-dot"
                filter={active ? `url(#${uid}-soft)` : undefined}
                onMouseEnter={() => setHover(s.abbr)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(s.abbr)}
                role="button"
                tabIndex={0}
                aria-label={`${s.name}: ${s.capacityGw} GW capacity, ${s.generationTwh} TWh generation, ${metricLabel(metric)} ${formatMetric(metric, metricValue(s, metric))}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(s.abbr)
                  }
                }}
              />
              {/* Inner: output share of nameplate (approx CF) */}
              {dualEncode && (
                <circle
                  cx={x}
                  cy={y}
                  r={innerR}
                  fill={active ? 'var(--highlight)' : 'var(--surface)'}
                  fillOpacity={active ? 0.22 : 0.35}
                  stroke="none"
                  pointerEvents="none"
                />
              )}
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fill={active ? 'var(--highlight)' : 'var(--ink)'}
                fontSize={r > 14 ? 9 : 7.5}
                fontWeight={650}
                fontFamily="var(--font-mono)"
                pointerEvents="none"
              >
                {s.abbr}
              </text>
            </g>
          )
        })}

        {/* Size legend - capacity */}
        <g transform={`translate(28 ${H - 78})`} aria-hidden>
          <text x={0} y={0} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
            Bubble area = capacity (GW)
          </text>
          {legendCaps.map((cap, i) => {
            const r = radiusFromCapacity(cap, maxCap)
            const cx = 14 + i * 52
            const cy = 36
            return (
              <g key={cap}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="var(--mute)"
                  strokeWidth={1}
                  opacity={0.85}
                />
                <text
                  x={cx}
                  y={cy + r + 12}
                  textAnchor="middle"
                  fill="var(--mute)"
                  fontSize={8}
                  fontFamily="var(--font-mono)"
                >
                  {cap >= 100 ? Math.round(cap) : cap}
                </text>
              </g>
            )
          })}
        </g>

        {/* Color legend */}
        <g transform={`translate(${W - 168} ${H - 52})`} aria-hidden>
          <text x={0} y={0} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
            Color = {metricLabel(metric)}
          </text>
          <rect x={0} y={8} width={110} height={9} rx={2} fill={`url(#${uid}-scale)`} />
          <text x={0} y={32} fill="var(--mute)" fontSize={8} fontFamily="var(--font-mono)">
            {formatMetric(metric, minM)}
          </text>
          <text
            x={110}
            y={32}
            textAnchor="end"
            fill="var(--mute)"
            fontSize={8}
            fontFamily="var(--font-mono)"
          >
            {formatMetric(metric, maxM)}
          </text>
        </g>
      </svg>

      {focus && (
        <div className="usamap-tip" role="status">
          <span className="usamap-tip-tag">
            {focus.abbr} · {focus.grid} · CF ~{(approxCapacityFactor(focus) * 100).toFixed(0)}%
          </span>
          <span className="usamap-tip-title">{focus.name}</span>
          <span className="usamap-tip-sub">
            Capacity {focus.capacityGw} GW (nameplate) · output {focus.generationTwh} TWh/yr · peak{' '}
            {focus.peakGw} GW · clean {focus.cleanPct}% · {focus.primary}
            {metric !== 'capacityGw' && metric !== 'generationTwh'
              ? ` · ${metricLabel(metric)} ${formatMetric(metric, metricValue(focus, metric))}`
              : ''}
          </span>
          <span className="usamap-tip-hint">
            Size shows capacity · color shows {metricLabel(metric).toLowerCase()} · click for full
            page
          </span>
        </div>
      )}
    </div>
  )
}
