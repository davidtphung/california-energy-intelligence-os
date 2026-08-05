import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useLiveGrid } from '../../hooks/useLiveGrid'
import { cleanShareFromFuel } from '../../data/liveSources'
import { useApp } from '../../context/AppContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { RefreshCw } from 'lucide-react'

function fmtMw(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '-'
  return `${Math.round(n).toLocaleString()} MW`
}

function fmtGw(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '-'
  return `${(n / 1000).toFixed(2)} GW`
}

export function LiveGridPanel() {
  const { data, loading, error, refresh } = useLiveGrid(true)
  const { theme } = useApp()
  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tipBg = theme === 'dark' ? '#000000' : '#ffffff'

  const caiso = data?.caiso
  const fuel = caiso?.fuel
  const clean = fuel ? cleanShareFromFuel(fuel) : null

  const demandSeries = useMemo(() => {
    if (!caiso?.series.demand?.length) return []
    // Show points that have any demand signal; keep chart readable
    return caiso.series.demand
      .filter((d) => d.current != null || d.hourAhead != null || d.dayAhead != null)
      .map((d) => ({
        time: d.time,
        current: d.current,
        hourAhead: d.hourAhead,
        dayAhead: d.dayAhead,
      }))
  }, [caiso])

  const fuelSeries = useMemo(() => {
    if (!caiso?.series.fuel?.length) return []
    // Downsample if dense
    const s = caiso.series.fuel
    const step = s.length > 120 ? 2 : 1
    return s.filter((_, i) => i % step === 0)
  }, [caiso])

  const okCount = data?.sources.filter((s) => s.status === 'ok').length ?? 0
  const errCount = data?.sources.filter((s) => s.status === 'error').length ?? 0

  return (
    <div className="live-panel fadein t2">
      <div className="block-head">
        <div>
          <p className="kicker">Live · California ISO</p>
          <h2 className="page-h2">Today&apos;s grid</h2>
          <p className="sub" style={{ marginBottom: 0 }}>
            Real data from CAISO Today&apos;s Outlook CSVs
            {caiso?.asOf ? ` · as of ${caiso.asOf}` : ''}
            {caiso?.produced ? ` · produced ${caiso.produced}` : ''}. Refreshes every 60s.
          </p>
        </div>
        <div className="btn-row">
          <Badge variant={errCount && !caiso ? 'danger' : okCount ? 'success' : 'warning'}>
            {loading ? 'refreshing' : caiso ? 'live' : 'offline'}
          </Badge>
          <Button size="sm" onClick={() => void refresh()} disabled={loading} icon={<RefreshCw className={`h-3.5 w-3.5${loading ? ' spin' : ''}`} />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <p className="mono" style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>
          {error}
        </p>
      )}

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Current demand</span>
          <span className="metric-value">
            {caiso?.currentDemandMw != null ? (caiso.currentDemandMw / 1000).toFixed(2) : '-'}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">{fmtMw(caiso?.currentDemandMw)}</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Today&apos;s peak</span>
          <span className="metric-value">
            {caiso?.todaysPeakMw != null ? (caiso.todaysPeakMw / 1000).toFixed(2) : '-'}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">{fmtMw(caiso?.todaysPeakMw)}</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Clean share*</span>
          <span className="metric-value">
            {clean != null ? clean.toFixed(1) : '-'}
            <span className="metric-unit">%</span>
          </span>
          <span className="metric-hint">ex-batteries / ambiguous imports</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">CO₂ rate</span>
          <span className="metric-value">
            {caiso?.co2 ? Math.round(caiso.co2.total).toLocaleString() : '-'}
            <span className="metric-unit">t/h</span>
          </span>
          <span className="metric-hint">{caiso?.co2?.time ? `at ${caiso.co2.time}` : 'CAISO co2.csv'}</span>
        </div>
      </div>

      {fuel && (
        <table className="list-table" style={{ marginBottom: '1.1rem' }}>
          <tbody>
            {(
              [
                ['Natural gas', fuel.naturalGas, false],
                ['Coal', fuel.coal, false],
                ['Nuclear', fuel.nuclear, true],
                ['Large hydro', fuel.largeHydro, true],
                ['Small hydro', fuel.smallHydro, true],
                ['Geothermal', fuel.geothermal, true],
                ['Biomass', fuel.biomass, true],
                ['Biogas', fuel.biogas, true],
                ['Wind', fuel.wind, true],
                ['Solar', fuel.solar, true],
                ['Batteries', fuel.batteries, true],
                ['Imports', fuel.imports, false],
                ['Other', fuel.other, false],
              ] as const
            ).map(([label, mw, highlight]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td className="mono" style={highlight ? { color: 'var(--highlight)' } : undefined}>
                  {fmtMw(mw)}
                  {label === 'Batteries' && (
                    <span className="muted">
                      {' '}
                      (
                      {mw < 0 ? 'charging' : mw > 0 ? 'discharging' : 'flat'}
                      )
                    </span>
                  )}
                  <span className="muted" style={{ marginLeft: 8 }}>
                    {fmtGw(Math.abs(mw))}
                  </span>
                </td>
              </tr>
            ))}
            {caiso?.storage && (
              <tr>
                <th scope="row">Storage telemetry</th>
                <td className="mono">
                  total {fmtMw(caiso.storage.total)} · stand-alone {fmtMw(caiso.storage.standalone)} ·
                  hybrid {fmtMw(caiso.storage.hybrid)}
                </td>
              </tr>
            )}
            {data?.weather && (
              <tr>
                <th scope="row">Weather (Open-Meteo)</th>
                <td>
                  {data.weather.tempC.toFixed(1)}°C · wind {data.weather.windKmh.toFixed(1)} km/h ·
                  solar {data.weather.solarWm2.toFixed(0)} W/m² · {data.weather.location}
                </td>
              </tr>
            )}
            {caiso?.tomorrowPeakMw != null && (
              <tr>
                <th scope="row">Tomorrow peak (f)</th>
                <td className="mono">{fmtMw(caiso.tomorrowPeakMw)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div className="grid-2">
        <section className="block">
          <p className="kicker">Demand</p>
          <h3 className="page-h2">Load · day / hour ahead</h3>
          <div className="chart-box chart-box-legend" style={{ height: 280 }}>
            {demandSeries.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={demandSeries} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: tick, fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: tick, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}`}
                    unit=" GW"
                  />
                  <Tooltip
                    contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }}
                    formatter={(v) => [`${Number(v).toLocaleString()} MW`, '']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="plainline"
                    iconSize={12}
                    wrapperStyle={{ fontSize: 11, paddingTop: 10, width: '100%' }}
                  />
                  <Line type="monotone" dataKey="current" name="Current" stroke="var(--highlight)" strokeWidth={1.75} dot={false} connectNulls />
                  <Line type="monotone" dataKey="hourAhead" name="Hour ahead" stroke="#0369a1" strokeWidth={1.25} dot={false} connectNulls />
                  <Line type="monotone" dataKey="dayAhead" name="Day ahead" stroke="#b45309" strokeWidth={1.25} dot={false} strokeDasharray="4 3" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted">{loading ? 'Loading demand…' : 'No demand series yet.'}</p>
            )}
          </div>
        </section>

        <section className="block">
          <p className="kicker">Supply</p>
          <h3 className="page-h2">All fuels · today</h3>
          <div className="chart-box chart-box-legend" style={{ height: 340 }}>
            {fuelSeries.length ? (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={fuelSeries} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: tick, fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: tick, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}`}
                  />
                  <Tooltip
                    contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }}
                    formatter={(v) => [`${Number(v).toLocaleString()} MW`, '']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 10, width: '100%', lineHeight: '1.6' }}
                  />
                  <Area type="monotone" dataKey="coal" name="Coal" stackId="1" stroke="#44403c" fill="#44403c" fillOpacity={0.55} />
                  <Area type="monotone" dataKey="gas" name="Gas" stackId="1" stroke="#78716c" fill="#78716c" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="nuclear" name="Nuclear" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.45} />
                  <Area type="monotone" dataKey="hydro" name="Hydro" stackId="1" stroke="#0e7490" fill="#0e7490" fillOpacity={0.45} />
                  <Area type="monotone" dataKey="geothermal" name="Geothermal" stackId="1" stroke="#c2410c" fill="#c2410c" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="biomass" name="Biomass" stackId="1" stroke="#65a30d" fill="#65a30d" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="biogas" name="Biogas" stackId="1" stroke="#4d7c0f" fill="#4d7c0f" fillOpacity={0.35} />
                  <Area type="monotone" dataKey="wind" name="Wind" stackId="1" stroke="#0369a1" fill="#0369a1" fillOpacity={0.5} />
                  <Area type="monotone" dataKey="solar" name="Solar" stackId="1" stroke="#b45309" fill="#b45309" fillOpacity={0.55} />
                  <Area type="monotone" dataKey="batteries" name="Batteries" stackId="1" stroke="#15803d" fill="#15803d" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="imports" name="Imports" stackId="1" stroke="#a8a29e" fill="#a8a29e" fillOpacity={0.35} />
                  <Area type="monotone" dataKey="other" name="Other" stackId="1" stroke="#57534e" fill="#57534e" fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted">{loading ? 'Loading fuel mix…' : 'No fuel series yet.'}</p>
            )}
          </div>
        </section>
      </div>

      <section className="block" style={{ marginTop: '0.5rem' }}>
        <p className="kicker">Sources</p>
        <h3 className="page-h2">All feeds</h3>
        <p className="sub">
          Live pulls + catalog of research/API sources. EIA requires{' '}
          <code className="mono">VITE_EIA_API_KEY</code>. OASIS market zip API is listed for backend
          wiring.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Org</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {(data?.sources ?? []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>
                      {s.name}
                    </a>
                  </td>
                  <td className="muted">{s.organization}</td>
                  <td>
                    <Badge
                      variant={
                        s.status === 'ok'
                          ? 'success'
                          : s.status === 'error'
                            ? 'danger'
                            : s.status === 'skipped'
                              ? 'default'
                              : 'warning'
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="mono muted">{s.latencyMs != null ? `${s.latencyMs} ms` : '-'}</td>
                  <td className="muted" style={{ fontSize: '0.82rem' }}>
                    {s.message ?? (s.records != null ? `${s.records} rows` : '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footer-line" style={{ marginTop: '1rem' }}>
          Data © California ISO Today&apos;s Outlook · weather © Open-Meteo · sample pathway charts remain
          scenario-scale below.
        </p>
      </section>
    </div>
  )
}
