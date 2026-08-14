/**
 * Demand intelligence: AI/data centers, population growth, industrial manufacturing.
 * Private vs public capital. Map-first, national sample path (not IRP).
 */

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { projectUS, US_STATES } from '../../data/usStates'
import {
  DEMAND_YEARS,
  demandForYear,
  demandTimeline,
  driverColor,
  metricValue,
  nationalDemand,
  topStatesByDriver,
  type CapitalSource,
  type DemandDriver,
  type DemandYear,
  type StateDemandRow,
} from '../../data/demandForecast'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'
import { UsBasemap } from './UsBasemap'

const W = 1100
const H = 620

type MapMode = DemandDriver | 'capital'

function modeLabel(m: MapMode): string {
  if (m === 'ai') return 'AI / data centers'
  if (m === 'population') return 'Population'
  if (m === 'industrial') return 'Industrial'
  if (m === 'capital') return 'Private / public $'
  return 'Total peak'
}

function bubbleValue(r: StateDemandRow, mode: MapMode, capital: CapitalSource): number {
  if (mode === 'capital') {
    if (capital === 'private') return r.privateCapexB
    if (capital === 'public') return r.publicCapexB
    return r.privateCapexB + r.publicCapexB
  }
  return metricValue(r, mode, 'all')
}

function fillFor(
  r: StateDemandRow,
  mode: MapMode,
  capital: CapitalSource,
  dark: boolean
): string {
  if (mode === 'capital') {
    if (capital === 'private') return dark ? '#fbbf24' : '#d97706'
    if (capital === 'public') return dark ? '#60a5fa' : '#2563eb'
    const tot = r.privateCapexB + r.publicCapexB
    if (tot <= 0) return dark ? '#64748b' : '#94a3b8'
    const privShare = r.privateCapexB / tot
    if (privShare >= 0.65) return dark ? '#fbbf24' : '#d97706'
    if (privShare <= 0.45) return dark ? '#60a5fa' : '#2563eb'
    return dark ? '#a3e635' : '#65a30d'
  }
  return driverColor(mode, dark)
}

export function DemandForecastMap() {
  const { theme, openStateDetail } = useApp()
  const dark = theme === 'dark'
  const [year, setYear] = useState<DemandYear>(2030)
  const [mode, setMode] = useState<MapMode>('ai')
  const [capital, setCapital] = useState<CapitalSource>('all')
  const [selected, setSelected] = useState<string | null>('VA')
  const [hover, setHover] = useState<string | null>(null)

  const rows = useMemo(() => demandForYear(year), [year])
  const nat = useMemo(() => nationalDemand(year), [year])
  const timeline = useMemo(() => demandTimeline(), [])
  const chartDriver: DemandDriver =
    mode === 'capital' ? 'total' : mode
  const leaders = useMemo(
    () => topStatesByDriver(year, chartDriver, 12),
    [year, chartDriver]
  )

  const focus =
    rows.find((r) => r.abbr === (hover ?? selected)) ??
    rows.find((r) => r.abbr === selected) ??
    null

  const maxVal = Math.max(
    ...rows.map((r) => bubbleValue(r, mode, capital)),
    0.5
  )

  const ordered = useMemo(() => {
    return [...rows].sort(
      (a, b) => bubbleValue(b, mode, capital) - bubbleValue(a, mode, capital)
    )
  }, [rows, mode, capital])

  const stackChart = useMemo(
    () =>
      timeline.map((t) => ({
        year: t.year,
        AI: t.aiPeakGw,
        Population: t.popPeakGw,
        Industrial: t.indPeakGw,
        Private: t.privateCapexB,
        Public: t.publicCapexB,
      })),
    [timeline]
  )

  const exportAll = () => {
    const flat: Record<string, unknown>[] = []
    for (const y of DEMAND_YEARS) {
      for (const r of demandForYear(y)) {
        flat.push({
          year: r.year,
          state: r.abbr,
          name: r.name,
          region: r.region,
          ai_peak_gw: r.aiPeakGw,
          ai_twh: r.aiTwh,
          pop_peak_gw: r.popPeakGw,
          pop_twh: r.popTwh,
          ind_peak_gw: r.indPeakGw,
          ind_twh: r.indTwh,
          total_peak_gw: r.totalPeakGw,
          total_twh: r.totalTwh,
          private_capex_b: r.privateCapexB,
          public_capex_b: r.publicCapexB,
          ai_share_pct: r.aiSharePct,
        })
      }
    }
    exportCsv(flat, 'us-demand-forecast-ai-pop-industrial.csv')
  }

  const tipStyle = {
    background: dark ? '#0f172a' : '#fff',
    border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="fbal mapcentric demand-fc">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Demand · AI · people · industry · capital</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            U.S. demand forecast
          </h2>
          <p className="mapcentric-lede">
            Peak load attributed to AI data centers, population growth, and industrial
            manufacturing through {DEMAND_YEARS[DEMAND_YEARS.length - 1]}. Capex split private
            (hyperscale, plant) vs public (T&amp;D, rate base, incentives). Sample path, not
            official IRP.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>AI peak {year}</span>
            <strong style={{ color: driverColor('ai', dark) }}>
              {nat.aiPeakGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Pop add</span>
            <strong style={{ color: driverColor('population', dark) }}>
              {nat.popPeakGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Industrial</span>
            <strong style={{ color: driverColor('industrial', dark) }}>
              {nat.indPeakGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Private / public $</span>
            <strong>
              {nat.privateCapexB}
              <em>B</em>
              <span className="muted" style={{ fontWeight: 500, fontSize: '0.75rem' }}>
                {' '}
                / {nat.publicCapexB}B
              </span>
            </strong>
          </div>
        </div>
      </header>

      <div className="fbal-controls">
        <div className="gmap-mode" role="tablist" aria-label="Demand driver">
          {(
            [
              ['ai', 'AI / DC'],
              ['population', 'Population'],
              ['industrial', 'Industrial'],
              ['total', 'Total peak'],
              ['capital', 'Capital $'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={mode === id ? 'is-on' : ''}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === 'capital' && (
          <div className="gmap-mode" role="tablist" aria-label="Capital source">
            {(
              [
                ['all', 'All capital'],
                ['private', 'Private'],
                ['public', 'Public'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={capital === id ? 'is-on' : ''}
                onClick={() => setCapital(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="gmap-icon-btn"
          title="Export all years CSV"
          onClick={exportAll}
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="fbal-summary">{nat.summary}</p>

      {/* National driver timeline */}
      <section className="fbal-timeline demand-charts" aria-label="National demand by year">
        <div className="demand-chart-grid">
          <div className="demand-chart-card">
            <p className="kicker">Peak GW by driver (national)</p>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <AreaChart data={stackChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={36} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="AI"
                    stackId="1"
                    stroke={driverColor('ai', dark)}
                    fill={driverColor('ai', dark)}
                    fillOpacity={0.75}
                  />
                  <Area
                    type="monotone"
                    dataKey="Population"
                    stackId="1"
                    stroke={driverColor('population', dark)}
                    fill={driverColor('population', dark)}
                    fillOpacity={0.65}
                  />
                  <Area
                    type="monotone"
                    dataKey="Industrial"
                    stackId="1"
                    stroke={driverColor('industrial', dark)}
                    fill={driverColor('industrial', dark)}
                    fillOpacity={0.65}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="demand-chart-card">
            <p className="kicker">Capex $B cumulative sample (private vs public)</p>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={stackChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={40} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Private" stackId="c" fill={dark ? '#fbbf24' : '#d97706'} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Public" stackId="c" fill={dark ? '#60a5fa' : '#2563eb'} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <label className="fbal-year">
        <span>Horizon {year}</span>
        <input
          type="range"
          min={0}
          max={DEMAND_YEARS.length - 1}
          value={DEMAND_YEARS.indexOf(year)}
          onChange={(e) => setYear(DEMAND_YEARS[Number(e.target.value)])}
        />
        <div className="fbal-year-ticks">
          {DEMAND_YEARS.map((y) => (
            <button
              key={y}
              type="button"
              className={y === year ? 'is-on' : ''}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </label>

      <div className={`mapcentric-stage${focus ? ' has-drawer' : ''}`}>
        <div className="mapcentric-map fbal-map">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="fbal-svg"
            role="img"
            aria-label={`US demand map ${modeLabel(mode)} ${year}`}
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="28" fill="var(--mute)" fontSize="12" fontFamily="var(--font-mono)">
              {year} · {modeLabel(mode)}
              {mode === 'capital' ? ` · ${capital}` : ''} · bubble size = magnitude
            </text>

            <UsBasemap w={W} h={H} />

            {ordered.map((r) => {
              const { x, y } = projectUS(r.lon, r.lat, W, H)
              const val = bubbleValue(r, mode, capital)
              const rad = 5 + Math.sqrt(val / maxVal) * 30
              const fill = fillFor(r, mode, capital, dark)
              const on = r.abbr === selected || r.abbr === hover
              const showLabel = on || val >= maxVal * 0.4
              return (
                <g
                  key={r.abbr}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover(r.abbr)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(r.abbr)}
                >
                  {mode === 'ai' && r.aiPeakGw > 1.5 && (
                    <circle
                      r={rad + 3}
                      fill="none"
                      stroke={driverColor('ai', dark)}
                      strokeWidth={1.2}
                      strokeOpacity={0.35}
                    />
                  )}
                  <circle
                    r={rad}
                    fill={fill}
                    fillOpacity={on ? 0.95 : 0.78}
                    stroke={on ? 'var(--highlight)' : 'var(--bg)'}
                    strokeWidth={on ? 2 : 0.8}
                  />
                  <text
                    y={4}
                    textAnchor="middle"
                    fill={on || rad > 12 ? 'var(--highlight)' : 'var(--mute)'}
                    fontSize={on || rad > 14 ? 10 : 8}
                    fontWeight={600}
                    fontFamily="var(--font-sans)"
                    style={{ pointerEvents: 'none' }}
                  >
                    {r.abbr}
                  </text>
                  {showLabel && (
                    <text
                      y={rad + 12}
                      textAnchor="middle"
                      fill="var(--mute)"
                      fontSize={9}
                      fontFamily="var(--font-mono)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {mode === 'capital'
                        ? `$${val.toFixed(val >= 10 ? 0 : 1)}B`
                        : `${val.toFixed(val >= 10 ? 0 : 1)}`}
                    </text>
                  )}
                  <title>
                    {r.name} {year}: AI {r.aiPeakGw.toFixed(1)} GW · pop {r.popPeakGw.toFixed(1)} ·
                    ind {r.indPeakGw.toFixed(1)} · private ${r.privateCapexB}B / public $
                    {r.publicCapexB}B
                  </title>
                </g>
              )
            })}

            <g transform={`translate(24, ${H - 48})`}>
              <text fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                {mode === 'capital'
                  ? 'amber = private heavy · blue = public heavy · lime = mixed'
                  : `size = ${modeLabel(mode)}`}
              </text>
            </g>
          </svg>
        </div>

        {focus && (
          <aside className="mapcentric-drawer">
            <p className="kicker">
              Demand · {year} · {focus.region}
            </p>
            <h3 className="page-h2" style={{ fontSize: '1.15rem' }}>
              {focus.name}{' '}
              <span className="mono muted" style={{ fontSize: '0.85rem' }}>
                {focus.abbr}
              </span>
            </h3>
            <p className="sub" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {focus.note}
            </p>

            <div className="fbal-meter" aria-hidden>
              <div className="fbal-meter-row">
                <span>AI</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill demand"
                    style={{
                      width: `${Math.min(100, (focus.aiPeakGw / Math.max(focus.totalPeakGw * 0.4, focus.aiPeakGw, 1)) * 100)}%`,
                      background: driverColor('ai', dark),
                    }}
                  />
                </div>
                <span className="mono">{focus.aiPeakGw.toFixed(1)} GW</span>
              </div>
              <div className="fbal-meter-row">
                <span>Pop</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill"
                    style={{
                      width: `${Math.min(100, (focus.popPeakGw / Math.max(focus.totalPeakGw * 0.3, focus.popPeakGw, 0.5)) * 100)}%`,
                      background: driverColor('population', dark),
                    }}
                  />
                </div>
                <span className="mono">{focus.popPeakGw.toFixed(1)} GW</span>
              </div>
              <div className="fbal-meter-row">
                <span>Ind</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill"
                    style={{
                      width: `${Math.min(100, (focus.indPeakGw / Math.max(focus.totalPeakGw * 0.3, focus.indPeakGw, 0.5)) * 100)}%`,
                      background: driverColor('industrial', dark),
                    }}
                  />
                </div>
                <span className="mono">{focus.indPeakGw.toFixed(1)} GW</span>
              </div>
            </div>

            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Total peak proxy</th>
                  <td className="mono">{focus.totalPeakGw.toFixed(1)} GW</td>
                </tr>
                <tr>
                  <th scope="row">AI energy</th>
                  <td className="mono">{focus.aiTwh.toFixed(0)} TWh/yr</td>
                </tr>
                <tr>
                  <th scope="row">AI share of peak</th>
                  <td className="mono">{focus.aiSharePct}%</td>
                </tr>
                <tr>
                  <th scope="row">Private capex</th>
                  <td className="mono" style={{ color: dark ? '#fbbf24' : '#d97706' }}>
                    ${focus.privateCapexB}B
                  </td>
                </tr>
                <tr>
                  <th scope="row">Public capex</th>
                  <td className="mono" style={{ color: dark ? '#60a5fa' : '#2563eb' }}>
                    ${focus.publicCapexB}B
                  </td>
                </tr>
                <tr>
                  <th scope="row">Private share</th>
                  <td className="mono">
                    {(
                      (focus.privateCapexB /
                        Math.max(0.1, focus.privateCapexB + focus.publicCapexB)) *
                      100
                    ).toFixed(0)}
                    %
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="btn-row" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => openStateDetail(focus.abbr)}
              >
                Open state
              </button>
            </div>
          </aside>
        )}
      </div>

      <section className="fbal-table-wrap" aria-label="Top states by driver">
        <div className="fbal-table-head">
          <h3 className="page-h2" style={{ fontSize: '1rem' }}>
            Leaders · {modeLabel(mode === 'capital' ? 'total' : mode)} · {year}
          </h3>
          <p className="muted mono" style={{ fontSize: '0.8rem' }}>
            {US_STATES.length} states · sorted by{' '}
            {mode === 'capital' ? 'total peak' : modeLabel(mode)}
          </p>
        </div>
        <div className="table-scroll">
          <table className="list-table dense">
            <thead>
              <tr>
                <th>#</th>
                <th>State</th>
                <th className="num">AI GW</th>
                <th className="num">Pop GW</th>
                <th className="num">Ind GW</th>
                <th className="num">Total</th>
                <th className="num">Private $B</th>
                <th className="num">Public $B</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((r, i) => (
                <tr
                  key={r.abbr}
                  className={r.abbr === selected ? 'is-selected' : undefined}
                  onClick={() => setSelected(r.abbr)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="mono muted">{i + 1}</td>
                  <td>
                    <strong>{r.abbr}</strong>{' '}
                    <span className="muted">{r.name}</span>
                  </td>
                  <td className="num mono" style={{ color: driverColor('ai', dark) }}>
                    {r.aiPeakGw.toFixed(1)}
                  </td>
                  <td className="num mono" style={{ color: driverColor('population', dark) }}>
                    {r.popPeakGw.toFixed(1)}
                  </td>
                  <td className="num mono" style={{ color: driverColor('industrial', dark) }}>
                    {r.indPeakGw.toFixed(1)}
                  </td>
                  <td className="num mono">{r.totalPeakGw.toFixed(1)}</td>
                  <td className="num mono">${r.privateCapexB}</td>
                  <td className="num mono">${r.publicCapexB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line muted" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
        Demand stack · AI corridors weighted by known hyperscale clusters · population CAGR
        Sun Belt vs slow-growth states · industrial weights by manufacturing intensity · private
        share higher on hyperscale campuses, public higher on wires and rate-base firm power ·
        sample educational path
      </p>
    </div>
  )
}
