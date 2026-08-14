/**
 * Regional map: interconnects, ISO/utility division, interties,
 * how much each state buys, and dependency / risk analysis.
 * Live CAISO overlay when the pull succeeds.
 */

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { projectUS, US_STATES } from '../../data/usStates'
import {
  GRID_INTERTIES,
  GRID_ZONES,
  INTERCONNECTS,
  UTILITIES,
  gridSummary,
  intertiesForZone,
  utilitiesInZone,
  zoneById,
  type GridZone,
  type GridZoneId,
  type InterconnectId,
} from '../../data/gridUtilities'
import {
  allDependencies,
  interconnectColor,
  nationalDependency,
  riskColor,
  type RiskBand,
  type StateDependency,
} from '../../data/stateDependency'
import { useApp } from '../../context/AppContext'
import { useLiveGrid } from '../../hooks/useLiveGrid'
import { ageLabel, formatRefreshHuman, REFRESH } from '../../data/refreshRates'
import { exportCsv } from '../../lib/utils'

const W = 1100
const H = 640

type FocusMode =
  | 'interconnects'
  | 'zones'
  | 'utilities'
  | 'interties'
  | 'buys'
  | 'dependency'
  | 'risk'

export function GridInterconnectMap() {
  const { theme, openStateDetail } = useApp()
  const dark = theme === 'dark'
  const live = useLiveGrid(true)
  void live.ageTick
  const caisoGw =
    live.data?.caiso?.currentDemandMw != null
      ? live.data.caiso.currentDemandMw / 1000
      : null

  const [mode, setMode] = useState<FocusMode>('risk')
  const [interconnect, setInterconnect] = useState<InterconnectId | 'all'>('all')
  const [selectedZone, setSelectedZone] = useState<GridZoneId | null>('pjm')
  const [selectedUtil, setSelectedUtil] = useState<string | null>(null)
  const [selectedTie, setSelectedTie] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>('CA')
  const [hoverZone, setHoverZone] = useState<GridZoneId | null>(null)
  const [hoverUtil, setHoverUtil] = useState<string | null>(null)
  const [hoverState, setHoverState] = useState<string | null>(null)

  const summary = useMemo(() => gridSummary(), [])
  const deps = useMemo(() => allDependencies(), [])
  const nat = useMemo(() => nationalDependency(), [])

  const stateMode = mode === 'buys' || mode === 'dependency' || mode === 'risk'

  const zones = useMemo(() => {
    if (interconnect === 'all') return GRID_ZONES
    return GRID_ZONES.filter((z) => z.interconnect === interconnect)
  }, [interconnect])

  const utilities = useMemo(() => {
    let list = UTILITIES.filter((u) => u.kind !== 'iso')
    if (interconnect !== 'all') {
      list = list.filter((u) => {
        const z = zoneById(u.zoneId)
        return z?.interconnect === interconnect
      })
    }
    if (selectedZone && !stateMode) {
      const inZ = utilitiesInZone(selectedZone)
      list = list.filter((u) => inZ.some((x) => x.id === u.id))
    }
    return list
  }, [interconnect, selectedZone, stateMode])

  const interties = useMemo(() => {
    let list = GRID_INTERTIES.filter((t) => t.fromZone !== t.toZone)
    if (interconnect !== 'all') {
      list = list.filter((t) => {
        const a = zoneById(t.fromZone)
        const b = zoneById(t.toZone)
        return a?.interconnect === interconnect || b?.interconnect === interconnect
      })
    }
    if (selectedZone && !stateMode) {
      list = intertiesForZone(selectedZone).filter((t) => t.fromZone !== t.toZone)
    }
    return list
  }, [interconnect, selectedZone, stateMode])

  const visibleDeps = useMemo(() => {
    if (interconnect === 'all') return deps
    return deps.filter((d) => d.interconnect === interconnect)
  }, [deps, interconnect])

  const focusDep =
    visibleDeps.find((d) => d.abbr === (hoverState ?? selectedState)) ??
    visibleDeps.find((d) => d.abbr === selectedState) ??
    null

  const zone = selectedZone ? zoneById(selectedZone) : null
  const util = selectedUtil ? UTILITIES.find((u) => u.id === selectedUtil) : null
  const tie = selectedTie ? GRID_INTERTIES.find((t) => t.id === selectedTie) : null

  const maxBuy = Math.max(...deps.map((d) => d.buysTwh), 1)
  const maxDep = Math.max(...deps.map((d) => d.importSharePct), 1)

  const metricOf = (d: StateDependency) => {
    if (mode === 'buys') return d.buysTwh
    if (mode === 'dependency') return d.importSharePct
    return d.riskScore
  }

  const leaders = useMemo(() => {
    return [...visibleDeps].sort((a, b) => metricOf(b) - metricOf(a)).slice(0, 12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDeps, mode])

  const buyChart = useMemo(
    () =>
      [...deps]
        .sort((a, b) => b.buysTwh - a.buysTwh)
        .slice(0, 10)
        .map((d) => ({ name: d.abbr, Buys: d.buysTwh, Sells: d.sellsTwh })),
    [deps]
  )

  const riskChart = useMemo(
    () =>
      [...deps]
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10)
        .map((d) => ({ name: d.abbr, Risk: d.riskScore, band: d.band })),
    [deps]
  )

  const liveUtil = (mw: number) => {
    // Sample utilization: clock + extra when CAISO is hot (west ties)
    const t = Date.now() / 180000
    const base = 0.42 + 0.22 * Math.sin(t + mw / 4000)
    const westBoost = caisoGw != null && caisoGw > 32 ? 0.12 : 0
    return Math.min(0.95, Math.max(0.15, base + westBoost))
  }

  const exportAll = () => {
    exportCsv(
      deps.map((d) => ({
        state: d.abbr,
        name: d.name,
        interconnect: d.interconnect,
        buys_twh: d.buysTwh,
        sells_twh: d.sellsTwh,
        net_buy_twh: d.netBuyTwh,
        import_share_pct: d.importSharePct,
        reserve_pct: d.reservePct,
        isolation: d.isolation,
        partners: d.partners.join('|'),
        ai_2030_gw: d.aiPeak2030Gw,
        risk_score: d.riskScore,
        band: d.band,
      })),
      'us-state-energy-dependency-risk.csv'
    )
  }

  const ink = dark ? '#e8e4db' : '#2e2b23'
  const mute = dark ? '#8a8478' : '#7a7468'
  const tipStyle = {
    background: dark ? '#0f172a' : '#fff',
    border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 8,
    fontSize: 12,
  }

  const zonePoint = (z: GridZone) => projectUS(z.lon, z.lat, W, H)

  return (
    <div className="ugrid mapcentric">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Regions · interties · buys · risk</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            How the grid is divided, connected, and who buys
          </h2>
          <p className="mapcentric-lede">
            Three interconnections, ISO/RTO footprints, utilities, and seams. State bubbles show how
            much electricity each jurisdiction buys and a composite dependence / isolation risk score.
            {caisoGw != null
              ? ` CAISO live ${caisoGw.toFixed(2)} GW (${ageLabel(live.lastOk)}).`
              : ` CAISO live pull every ${formatRefreshHuman(REFRESH.caisoLiveMs)}.`}{' '}
            Schematic, not legal GIS.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Gross buys</span>
            <strong>
              {nat.buysTwh}
              <em>TWh</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Net buyers</span>
            <strong>
              {nat.netBuyers}
              <em>states</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Exposed + critical</span>
            <strong style={{ color: 'var(--danger)' }}>
              {nat.exposed + nat.critical}
              <em>/{nat.count}</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>CAISO live</span>
            <strong style={{ color: caisoGw != null ? 'var(--ok)' : undefined }}>
              {caisoGw != null ? caisoGw.toFixed(1) : '—'}
              <em>GW</em>
            </strong>
          </div>
        </div>
      </header>

      <div className="fbal-controls" style={{ flexWrap: 'wrap' }}>
        <div className="gmap-mode" role="tablist" aria-label="Map layer">
          {(
            [
              ['interconnects', 'Interconnects'],
              ['zones', 'Zones'],
              ['utilities', 'Utilities'],
              ['interties', 'Interties'],
              ['buys', 'State buys'],
              ['dependency', 'Dependence'],
              ['risk', 'Risk'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={mode === id ? 'is-on' : ''}
              onClick={() => {
                setMode(id)
                setSelectedUtil(null)
                setSelectedTie(null)
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="gmap-mode">
          <button
            type="button"
            className={interconnect === 'all' ? 'is-on' : ''}
            onClick={() => setInterconnect('all')}
          >
            All
          </button>
          {INTERCONNECTS.map((ic) => (
            <button
              key={ic.id}
              type="button"
              className={interconnect === ic.id ? 'is-on' : ''}
              onClick={() => setInterconnect(ic.id)}
              style={
                interconnect === ic.id ? { boxShadow: `inset 0 -2px 0 ${ic.color}` } : undefined
              }
            >
              {ic.short}
            </button>
          ))}
        </div>
        <button type="button" className="gmap-icon-btn" title="Export CSV" onClick={exportAll}>
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="ugrid-ic-strip">
        {INTERCONNECTS.map((ic) => (
          <button
            key={ic.id}
            type="button"
            className={`ugrid-ic-chip${interconnect === ic.id ? ' is-on' : ''}`}
            onClick={() => setInterconnect(interconnect === ic.id ? 'all' : ic.id)}
          >
            <i style={{ background: ic.color }} />
            <strong>{ic.short}</strong>
            <span>{ic.note}</span>
          </button>
        ))}
      </div>

      <p className="fbal-summary">
        {nat.netBuyers} net-buying states · {nat.netSellers} net sellers · {nat.critical} critical /{' '}
        {nat.exposed} exposed · {nat.islands} islanded (no interstate kWh) · average risk {nat.avgRisk}
        /100. Intertie transfer catalog {summary.transferGw.toFixed(0)} GW (sample ratings).
      </p>

      <section className="fbal-timeline demand-charts">
        <div className="demand-chart-grid">
          <div className="demand-chart-card">
            <p className="kicker">Who buys the most electricity (TWh/yr)</p>
            <div style={{ width: '100%', height: 170 }}>
              <ResponsiveContainer>
                <BarChart data={buyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={32} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="Buys" fill={dark ? '#fb923c' : '#ea580c'} />
                  <Bar dataKey="Sells" fill={dark ? '#4ade80' : '#16a34a'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="demand-chart-card">
            <p className="kicker">Highest dependence / isolation risk</p>
            <div style={{ width: '100%', height: 170 }}>
              <ResponsiveContainer>
                <BarChart data={riskChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={28} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="Risk">
                    {riskChart.map((r) => (
                      <Cell key={r.name} fill={riskColor(r.band as RiskBand, dark)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <div className={`mapcentric-stage has-drawer`}>
        <div className="mapcentric-map">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="fbal-svg"
            role="img"
            aria-label="US grid interconnect, buys, and risk map"
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="26" fill={mute} fontSize="11" fontFamily="var(--font-mono)">
              {mode === 'interconnects' && 'Wash = Eastern / Western / Texas islands'}
              {mode === 'zones' && 'Blobs = ISO / RTO / reliability footprints'}
              {mode === 'utilities' && 'Diamonds = utilities · orange ring = multi-zone'}
              {mode === 'interties' && 'Lines = seams · width ∝ rating · opacity ∝ live sample use'}
              {mode === 'buys' && 'Bubbles = TWh bought (gross imports)'}
              {mode === 'dependency' && 'Bubbles = import share of energy use'}
              {mode === 'risk' && 'Bubbles = composite buy / isolation / AI / fuel risk'}
            </text>

            <path
              d="M 60 90 L 120 55 L 220 42 L 340 40 L 480 50 L 600 70 L 700 110 L 760 170 L 780 240 L 760 310 L 700 360 L 600 385 L 480 390 L 360 380 L 240 360 L 140 320 L 80 250 L 55 170 Z"
              fill="var(--fill)"
              stroke="var(--line-soft)"
              strokeWidth={1}
              opacity={0.55}
            />

            {INTERCONNECTS.filter((ic) => interconnect === 'all' || interconnect === ic.id).map(
              (ic) =>
                GRID_ZONES.filter((z) => z.interconnect === ic.id).map((z) => {
                  const { x, y } = zonePoint(z)
                  return (
                    <circle
                      key={`ic-${ic.id}-${z.id}`}
                      cx={x}
                      cy={y}
                      r={z.footprintR * (mode === 'interconnects' ? 1.55 : 1.25)}
                      fill={ic.color}
                      fillOpacity={mode === 'interconnects' ? 0.14 : 0.05}
                      style={{ pointerEvents: 'none' }}
                    />
                  )
                })
            )}

            {(mode === 'zones' || mode === 'interconnects' || mode === 'interties') &&
              zones.map((z) => {
                const { x, y } = zonePoint(z)
                const on = z.id === selectedZone || z.id === hoverZone
                return (
                  <g
                    key={z.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverZone(z.id)}
                    onMouseLeave={() => setHoverZone(null)}
                    onClick={() => {
                      setSelectedZone(z.id)
                      setSelectedUtil(null)
                      setSelectedTie(null)
                      setSelectedState(z.states[0] ?? null)
                    }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={z.footprintR * (on ? 1.08 : 1)}
                      fill={z.color}
                      fillOpacity={on ? 0.3 : 0.16}
                      stroke={z.color}
                      strokeWidth={on ? 2.2 : 1.2}
                    />
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fill={ink}
                      fontSize={11}
                      fontWeight={700}
                      fontFamily="var(--font-sans)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {z.short}
                    </text>
                    <title>
                      {z.name} · {z.interconnect} · peak ~{z.peakGw} GW
                    </title>
                  </g>
                )
              })}

            {(mode === 'interties' || mode === 'zones' || mode === 'interconnects') &&
              interties.map((t) => {
                const a = zoneById(t.fromZone)
                const b = zoneById(t.toZone)
                if (!a || !b) return null
                const pa = zonePoint(a)
                const pb = zonePoint(b)
                const on = t.id === selectedTie
                const u = liveUtil(t.transferMw)
                const sw = 1 + Math.min(8, t.transferMw / 1200)
                const dash = t.kind === 'dc' ? '6 4' : t.kind === 'seam' ? '2 3' : undefined
                return (
                  <line
                    key={t.id}
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    stroke={on ? ink : dark ? '#94a3b8' : '#64748b'}
                    strokeWidth={on ? sw + 1 : sw}
                    strokeOpacity={0.25 + u * 0.6}
                    strokeDasharray={dash}
                    className={t.kind !== 'seam' ? 'pmap-flow' : undefined}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTie(t.id)
                      setSelectedUtil(null)
                      setSelectedState(null)
                    }}
                  >
                    <title>
                      {t.name}: {t.transferMw} MW · sample use {(u * 100).toFixed(0)}%
                    </title>
                  </line>
                )
              })}

            {(mode === 'utilities' || mode === 'zones') &&
              utilities.map((u) => {
                const z = zoneById(u.zoneId)
                const { x, y } = projectUS(u.lon, u.lat, W, H)
                const on = u.id === selectedUtil || u.id === hoverUtil
                const multi = (u.alsoZones?.length ?? 0) > 0
                if (mode === 'zones' && !multi && !on) return null
                const s = 5 + Math.min(10, (u.customersM ?? 0.5) * 1.2)
                return (
                  <g
                    key={u.id}
                    transform={`translate(${x},${y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverUtil(u.id)}
                    onMouseLeave={() => setHoverUtil(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedUtil(u.id)
                      setSelectedZone(u.zoneId)
                      setSelectedTie(null)
                    }}
                  >
                    {multi && (
                      <circle
                        r={s + 5}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                      />
                    )}
                    <rect
                      x={-s}
                      y={-s}
                      width={s * 2}
                      height={s * 2}
                      rx={2}
                      fill={z?.color ?? '#64748b'}
                      fillOpacity={on ? 0.95 : 0.8}
                      stroke={on ? ink : 'var(--bg)'}
                      strokeWidth={on ? 2 : 0.8}
                      transform="rotate(45)"
                    />
                    {(on || mode === 'utilities') && (
                      <text
                        y={s + 11}
                        textAnchor="middle"
                        fill={ink}
                        fontSize={8}
                        fontFamily="var(--font-sans)"
                        style={{ pointerEvents: 'none' }}
                      >
                        {u.short}
                      </text>
                    )}
                    <title>{u.name}</title>
                  </g>
                )
              })}

            {stateMode &&
              visibleDeps.map((d) => {
                const { x, y } = projectUS(d.lon, d.lat, W, H)
                const val = metricOf(d)
                const max = mode === 'buys' ? maxBuy : mode === 'dependency' ? maxDep : 100
                const rad = 5 + Math.sqrt(Math.max(0.2, val) / max) * 28
                const on = d.abbr === selectedState || d.abbr === hoverState
                const fill =
                  mode === 'risk'
                    ? riskColor(d.band, dark)
                    : mode === 'buys'
                      ? d.netBuyTwh > 0
                        ? dark
                          ? '#fb923c'
                          : '#ea580c'
                        : dark
                          ? '#4ade80'
                          : '#16a34a'
                      : interconnectColor(d.interconnect)
                const liveRing = d.abbr === 'CA' && caisoGw != null
                return (
                  <g
                    key={d.abbr}
                    transform={`translate(${x},${y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverState(d.abbr)}
                    onMouseLeave={() => setHoverState(null)}
                    onClick={() => {
                      setSelectedState(d.abbr)
                      setSelectedUtil(null)
                      setSelectedTie(null)
                      if (d.zones[0]) setSelectedZone(d.zones[0])
                    }}
                  >
                    {liveRing && (
                      <circle
                        r={rad + 4}
                        fill="none"
                        stroke={dark ? '#38bdf8' : '#0284c7'}
                        strokeWidth={1.4}
                        strokeOpacity={0.7}
                      />
                    )}
                    <circle
                      r={rad}
                      fill={fill}
                      fillOpacity={on ? 0.95 : 0.8}
                      stroke={on ? 'var(--highlight)' : 'var(--bg)'}
                      strokeWidth={on ? 2 : 0.8}
                    />
                    <text
                      y={4}
                      textAnchor="middle"
                      fill={on || rad > 12 ? 'var(--highlight)' : mute}
                      fontSize={on || rad > 13 ? 10 : 8}
                      fontWeight={600}
                      fontFamily="var(--font-sans)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {d.abbr}
                    </text>
                    {(on || val >= max * 0.45) && (
                      <text
                        y={rad + 11}
                        textAnchor="middle"
                        fill={mute}
                        fontSize={8}
                        fontFamily="var(--font-mono)"
                        style={{ pointerEvents: 'none' }}
                      >
                        {mode === 'buys'
                          ? `${d.buysTwh}`
                          : mode === 'dependency'
                            ? `${d.importSharePct.toFixed(0)}%`
                            : d.riskScore}
                      </text>
                    )}
                    <title>
                      {d.name}: buy {d.buysTwh} TWh · import {d.importSharePct}% · risk {d.riskScore}{' '}
                      {d.band}
                    </title>
                  </g>
                )
              })}

            {stateMode &&
              focusDep &&
              focusDep.partners.map((p) => {
                const other = US_STATES.find((s) => s.abbr === p)
                if (!other) return null
                const a = projectUS(focusDep.lon, focusDep.lat, W, H)
                const b = projectUS(other.lon, other.lat, W, H)
                return (
                  <line
                    key={`${focusDep.abbr}-${p}`}
                    x1={b.x}
                    y1={b.y}
                    x2={a.x}
                    y2={a.y}
                    stroke={dark ? '#fb923c' : '#ea580c'}
                    strokeWidth={1.6}
                    strokeOpacity={0.55}
                    markerEnd="url(#buy-arrow)"
                  />
                )
              })}

            <defs>
              <marker id="buy-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={dark ? '#fb923c' : '#ea580c'} />
              </marker>
            </defs>

            <g transform={`translate(24, ${H - 42})`}>
              <text fill={mute} fontSize="10" fontFamily="var(--font-mono)">
                {stateMode
                  ? 'orange = net buyer · green = net seller · cyan ring = CAISO live · lines = buy partners'
                  : 'blobs = zones · diamonds = utilities · lines = interties'}
              </text>
            </g>
          </svg>
        </div>

        <aside className="mapcentric-drawer">
          {stateMode && focusDep ? (
            <>
              <p className="kicker">
                {focusDep.interconnect} · {focusDep.isolation} · {focusDep.band}
              </p>
              <h3 className="page-h2" style={{ fontSize: '1.12rem' }}>
                {focusDep.name}{' '}
                <span className="mono muted" style={{ fontSize: '0.85rem' }}>
                  {focusDep.abbr}
                </span>
              </h3>
              <span
                className="fbal-badge"
                style={{
                  background: `${riskColor(focusDep.band, dark)}22`,
                  color: riskColor(focusDep.band, dark),
                }}
              >
                risk {focusDep.riskScore}/100 · {focusDep.band}
              </span>
              <p className="sub" style={{ fontSize: '0.84rem', marginTop: 8 }}>
                {focusDep.headline}
              </p>
              <p className="sub" style={{ fontSize: '0.8rem' }}>
                {focusDep.note}
              </p>
              {focusDep.abbr === 'CA' && caisoGw != null && (
                <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--ok)' }}>
                  CAISO live {caisoGw.toFixed(2)} GW · {ageLabel(live.lastOk)}
                </p>
              )}
              <table className="list-table dense">
                <tbody>
                  <tr>
                    <th scope="row">Buys (imports)</th>
                    <td className="mono">{focusDep.buysTwh} TWh</td>
                  </tr>
                  <tr>
                    <th scope="row">Sells (exports)</th>
                    <td className="mono">{focusDep.sellsTwh} TWh</td>
                  </tr>
                  <tr>
                    <th scope="row">Net purchase</th>
                    <td
                      className="mono"
                      style={{ color: focusDep.netBuyTwh > 0 ? 'var(--danger)' : 'var(--ok)' }}
                    >
                      {focusDep.netBuyTwh > 0 ? '+' : ''}
                      {focusDep.netBuyTwh} TWh
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Import share of use</th>
                    <td className="mono">{focusDep.importSharePct}%</td>
                  </tr>
                  <tr>
                    <th scope="row">Reserve vs peak</th>
                    <td className="mono">{focusDep.reservePct}%</td>
                  </tr>
                  <tr>
                    <th scope="row">Buy partners</th>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>
                      {focusDep.partners.join(' · ') || 'None / island'}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">AI 2030 sample</th>
                    <td className="mono">{focusDep.aiPeak2030Gw.toFixed(1)} GW</td>
                  </tr>
                  <tr>
                    <th scope="row">Primary fuel</th>
                    <td>
                      {focusDep.primaryFuel} {focusDep.primaryFuelSharePct}%
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="kicker" style={{ marginTop: 10 }}>
                Risk stack
              </p>
              <ul className="gmap-actions">
                {focusDep.factors.map((f) => (
                  <li key={f.id}>
                    <strong className="mono">{f.points.toFixed(0)}</strong> {f.label}
                    <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                      {f.detail}
                    </span>
                  </li>
                ))}
                {focusDep.factors.length === 0 && <li>No elevated factors in this sample.</li>}
              </ul>
              <div className="btn-row" style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => openStateDetail(focusDep.abbr)}
                >
                  Open state
                </button>
              </div>
            </>
          ) : util ? (
            <>
              <p className="kicker">Utility</p>
              <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                {util.name}
              </h3>
              <p className="sub" style={{ fontSize: '0.82rem' }}>
                {util.note}
              </p>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Kind</th>
                    <td>{util.kind}</td>
                  </tr>
                  <tr>
                    <th scope="row">Zone</th>
                    <td>{zoneById(util.zoneId)?.short}</td>
                  </tr>
                  <tr>
                    <th scope="row">States</th>
                    <td>
                      {util.states.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="linkish"
                          style={{ marginRight: 6 }}
                          onClick={() => {
                            setSelectedState(s)
                            setMode('risk')
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : tie ? (
            <>
              <p className="kicker">Intertie · live sample use</p>
              <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                {tie.name}
              </h3>
              <p className="sub" style={{ fontSize: '0.82rem' }}>
                {tie.note}
              </p>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Rating</th>
                    <td className="mono">{tie.transferMw.toLocaleString()} MW</td>
                  </tr>
                  <tr>
                    <th scope="row">Sample use now</th>
                    <td className="mono">{(liveUtil(tie.transferMw) * 100).toFixed(0)}%</td>
                  </tr>
                  <tr>
                    <th scope="row">Type</th>
                    <td>{tie.kind.toUpperCase()}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : zone ? (
            <>
              <p className="kicker">
                {zone.kind} · {zone.interconnect}
              </p>
              <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                {zone.name}
              </h3>
              <p className="sub" style={{ fontSize: '0.82rem' }}>
                {zone.note}
              </p>
              <p className="kicker">States in footprint</p>
              <ul className="gmap-actions">
                {zone.states.map((abbr) => {
                  const d = deps.find((x) => x.abbr === abbr)
                  return (
                    <li key={abbr}>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => {
                          setSelectedState(abbr)
                          setMode('risk')
                        }}
                      >
                        {abbr}
                        {d ? ` · buy ${d.buysTwh} TWh · risk ${d.riskScore}` : ''}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <p className="sub">Click a state, zone, utility, or intertie.</p>
          )}
        </aside>
      </div>

      <section className="fbal-table-wrap">
        <div className="fbal-table-head">
          <h3 className="page-h2" style={{ fontSize: '1rem' }}>
            {mode === 'buys'
              ? 'Largest buyers'
              : mode === 'dependency'
                ? 'Highest import share'
                : 'Highest risk'}{' '}
            · {interconnect === 'all' ? 'US' : interconnect}
          </h3>
          <p className="muted mono" style={{ fontSize: '0.8rem' }}>
            {visibleDeps.length} jurisdictions
          </p>
        </div>
        <div className="table-scroll">
          <table className="list-table dense">
            <thead>
              <tr>
                <th>#</th>
                <th>State</th>
                <th className="num">Buys</th>
                <th className="num">Sells</th>
                <th className="num">Net</th>
                <th className="num">Import %</th>
                <th className="num">Risk</th>
                <th>Band</th>
                <th>Partners</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((d, i) => (
                <tr
                  key={d.abbr}
                  className={d.abbr === selectedState ? 'is-selected' : undefined}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedState(d.abbr)}
                >
                  <td className="mono muted">{i + 1}</td>
                  <td>
                    <strong>{d.abbr}</strong> <span className="muted">{d.name}</span>
                  </td>
                  <td className="num mono">{d.buysTwh}</td>
                  <td className="num mono">{d.sellsTwh}</td>
                  <td
                    className="num mono"
                    style={{ color: d.netBuyTwh > 0 ? 'var(--danger)' : 'var(--ok)' }}
                  >
                    {d.netBuyTwh}
                  </td>
                  <td className="num mono">{d.importSharePct}%</td>
                  <td className="num mono">{d.riskScore}</td>
                  <td>
                    <span
                      className="fbal-badge"
                      style={{
                        background: `${riskColor(d.band, dark)}22`,
                        color: riskColor(d.band, dark),
                      }}
                    >
                      {d.band}
                    </span>
                  </td>
                  <td className="muted" style={{ fontSize: '0.75rem' }}>
                    {d.partners.join(' · ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line muted" style={{ marginTop: '0.85rem', fontSize: '0.78rem' }}>
        Risk = import share + net-buyer size + partner concentration + island/ERCOT/peninsula + thin
        reserve + AI 2030 load + fuel concentration + cross-border hydro. Sample educational path.
        Intertie &quot;live use&quot; is a clocked sample, boosted when CAISO load is high.
      </p>
    </div>
  )
}
