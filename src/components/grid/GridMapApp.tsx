/**
 * Grid Pulse — map-first live electrical intelligence.
 * Isochrone-like density for power systems: flow, load, voltage, current, storage.
 */

import { useMemo, useState, useCallback } from 'react'
import {
  Download,
  Pause,
  Play,
  Radio,
  Search,
  X,
  Layers,
  GitCompare,
  AlertTriangle,
} from 'lucide-react'
import { projectUS } from '../../data/usStates'
import { operatorsList, regionsList } from '../../grid/generateGrid'
import {
  explainDelta,
  filterLines,
  filterNodes,
  formatMetric,
  lineColor,
  metricRange,
  metricValue,
  operatorActions,
  valueToColor,
} from '../../grid/metrics'
import { useGridStream } from '../../grid/useGridStream'
import {
  DEFAULT_FILTERS,
  LAYER_META,
  METRIC_META,
  type GridFilters,
  type GridMode,
  type LayerId,
  type MetricKey,
  type NodeKind,
  type RoleView,
} from '../../grid/types'
import { exportCsv } from '../../lib/utils'
import { useApp } from '../../context/AppContext'

const W = 1100
const H = 640

const METRIC_OPTIONS = Object.entries(METRIC_META).map(([k, v]) => ({
  value: k as MetricKey,
  label: v.label,
}))

export function GridMapApp() {
  const { theme, openStateDetail } = useApp()
  const [filters, setFilters] = useState<GridFilters>(DEFAULT_FILTERS)
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(() =>
    Object.fromEntries(LAYER_META.map((l) => [l.id, l.defaultOn])) as Record<LayerId, boolean>
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [compareId, setCompareId] = useState<string | null>(null)
  const [compareOn, setCompareOn] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [zoom, setZoom] = useState(1)

  const stream = useGridStream(filters.mode)
  const { topo, frame, prevFrame, kpis, now, connected, history, histIndex, playing, setPlaying, scrubTo } =
    stream

  const ops = useMemo(() => operatorsList(topo), [topo])
  const regs = useMemo(() => regionsList(topo), [topo])

  const visibleNodes = useMemo(
    () => filterNodes(topo, frame, filters),
    [topo, frame, filters]
  )
  const nodeIdSet = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])
  const visibleLines = useMemo(() => filterLines(topo, nodeIdSet), [topo, nodeIdSet])

  const range = useMemo(
    () => metricRange(frame, visibleNodes, filters.metric),
    [frame, visibleNodes, filters.metric]
  )

  const selected = visibleNodes.find((n) => n.id === selectedId) ?? null
  const selectedSample = selected ? frame.nodes[selected.id] : null
  const hover = visibleNodes.find((n) => n.id === hoverId)
  const hoverSample = hover ? frame.nodes[hover.id] : null
  const compare = compareOn ? visibleNodes.find((n) => n.id === compareId) : null
  const compareSample = compare ? frame.nodes[compare.id] : null

  const deltaText = useMemo(() => explainDelta(prevFrame, frame), [prevFrame, frame])
  const actions = useMemo(() => operatorActions(frame), [frame])

  const setF = useCallback((p: Partial<GridFilters>) => {
    setFilters((f) => ({ ...f, ...p }))
  }, [])

  const toggleLayer = (id: LayerId) => {
    if (id === 'base') return
    setLayers((L) => ({ ...L, [id]: !L[id] }))
  }

  const onSelectNode = (id: string) => {
    if (compareOn && selectedId && id !== selectedId) {
      setCompareId(id)
      return
    }
    setSelectedId(id)
  }

  const exportNodes = () => {
    exportCsv(
      visibleNodes.map((n) => {
        const s = frame.nodes[n.id]
        return {
          id: n.id,
          name: n.name,
          kind: n.kind,
          state: n.stateAbbr,
          operator: n.operator,
          load_mw: s?.loadMw,
          gen_mw: s?.genMw,
          voltage_kv: s?.voltageKv,
          current_a: s?.currentA,
          power_density: s?.powerDensity,
          congestion: s?.congestion,
          soc: s?.soc ?? '',
          t: new Date(frame.t).toISOString(),
        }
      }),
      `grid-pulse-nodes-${frame.t}.csv`
    )
  }

  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const gridLine = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const ink = theme === 'dark' ? '#e8e4db' : '#2e2b23'

  // KPI set by role (max 6)
  const kpiItems = useMemo(() => {
    const all = [
      { k: 'Load', v: `${kpis.loadGw.toFixed(0)}`, u: 'GW', hint: 'system demand' },
      { k: 'Gen', v: `${kpis.genGw.toFixed(0)}`, u: 'GW', hint: 'online supply' },
      { k: 'Flow', v: `${kpis.netFlowGw.toFixed(1)}`, u: 'GW', hint: 'corridor activity' },
      { k: 'Voltage', v: `${kpis.avgVoltageKv.toFixed(0)}`, u: 'kV avg', hint: 'mean bus' },
      { k: 'Current', v: `${kpis.peakCurrentKa.toFixed(1)}`, u: 'kA peak', hint: 'hotspot' },
      { k: 'SOC', v: `${kpis.storageSocPct.toFixed(0)}`, u: '%', hint: 'storage avg' },
      {
        k: 'Congest',
        v: `${kpis.congestionLines}`,
        u: 'lines',
        hint: '≥85% loading',
      },
      {
        k: 'Alerts',
        v: `${kpis.alertsCritical}`,
        u: 'crit',
        hint: 'critical now',
      },
    ]
    if (filters.role === 'executive') return all.filter((x) => ['Load', 'Gen', 'Alerts', 'Congest', 'SOC'].includes(x.k))
    if (filters.role === 'operator')
      return all.filter((x) => ['Load', 'Gen', 'Voltage', 'Current', 'Congest', 'Alerts'].includes(x.k))
    return all.slice(0, 6)
  }, [kpis, filters.role])

  return (
    <div className="gmap fadein t1" id="grid-map">
      {/* Header row */}
      <header className="gmap-head">
        <div>
          <p className="kicker">Grid Pulse · electrical isochrone</p>
          <h1 className="page-h2" style={{ marginBottom: 4 }}>
            Live power map
          </h1>
          <p className="gmap-summary">{frame.summary}</p>
        </div>
        <div className="gmap-head-actions">
          <div className="gmap-mode">
            {(['live', 'historical', 'forecast'] as GridMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={filters.mode === m ? 'is-on' : ''}
                onClick={() => setF({ mode: m })}
              >
                {m === 'live' && <Radio className="h-3 w-3" />}
                {m}
              </button>
            ))}
          </div>
          <select
            className="gmap-select"
            value={filters.role}
            onChange={(e) => setF({ role: e.target.value as RoleView })}
            aria-label="Role view"
          >
            <option value="analyst">Analyst</option>
            <option value="operator">Operator</option>
            <option value="executive">Executive</option>
          </select>
          <button type="button" className="gmap-icon-btn" onClick={exportNodes} title="Export CSV">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* KPI strip — 5–7 max */}
      <div className="gmap-kpi" role="region" aria-label="System KPIs">
        {kpiItems.map((k) => (
          <div key={k.k} className="gmap-kpi-item">
            <span className="gmap-kpi-label">{k.k}</span>
            <span className="gmap-kpi-value">
              {k.v}
              <span className="gmap-kpi-unit">{k.u}</span>
            </span>
            <span className="gmap-kpi-hint">{k.hint}</span>
          </div>
        ))}
        <div className="gmap-kpi-item gmap-kpi-live">
          <span className="gmap-kpi-label">
            <span className={`gmap-dot ${connected ? 'ok' : 'bad'}`} />
            {filters.mode === 'live' ? 'Live' : filters.mode}
          </span>
          <span className="gmap-kpi-value" style={{ fontSize: '0.95rem' }}>
            {new Date(now).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: filters.mode === 'live' ? '2-digit' : undefined,
            })}
          </span>
          <span className="gmap-kpi-hint">
            {filters.mode === 'live'
              ? `fresh ≤${kpis.freshnessSec}s`
              : new Date(now).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="gmap-body">
        {/* Left layers / filters */}
        {panelOpen && (
          <aside className="gmap-side" aria-label="Layers and filters">
            <div className="gmap-side-head">
              <Layers className="h-3.5 w-3.5" />
              <span>Layers</span>
              <button type="button" className="gmap-icon-btn" onClick={() => setPanelOpen(false)} aria-label="Close panel">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="gmap-layers">
              {LAYER_META.map((l) => (
                <li key={l.id}>
                  <label className="gmap-check">
                    <input
                      type="checkbox"
                      checked={layers[l.id]}
                      disabled={l.id === 'base'}
                      onChange={() => toggleLayer(l.id)}
                    />
                    <span>{l.label}</span>
                  </label>
                </li>
              ))}
            </ul>

            <p className="gmap-side-label">Metric</p>
            <select
              className="gmap-select full"
              value={filters.metric}
              onChange={(e) => setF({ metric: e.target.value as MetricKey })}
            >
              {METRIC_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({METRIC_META[m.value].unit})
                </option>
              ))}
            </select>

            <p className="gmap-side-label">Operator</p>
            <select
              className="gmap-select full"
              value={filters.operator}
              onChange={(e) => setF({ operator: e.target.value })}
            >
              <option value="all">All operators</option>
              {ops.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <p className="gmap-side-label">Region</p>
            <select
              className="gmap-select full"
              value={filters.region}
              onChange={(e) => setF({ region: e.target.value })}
            >
              <option value="all">All regions</option>
              {regs.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <p className="gmap-side-label">Asset type</p>
            <select
              className="gmap-select full"
              value={filters.assetType}
              onChange={(e) => setF({ assetType: e.target.value as NodeKind | 'all' })}
            >
              <option value="all">All assets</option>
              <option value="hub">Hub</option>
              <option value="generator">Generator</option>
              <option value="load">Load</option>
              <option value="battery">Battery</option>
              <option value="substation">Substation</option>
            </select>

            <p className="gmap-side-label">Threshold {filters.thresholdPct}%</p>
            <input
              type="range"
              min={50}
              max={100}
              value={filters.thresholdPct}
              onChange={(e) => setF({ thresholdPct: Number(e.target.value) })}
              className="gmap-range"
            />

            <p className="gmap-side-label">Search</p>
            <div className="gmap-search">
              <Search className="h-3.5 w-3.5" />
              <input
                value={filters.search}
                onChange={(e) => setF({ search: e.target.value })}
                placeholder="Node, state, utility…"
                aria-label="Search grid"
              />
            </div>

            <button
              type="button"
              className={`gmap-compare-btn${compareOn ? ' is-on' : ''}`}
              onClick={() => {
                setCompareOn((v) => !v)
                if (compareOn) setCompareId(null)
              }}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare two nodes
            </button>

            <p className="gmap-side-label">Zoom {zoom.toFixed(1)}×</p>
            <input
              type="range"
              min={0.7}
              max={1.8}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="gmap-range"
            />
            <p className="gmap-hint">All layers on by default — toggle to focus a single view.</p>
            <button
              type="button"
              className="gmap-compare-btn"
              onClick={() =>
                setLayers(
                  Object.fromEntries(LAYER_META.map((l) => [l.id, true])) as Record<LayerId, boolean>
                )
              }
            >
              All layers on
            </button>
          </aside>
        )}

        {!panelOpen && (
          <button type="button" className="gmap-open-side" onClick={() => setPanelOpen(true)}>
            <Layers className="h-4 w-4" /> Layers
          </button>
        )}

        {/* Map */}
        <div className="gmap-map-wrap">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="gmap-svg"
            role="img"
            aria-label="United States electricity flow and density map"
          >
            <defs>
              <marker id="flow-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#38bdf8" opacity="0.9" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Soft land plate */}
            <rect x="0" y="0" width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="28" fill={tick} fontSize="11" fontFamily="var(--font-mono)">
              {METRIC_META[filters.metric].label} · {METRIC_META[filters.metric].unit}
            </text>

            {/* Density underlay */}
            {layers.density &&
              visibleNodes.map((n) => {
                const s = frame.nodes[n.id]
                if (!s) return null
                const { x, y } = projectUS(n.lon, n.lat, W, H)
                const r = (8 + s.powerDensity * 0.35) * zoom
                const c = valueToColor(s.powerDensity, 'powerDensity', 0, 100)
                return (
                  <circle
                    key={`d-${n.id}`}
                    cx={x}
                    cy={y}
                    r={r}
                    fill={c}
                    opacity={0.12}
                    style={{ pointerEvents: 'none' }}
                  />
                )
              })}

            {/* Flow lines */}
            {layers.flow &&
              layers.base &&
              visibleLines.map((ln) => {
                const a = topo.nodes.find((n) => n.id === ln.fromId)
                const b = topo.nodes.find((n) => n.id === ln.toId)
                const s = frame.lines[ln.id]
                if (!a || !b || !s) return null
                if (!nodeIdSet.has(a.id) && !nodeIdSet.has(b.id)) return null
                const pa = projectUS(a.lon, a.lat, W, H)
                const pb = projectUS(b.lon, b.lat, W, H)
                // direction by sign of flow
                const from = s.flowMw >= 0 ? pa : pb
                const to = s.flowMw >= 0 ? pb : pa
                const col = lineColor(s.loading, s.outage)
                const sw = Math.max(0.8, Math.min(5, 0.6 + s.loading * 4)) * zoom
                return (
                  <g key={ln.id}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={col}
                      strokeWidth={sw}
                      strokeOpacity={0.55}
                      strokeDasharray={s.outage ? '4 4' : layers.flow ? '8 6' : undefined}
                      className={layers.flow && !s.outage ? 'gmap-flow-line' : undefined}
                      markerEnd={layers.flow && Math.abs(s.flowMw) > 200 ? 'url(#flow-arrow)' : undefined}
                    >
                      <title>
                        {ln.name}: {s.flowMw.toFixed(0)} MW · {(s.loading * 100).toFixed(0)}% ·{' '}
                        {s.currentA.toFixed(0)} A
                      </title>
                    </line>
                  </g>
                )
              })}

            {/* Nodes */}
            {visibleNodes.map((n) => {
              const s = frame.nodes[n.id]
              if (!s) return null
              const { x, y } = projectUS(n.lon, n.lat, W, H)
              const val = metricValue(s, filters.metric)
              const fill = valueToColor(val, filters.metric, range.min, range.max)
              const isSel = n.id === selectedId || n.id === compareId
              const isHov = n.id === hoverId
              const showStorage = layers.storage && n.kind === 'battery'
              const showAlert = layers.alerts && (s.outage || s.congestion * 100 >= filters.thresholdPct)
              const showDemand = layers.demand
              const showGen = layers.generation
              let r = (4 + Math.sqrt(Math.max(0, s.loadMw + s.genMw)) * 0.08) * zoom
              if (!showDemand && showGen) r = (4 + Math.sqrt(s.genMw) * 0.1) * zoom
              if (n.kind === 'battery') r = Math.max(r, 7 * zoom)
              if (s.outage) r = 6 * zoom

              // Voltage ring
              const vStroke =
                layers.voltage
                  ? valueToColor(s.voltageKv, 'voltageKv', n.voltageKvNom * 0.92, n.voltageKvNom * 1.05)
                  : undefined

              // Current halo
              const curR =
                layers.current && s.currentA > range.max * 0.5
                  ? r + 4 + (s.currentA / Math.max(1, range.max)) * 10
                  : 0

              return (
                <g
                  key={n.id}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => onSelectNode(n.id)}
                >
                  {curR > 0 && (
                    <circle r={curR} fill="none" stroke="#f97316" strokeOpacity={0.35} strokeWidth={1.5} />
                  )}
                  {showStorage && s.soc != null && (
                    <circle
                      r={r + 3}
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      strokeDasharray={`${(s.soc / 100) * 2 * Math.PI * (r + 3)} ${2 * Math.PI * (r + 3)}`}
                      transform="rotate(-90)"
                    />
                  )}
                  <circle
                    r={r}
                    fill={s.outage ? '#e11d48' : fill}
                    stroke={isSel ? ink : vStroke ?? (isHov ? ink : gridLine)}
                    strokeWidth={isSel || isHov ? 2 : layers.voltage ? 2 : 1}
                    filter={showAlert ? 'url(#glow)' : undefined}
                    opacity={showDemand || showGen || layers.base ? 0.92 : 0.5}
                  />
                  {showAlert && (
                    <circle r={2.2} fill="#e11d48" cx={r * 0.6} cy={-r * 0.6} />
                  )}
                  {(isSel || isHov || zoom > 1.3) && (
                    <text
                      y={-r - 5}
                      textAnchor="middle"
                      fill={ink}
                      fontSize={10}
                      fontFamily="var(--font-sans)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {n.stateAbbr}
                    </text>
                  )}
                  <title>
                    {n.name} · {formatMetric(val, filters.metric)} · load {s.loadMw.toFixed(0)} MW · gen{' '}
                    {s.genMw.toFixed(0)} MW · {s.voltageKv.toFixed(1)} kV · t{' '}
                    {new Date(s.t).toLocaleTimeString()}
                  </title>
                </g>
              )
            })}

            {/* Legend */}
            <g transform={`translate(24, ${H - 48})`}>
              <text fill={tick} fontSize="10" fontFamily="var(--font-mono)">
                low
              </text>
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const v = range.min + (range.max - range.min) * t
                return (
                  <rect
                    key={t}
                    x={28 + i * 22}
                    y={-10}
                    width={22}
                    height={8}
                    fill={valueToColor(v, filters.metric, range.min, range.max)}
                  />
                )
              })}
              <text x={28 + 5 * 22 + 8} fill={tick} fontSize="10" fontFamily="var(--font-mono)">
                high · blue supply · green ok · orange stress · red critical · purple storage
              </text>
            </g>
          </svg>

          {/* Hover card */}
          {hover && hoverSample && (
            <div className="gmap-hover-card">
              <strong>{hover.name}</strong>
              <span className="mono">
                {formatMetric(metricValue(hoverSample, filters.metric), filters.metric)}
              </span>
              <span className="muted">
                {hover.operator} · {new Date(hoverSample.t).toLocaleTimeString()} · conf{' '}
                {(hoverSample.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Alert strip */}
          {layers.alerts && frame.alerts.length > 0 && (
            <div className="gmap-alerts">
              <AlertTriangle className="h-3.5 w-3.5" />
              <div className="gmap-alerts-scroll">
                {frame.alerts.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`gmap-alert ${a.severity}`}
                    onClick={() => a.nodeId && onSelectNode(a.nodeId)}
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {(selected || compare) && (
          <aside className="gmap-drawer" aria-label="Node detail">
            <div className="gmap-drawer-head">
              <div>
                <p className="kicker">Detail</p>
                <h2 className="page-h2" style={{ fontSize: '1.15rem' }}>
                  {selected?.name ?? '—'}
                </h2>
              </div>
              <button
                type="button"
                className="gmap-icon-btn"
                onClick={() => {
                  setSelectedId(null)
                  setCompareId(null)
                }}
                aria-label="Close detail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected && selectedSample && (
              <>
                <table className="list-table">
                  <tbody>
                    <tr>
                      <th scope="row">State</th>
                      <td>
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => openStateDetail(selected.stateAbbr)}
                        >
                          {selected.stateAbbr}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Kind</th>
                      <td>{selected.kind}</td>
                    </tr>
                    <tr>
                      <th scope="row">Operator</th>
                      <td>{selected.operator}</td>
                    </tr>
                    <tr>
                      <th scope="row">Load</th>
                      <td className="mono">{selectedSample.loadMw.toFixed(0)} MW</td>
                    </tr>
                    <tr>
                      <th scope="row">Generation</th>
                      <td className="mono">{selectedSample.genMw.toFixed(0)} MW</td>
                    </tr>
                    <tr>
                      <th scope="row">Voltage</th>
                      <td className="mono">
                        {selectedSample.voltageKv.toFixed(1)} kV{' '}
                        <span className="muted">nom {selected.voltageKvNom}</span>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Current</th>
                      <td className="mono">{selectedSample.currentA.toFixed(0)} A</td>
                    </tr>
                    <tr>
                      <th scope="row">Energy (interval)</th>
                      <td className="mono">{selectedSample.energyMwh.toFixed(1)} MWh</td>
                    </tr>
                    <tr>
                      <th scope="row">Amp-hours</th>
                      <td className="mono">{selectedSample.ampHours.toFixed(0)} Ah</td>
                    </tr>
                    <tr>
                      <th scope="row">Power density</th>
                      <td className="mono">{selectedSample.powerDensity.toFixed(0)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Energy density</th>
                      <td className="mono">{selectedSample.energyDensity.toFixed(0)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Congestion</th>
                      <td className="mono">{(selectedSample.congestion * 100).toFixed(0)}%</td>
                    </tr>
                    <tr>
                      <th scope="row">Emissions</th>
                      <td className="mono">{selectedSample.emissions} kg/MWh</td>
                    </tr>
                    {selectedSample.soc != null && (
                      <tr>
                        <th scope="row">Battery SOC</th>
                        <td className="mono">{selectedSample.soc}%</td>
                      </tr>
                    )}
                    <tr>
                      <th scope="row">Freshness</th>
                      <td className="mono">{selectedSample.freshnessSec}s · conf {(selectedSample.confidence * 100).toFixed(0)}%</td>
                    </tr>
                    <tr>
                      <th scope="row">Timestamp</th>
                      <td className="mono">{new Date(selectedSample.t).toISOString()}</td>
                    </tr>
                  </tbody>
                </table>

                {compare && compareSample && (
                  <div className="gmap-compare-block">
                    <p className="kicker">Compare</p>
                    <h3 className="page-h2" style={{ fontSize: '1rem' }}>
                      {compare.name}
                    </h3>
                    <table className="list-table">
                      <tbody>
                        <tr>
                          <th scope="row">Load Δ</th>
                          <td className="mono">
                            {(compareSample.loadMw - selectedSample.loadMw).toFixed(0)} MW
                          </td>
                        </tr>
                        <tr>
                          <th scope="row">Gen Δ</th>
                          <td className="mono">
                            {(compareSample.genMw - selectedSample.genMw).toFixed(0)} MW
                          </td>
                        </tr>
                        <tr>
                          <th scope="row">Voltage Δ</th>
                          <td className="mono">
                            {(compareSample.voltageKv - selectedSample.voltageKv).toFixed(2)} kV
                          </td>
                        </tr>
                        <tr>
                          <th scope="row">Density Δ</th>
                          <td className="mono">
                            {(compareSample.powerDensity - selectedSample.powerDensity).toFixed(0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div className="gmap-intel">
              <p className="kicker">Since last interval</p>
              <p className="sub" style={{ maxWidth: 'none' }}>
                {deltaText}
              </p>
              {filters.role !== 'executive' && (
                <>
                  <p className="kicker" style={{ marginTop: 12 }}>
                    Recommended
                  </p>
                  <ul className="gmap-actions">
                    {actions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Time scrubber */}
      <footer className="gmap-time">
        <div className="gmap-time-controls">
          {filters.mode !== 'live' ? (
            <>
              <button
                type="button"
                className="gmap-icon-btn"
                onClick={() => setPlaying(!playing)}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <input
                type="range"
                className="gmap-scrub"
                min={0}
                max={Math.max(0, history.length - 1)}
                value={histIndex}
                onChange={(e) => {
                  setPlaying(false)
                  scrubTo(Number(e.target.value))
                }}
                aria-label="Time scrubber"
              />
              <span className="gmap-time-label mono">
                {new Date(now).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </>
          ) : (
            <>
              <span className={`gmap-dot ok`} />
              <span className="gmap-time-label">
                Streaming · tick every 2.5s · {visibleNodes.length} nodes · {visibleLines.length}{' '}
                corridors
              </span>
              <span className="gmap-time-label muted mono">{deltaText}</span>
            </>
          )}
        </div>
      </footer>

      <p className="footer-line">
        Grid Pulse · current · voltage · power · energy · density · storage · simulated stream · wire
        EMS / ISO WebSocket in production
      </p>
    </div>
  )
}
