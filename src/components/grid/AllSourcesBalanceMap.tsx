/**
 * Map all US energy sources: production, demand, deficits, timelines.
 * Drivers: AI data centers, population, industrial manufacturing.
 * Beyond natural gas — gas, coal, nuclear, oil, solar, wind, hydro, battery, geo, bio.
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
  SOURCE_META,
  SOURCE_YEARS,
  balancesForYear,
  metricForSource,
  nationalSources,
  sourceColor,
  sourceMeta,
  sourceTimeline,
  topStatesForSource,
  type BalanceMetric,
  type EnergySourceId,
  type SourceYear,
  type StateSourceBalance,
} from '../../data/allSourceBalance'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'
import { UsBasemap } from './UsBasemap'

const W = 1100
const H = 620

function statusColor(status: StateSourceBalance['status'], dark: boolean): string {
  if (status === 'critical') return dark ? '#fb7185' : '#e11d48'
  if (status === 'deficit') return dark ? '#fb923c' : '#ea580c'
  if (status === 'tight') return dark ? '#facc15' : '#ca8a04'
  return dark ? '#4ade80' : '#16a34a'
}

export function AllSourcesBalanceMap() {
  const { theme, openStateDetail } = useApp()
  const dark = theme === 'dark'
  const [year, setYear] = useState<SourceYear>(2030)
  const [source, setSource] = useState<EnergySourceId>('all')
  const [metric, setMetric] = useState<BalanceMetric>('deficit')
  const [selected, setSelected] = useState<string | null>('TX')
  const [hover, setHover] = useState<string | null>(null)

  const rows = useMemo(() => balancesForYear(year), [year])
  const nat = useMemo(() => nationalSources(year), [year])
  const timeline = useMemo(() => sourceTimeline(), [])
  const leaders = useMemo(
    () => topStatesForSource(year, source, metric, 12),
    [year, source, metric]
  )

  const focus =
    rows.find((r) => r.abbr === (hover ?? selected)) ??
    rows.find((r) => r.abbr === selected) ??
    null

  const maxVal = Math.max(
    ...rows.map((r) => Math.abs(metricForSource(r, source, metric))),
    0.5
  )

  const ordered = useMemo(() => {
    return [...rows].sort(
      (a, b) =>
        Math.abs(metricForSource(b, source, metric)) -
        Math.abs(metricForSource(a, source, metric))
    )
  }, [rows, source, metric])

  const deficitChart = useMemo(
    () =>
      timeline.map((t) => {
        const row: Record<string, number | string> = { year: t.year }
        for (const m of SOURCE_META) {
          row[m.short] = t.bySource[m.id].deficitGw
        }
        return row
      }),
    [timeline]
  )

  const prodDemandChart = useMemo(
    () =>
      timeline.map((t) => {
        if (source === 'all') {
          return {
            year: t.year,
            Production: t.totalFirmGw,
            Demand: t.totalDemandPeakGw,
            AI: t.aiPeakGw,
            Population: t.popPeakGw,
            Industrial: t.indPeakGw,
          }
        }
        const sl = t.bySource[source]
        return {
          year: t.year,
          Production: sl.productionGw,
          Firm: sl.firmGw,
          Demand: sl.demandGw,
          Deficit: sl.deficitGw,
        }
      }),
    [timeline, source]
  )

  const mixChart = useMemo(() => {
    const row: { name: string; Production: number; Demand: number; Deficit: number }[] = []
    for (const m of SOURCE_META) {
      const sl = nat.bySource[m.id]
      row.push({
        name: m.short,
        Production: sl.productionGw,
        Demand: sl.demandGw,
        Deficit: sl.deficitGw,
      })
    }
    return row
  }, [nat])

  const exportAll = () => {
    const flat: Record<string, unknown>[] = []
    for (const y of SOURCE_YEARS) {
      for (const r of balancesForYear(y)) {
        for (const m of SOURCE_META) {
          const sl = r.bySource[m.id]
          flat.push({
            year: r.year,
            state: r.abbr,
            source: m.id,
            production_gw: sl.productionGw,
            firm_gw: sl.firmGw,
            demand_gw: sl.demandGw,
            deficit_gw: sl.deficitGw,
            surplus_gw: sl.surplusGw,
            production_twh: sl.productionTwh,
            demand_twh: sl.demandTwh,
            ai_peak_gw: r.aiPeakGw,
            pop_peak_gw: r.popPeakGw,
            ind_peak_gw: r.indPeakGw,
            total_demand_peak_gw: r.totalDemandPeakGw,
            status: r.status,
          })
        }
      }
    }
    exportCsv(flat, 'us-all-sources-balance.csv')
  }

  const tipStyle = {
    background: dark ? '#0f172a' : '#fff',
    border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 8,
    fontSize: 12,
  }

  const sourceLabel =
    source === 'all' ? 'All sources' : sourceMeta(source).label

  return (
    <div className="fbal mapcentric all-src">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">All sources · supply · demand · deficit</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            Multi-source energy balance
          </h2>
          <p className="mapcentric-lede">
            Map production, firm contribution, and demand gaps for gas, coal, nuclear, oil, solar,
            wind, hydro, battery, geothermal, and biomass — not gas alone. Demand stack includes AI
            data centers, population growth, and industrial manufacturing through{' '}
            {SOURCE_YEARS[SOURCE_YEARS.length - 1]}. Sample path (not official IRP / AEO).
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Demand {year}</span>
            <strong>
              {nat.totalDemandPeakGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Firm all sources</span>
            <strong>
              {nat.totalFirmGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>AI · pop · ind</span>
            <strong style={{ fontSize: '0.95rem' }}>
              {nat.aiPeakGw.toFixed(0)}
              <em>/</em>
              {nat.popPeakGw.toFixed(0)}
              <em>/</em>
              {nat.indPeakGw.toFixed(0)}
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Source gap stack</span>
            <strong style={{ color: 'var(--danger)' }}>
              {nat.totalDeficitGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
        </div>
      </header>

      <div className="fbal-controls" style={{ flexWrap: 'wrap' }}>
        <div className="gmap-mode" role="tablist" aria-label="Energy source">
          <button
            type="button"
            className={source === 'all' ? 'is-on' : ''}
            onClick={() => setSource('all')}
          >
            All
          </button>
          {SOURCE_META.map((m) => (
            <button
              key={m.id}
              type="button"
              className={source === m.id ? 'is-on' : ''}
              title={m.note}
              onClick={() => setSource(m.id)}
            >
              {m.short}
            </button>
          ))}
        </div>
        <div className="gmap-mode" role="tablist" aria-label="Map metric">
          {(
            [
              ['deficit', 'Deficit'],
              ['production', 'Production'],
              ['demand', 'Demand'],
              ['surplus', 'Surplus'],
              ['balance', 'Balance'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={metric === id ? 'is-on' : ''}
              onClick={() => setMetric(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="gmap-icon-btn" title="Export CSV" onClick={exportAll}>
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="fbal-summary">
        {source === 'all'
          ? nat.summary
          : `${sourceMeta(source).note} ${year}: prod ${nat.bySource[source].productionGw.toFixed(0)} GW · demand ${nat.bySource[source].demandGw.toFixed(0)} · deficit ${nat.bySource[source].deficitGw.toFixed(0)} · ${nat.bySource[source].statesDeficit} states short.`}
      </p>

      <section className="fbal-timeline demand-charts" aria-label="National multi-source charts">
        <div className="demand-chart-grid">
          <div className="demand-chart-card">
            <p className="kicker">
              {source === 'all'
                ? 'National firm vs demand + drivers (GW)'
                : `${sourceLabel}: production / demand / deficit`}
            </p>
            <div style={{ width: '100%', height: 190 }}>
              <ResponsiveContainer>
                <AreaChart data={prodDemandChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={40} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {source === 'all' ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="Demand"
                        stroke={dark ? '#f472b6' : '#db2777'}
                        fill={dark ? '#f472b6' : '#db2777'}
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Production"
                        stroke={dark ? '#86efac' : '#15803d'}
                        fill={dark ? '#86efac' : '#15803d'}
                        fillOpacity={0.25}
                      />
                      <Area
                        type="monotone"
                        dataKey="AI"
                        stroke={sourceColor('gas', dark)}
                        fill={sourceColor('gas', dark)}
                        fillOpacity={0.35}
                        stackId="drv"
                      />
                      <Area
                        type="monotone"
                        dataKey="Population"
                        stroke={sourceColor('wind', dark)}
                        fill={sourceColor('wind', dark)}
                        fillOpacity={0.35}
                        stackId="drv"
                      />
                      <Area
                        type="monotone"
                        dataKey="Industrial"
                        stroke={sourceColor('nuclear', dark)}
                        fill={sourceColor('nuclear', dark)}
                        fillOpacity={0.35}
                        stackId="drv"
                      />
                    </>
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="Production"
                        stroke={sourceColor(source, dark)}
                        fill={sourceColor(source, dark)}
                        fillOpacity={0.35}
                      />
                      <Area
                        type="monotone"
                        dataKey="Demand"
                        stroke={dark ? '#f472b6' : '#db2777'}
                        fill={dark ? '#f472b6' : '#db2777'}
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Deficit"
                        stroke={dark ? '#fb7185' : '#e11d48'}
                        fill={dark ? '#fb7185' : '#e11d48'}
                        fillOpacity={0.4}
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="demand-chart-card">
            <p className="kicker">
              {source === 'all'
                ? `Deficit by source · ${year} (GW)`
                : 'National deficit stack all sources over time'}
            </p>
            <div style={{ width: '100%', height: 190 }}>
              <ResponsiveContainer>
                {source === 'all' ? (
                  <BarChart data={mixChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--mute)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={36} />
                    <Tooltip contentStyle={tipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Production" fill={dark ? '#64748b' : '#94a3b8'} />
                    <Bar dataKey="Demand" fill={dark ? '#f472b6' : '#db2777'} />
                    <Bar dataKey="Deficit" fill={dark ? '#fb7185' : '#e11d48'} />
                  </BarChart>
                ) : (
                  <AreaChart data={deficitChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={36} />
                    <Tooltip contentStyle={tipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {SOURCE_META.map((m) => (
                      <Area
                        key={m.id}
                        type="monotone"
                        dataKey={m.short}
                        stackId="1"
                        stroke={dark ? m.colorDark : m.color}
                        fill={dark ? m.colorDark : m.color}
                        fillOpacity={0.75}
                      />
                    ))}
                  </AreaChart>
                )}
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
          max={SOURCE_YEARS.length - 1}
          value={SOURCE_YEARS.indexOf(year)}
          onChange={(e) => setYear(SOURCE_YEARS[Number(e.target.value)])}
        />
        <div className="fbal-year-ticks">
          {SOURCE_YEARS.map((y) => (
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
            aria-label={`US ${sourceLabel} ${metric} ${year}`}
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="28" fill="var(--mute)" fontSize="12" fontFamily="var(--font-mono)">
              {year} · {sourceLabel} · {metric} · size = magnitude
            </text>

            <UsBasemap w={W} h={H} />

            {ordered.map((r) => {
              const { x, y } = projectUS(r.lon, r.lat, W, H)
              const val = metricForSource(r, source, metric)
              const abs = Math.abs(val)
              const rad = 5 + Math.sqrt(abs / maxVal) * 30
              let fill =
                source === 'all'
                  ? statusColor(r.status, dark)
                  : sourceColor(source, dark)
              if (metric === 'deficit' && val > 0) {
                fill = dark ? '#fb7185' : '#e11d48'
              } else if (metric === 'surplus' && val > 0) {
                fill = dark ? '#4ade80' : '#16a34a'
              } else if (metric === 'balance') {
                fill = val >= 0 ? (dark ? '#4ade80' : '#16a34a') : dark ? '#fb7185' : '#e11d48'
              }
              const on = r.abbr === selected || r.abbr === hover
              const showLabel = on || abs >= maxVal * 0.4
              return (
                <g
                  key={r.abbr}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover(r.abbr)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(r.abbr)}
                >
                  {metric === 'deficit' && val > 0.5 && (
                    <circle
                      r={rad + 3}
                      fill="none"
                      stroke={dark ? '#fb7185' : '#e11d48'}
                      strokeWidth={1.2}
                      strokeOpacity={0.4}
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
                      {metric === 'balance'
                        ? `${val >= 0 ? '+' : ''}${val.toFixed(val >= 10 || val <= -10 ? 0 : 1)}`
                        : val.toFixed(val >= 10 ? 0 : 1)}
                    </text>
                  )}
                  <title>
                    {r.name} {year}: demand {r.totalDemandPeakGw.toFixed(1)} · firm{' '}
                    {r.totalFirmGw.toFixed(1)} · AI {r.aiPeakGw.toFixed(1)} · status {r.status}
                  </title>
                </g>
              )
            })}

            <g transform={`translate(24, ${H - 48})`}>
              <text fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                {metric === 'deficit'
                  ? 'red = short · size = deficit GW'
                  : `${sourceLabel} · ${metric}`}
              </text>
            </g>
          </svg>
        </div>

        {focus && (
          <aside className="mapcentric-drawer">
            <p className="kicker">
              {year} · {focus.region} · {focus.status}
            </p>
            <h3 className="page-h2" style={{ fontSize: '1.15rem' }}>
              {focus.name}{' '}
              <span className="mono muted" style={{ fontSize: '0.85rem' }}>
                {focus.abbr}
              </span>
            </h3>
            <p className="sub" style={{ fontSize: '0.85rem', marginBottom: '0.65rem' }}>
              {focus.note}
            </p>

            <div className="fbal-meter" aria-hidden>
              <div className="fbal-meter-row">
                <span>AI</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill"
                    style={{
                      width: `${Math.min(100, (focus.aiPeakGw / Math.max(focus.totalDemandPeakGw * 0.4, 1)) * 100)}%`,
                      background: sourceColor('gas', dark),
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
                      width: `${Math.min(100, (focus.popPeakGw / Math.max(focus.totalDemandPeakGw * 0.3, 0.5)) * 100)}%`,
                      background: sourceColor('wind', dark),
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
                      width: `${Math.min(100, (focus.indPeakGw / Math.max(focus.totalDemandPeakGw * 0.3, 0.5)) * 100)}%`,
                      background: sourceColor('nuclear', dark),
                    }}
                  />
                </div>
                <span className="mono">{focus.indPeakGw.toFixed(1)} GW</span>
              </div>
            </div>

            <table className="list-table dense">
              <thead>
                <tr>
                  <th>Source</th>
                  <th className="num">Prod</th>
                  <th className="num">Dem</th>
                  <th className="num">Gap</th>
                </tr>
              </thead>
              <tbody>
                {SOURCE_META.map((m) => {
                  const sl = focus.bySource[m.id]
                  return (
                    <tr
                      key={m.id}
                      className={source === m.id ? 'is-selected' : undefined}
                      onClick={() => setSource(m.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span style={{ color: sourceColor(m.id, dark) }}>{m.short}</span>
                      </td>
                      <td className="num mono">{sl.productionGw.toFixed(1)}</td>
                      <td className="num mono">{sl.demandGw.toFixed(1)}</td>
                      <td
                        className="num mono"
                        style={{
                          color: sl.deficitGw > 0.1 ? 'var(--danger)' : 'var(--ok)',
                        }}
                      >
                        {sl.deficitGw > 0.1
                          ? `-${sl.deficitGw.toFixed(1)}`
                          : `+${sl.surplusGw.toFixed(1)}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <table className="list-table" style={{ marginTop: '0.5rem' }}>
              <tbody>
                <tr>
                  <th scope="row">Total peak demand</th>
                  <td className="mono">{focus.totalDemandPeakGw.toFixed(1)} GW</td>
                </tr>
                <tr>
                  <th scope="row">Total firm</th>
                  <td className="mono">{focus.totalFirmGw.toFixed(1)} GW</td>
                </tr>
                <tr>
                  <th scope="row">System gap</th>
                  <td
                    className="mono"
                    style={{
                      color:
                        focus.totalDemandPeakGw > focus.totalFirmGw
                          ? 'var(--danger)'
                          : 'var(--ok)',
                    }}
                  >
                    {(focus.totalFirmGw - focus.totalDemandPeakGw).toFixed(1)} GW
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

      <section className="fbal-table-wrap" aria-label="Leaders by metric">
        <div className="fbal-table-head">
          <h3 className="page-h2" style={{ fontSize: '1rem' }}>
            Leaders · {sourceLabel} · {metric} · {year}
          </h3>
          <p className="muted mono" style={{ fontSize: '0.8rem' }}>
            {US_STATES.length} jurisdictions
          </p>
        </div>
        <div className="table-scroll">
          <table className="list-table dense">
            <thead>
              <tr>
                <th>#</th>
                <th>State</th>
                <th className="num">AI</th>
                <th className="num">Pop</th>
                <th className="num">Ind</th>
                <th className="num">Demand</th>
                <th className="num">Firm</th>
                <th className="num">{metric}</th>
                <th>Status</th>
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
                  <td className="num mono">{r.aiPeakGw.toFixed(1)}</td>
                  <td className="num mono">{r.popPeakGw.toFixed(1)}</td>
                  <td className="num mono">{r.indPeakGw.toFixed(1)}</td>
                  <td className="num mono">{r.totalDemandPeakGw.toFixed(1)}</td>
                  <td className="num mono">{r.totalFirmGw.toFixed(1)}</td>
                  <td className="num mono">
                    {metricForSource(r, source, metric).toFixed(1)}
                  </td>
                  <td>
                    <span className={`fbal-badge ${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line muted" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
        All-source balance · firm CF by technology · demand allocated by fleet mix + AI / population
        / industrial tilts · coal exit and solar-wind-battery growth paths · educational sample
      </p>
    </div>
  )
}
