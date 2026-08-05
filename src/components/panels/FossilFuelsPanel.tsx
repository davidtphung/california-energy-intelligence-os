import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  COAL_STATE_PRODUCTION,
  FOSSIL_META,
  FOSSIL_SERIES,
  GAS_STATE_PRODUCTION,
  OIL_STATE_PRODUCTION,
  PRODUCT_EXPORT_STREAMS,
  type FossilFuelId,
  fossilByDecade,
  fossilLatest,
  fossilNetExports,
  fossilSeriesNewestFirst,
  fossilSeriesOldestFirst,
  fossilSummaryTable,
  gasExportSplit,
} from '../../data/fossilFuels'
import { LNG_TERMINALS, lngCapacityByStatus } from '../../data/naturalGas'
import { useApp } from '../../context/AppContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'
import { exportCsv, exportJson } from '../../lib/utils'

const FUEL_TABS: { id: FossilFuelId | 'overview'; label: string }[] = [
  { id: 'overview', label: 'All fuels' },
  { id: 'oil', label: 'Crude oil' },
  { id: 'gas', label: 'Natural gas' },
  { id: 'coal', label: 'Coal' },
  { id: 'products', label: 'Products' },
]

export function FossilFuelsPanel() {
  const { theme, openStateDetail, setDrilldown } = useApp()
  const [tab, setTab] = useState<FossilFuelId | 'overview'>('overview')
  const [selectedState, setSelectedState] = useState<string | null>('TX')

  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tipBg = theme === 'dark' ? '#000000' : '#ffffff'
  const cProd = theme === 'dark' ? '#86efac' : '#15803d'
  const cExp = theme === 'dark' ? '#38bdf8' : '#0369a1'
  const cCap = theme === 'dark' ? '#fbbf24' : '#b45309'
  const cImp = theme === 'dark' ? '#a8a29e' : '#78716c'

  const summary = useMemo(() => fossilSummaryTable(), [])
  const gasSplit = useMemo(() => gasExportSplit(), [])
  const lngCap = useMemo(() => lngCapacityByStatus(), [])

  const activeMeta = tab === 'overview' ? null : FOSSIL_META.find((m) => m.id === tab)!

  const longChart = useMemo(() => {
    if (tab === 'overview') return []
    // decade averages for long history readability
    return fossilByDecade(tab).map((r) => ({
      year: String(r.year),
      production: r.production,
      capacity: r.capacity,
      exports: r.exports,
      imports: r.imports,
      consumption: r.consumption,
      net: +(r.exports - r.imports).toFixed(3),
    }))
  }, [tab])

  const recentChart = useMemo(() => {
    if (tab === 'overview') return []
    return fossilSeriesOldestFirst(tab)
      .filter((r) => r.year >= 1970)
      .map((r) => ({
        year: String(r.year),
        production: r.production,
        capacity: r.capacity,
        exports: r.exports,
        imports: r.imports,
        consumption: r.consumption,
        net: +(r.exports - r.imports).toFixed(3),
      }))
  }, [tab])

  const tableRows = useMemo(() => {
    if (tab === 'overview') return []
    return fossilSeriesNewestFirst(tab)
  }, [tab])

  const stateRows = useMemo(() => {
    if (tab === 'oil') return OIL_STATE_PRODUCTION
    if (tab === 'gas') return GAS_STATE_PRODUCTION
    if (tab === 'coal') return COAL_STATE_PRODUCTION
    return []
  }, [tab])

  const focusState = stateRows.find((s) => s.abbr === selectedState) ?? stateRows[0]

  const overviewCompare = useMemo(() => {
    return fossilByDecade('oil')
      .filter((r) => r.year >= 1900)
      .map((r) => {
        const g = fossilByDecade('gas').find((x) => x.year === r.year)
        const c = fossilByDecade('coal').find((x) => x.year === r.year)
        return {
          year: String(r.year),
          oil: r.production,
          gas: g?.production ?? 0,
          coal: c?.production ?? 0,
        }
      })
  }, [])

  return (
    <div id="fossil" className="fadein t1">
      <div className="intro">
        <strong>Hydrocarbons and fossil fuels · full history</strong>
        <p>
          Production, capacity, and trade for crude oil (from 1859), natural gas (from 1900), coal
          (from 1800), and petroleum products (from 1920). Series are EIA / historical-scale samples
          for planning - newest first in tables. Not a substitute for EIA Open Data.
        </p>
      </div>

      <div className="state-chip-row" style={{ marginBottom: '1rem' }}>
        {FUEL_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`state-chip${tab === t.id ? ' is-on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="metric-strip">
            {summary.map((s) => (
              <button
                key={s.id}
                type="button"
                className="metric"
                onClick={() => setTab(s.id)}
                style={{ cursor: 'pointer' }}
              >
                <span className="metric-label">
                  {s.short} · {s.latestYear}
                </span>
                <span className="metric-value" style={{ fontSize: '1.05rem' }}>
                  {s.production >= 100 ? s.production.toFixed(0) : s.production.toFixed(1)}
                  <span className="metric-unit">{s.unitProd}</span>
                </span>
                <span className="metric-hint">
                  exp {s.exports >= 100 ? s.exports.toFixed(0) : s.exports.toFixed(1)} · since{' '}
                  {s.firstYear}
                </span>
              </button>
            ))}
          </div>

          <section className="block">
            <p className="kicker">Long history</p>
            <h2 className="page-h2">Production by decade (indexed comparison)</h2>
            <p className="sub">
              Oil Mbbl/d · gas Bcf/d · coal MMst/yr - different units; shapes show relative rise and
              fall from 1900s onward.
            </p>
            <div className="chart-box chart-box-legend" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={overviewCompare} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="oil" name="Oil Mbbl/d" stroke={cCap} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gas" name="Gas Bcf/d" stroke={cProd} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="coal" name="Coal MMst/yr" stroke={cImp} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="block">
            <p className="kicker">Latest snapshot</p>
            <h2 className="page-h2">Production · capacity · exports · net trade</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fuel</th>
                    <th>Since</th>
                    <th style={{ textAlign: 'right' }}>Production</th>
                    <th style={{ textAlign: 'right' }}>Capacity</th>
                    <th style={{ textAlign: 'right' }}>Exports</th>
                    <th style={{ textAlign: 'right' }}>Imports</th>
                    <th style={{ textAlign: 'right' }}>Net exp</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setTab(s.id)}>
                      <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{s.label}</td>
                      <td className="mono">{s.firstYear}</td>
                      <td className="num">{s.production.toFixed(s.production >= 100 ? 0 : 1)}</td>
                      <td className="num">{s.capacity.toFixed(s.capacity >= 100 ? 0 : 1)}</td>
                      <td className="num">{s.exports.toFixed(s.exports >= 100 ? 0 : 1)}</td>
                      <td className="num">{s.imports.toFixed(s.imports >= 100 ? 0 : 1)}</td>
                      <td className="num">
                        {s.netExports >= 0 ? '+' : ''}
                        {s.netExports.toFixed(s.netExports >= 100 ? 0 : 1)}
                      </td>
                      <td className="muted">{s.unitProd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="btn-row">
            <Button
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                const rows: Record<string, unknown>[] = []
                for (const m of FOSSIL_META) {
                  for (const r of fossilSeriesNewestFirst(m.id)) {
                    rows.push({
                      fuel: m.id,
                      year: r.year,
                      production: r.production,
                      capacity: r.capacity,
                      exports: r.exports,
                      imports: r.imports,
                      consumption: r.consumption,
                      net_exports: r.exports - r.imports,
                      unit: m.unitProd,
                    })
                  }
                }
                exportCsv(rows, 'us-fossil-fuels-history.csv')
              }}
            >
              Full history CSV
            </Button>
            <Button
              size="sm"
              onClick={() =>
                exportJson(
                  {
                    meta: FOSSIL_META,
                    series: FOSSIL_SERIES,
                    oilStates: OIL_STATE_PRODUCTION,
                    gasStates: GAS_STATE_PRODUCTION,
                    coalStates: COAL_STATE_PRODUCTION,
                    productStreams: PRODUCT_EXPORT_STREAMS,
                  },
                  'us-fossil-fuels.json'
                )
              }
            >
              JSON
            </Button>
          </div>
        </>
      )}

      {tab !== 'overview' && activeMeta && (
        <>
          <div className="metric-strip">
            {(() => {
              const L = fossilLatest(tab)
              const net = fossilNetExports(L)
              return (
                <>
                  <div className="metric" style={{ cursor: 'default' }}>
                    <span className="metric-label">Production · {L.year}</span>
                    <span className="metric-value" style={{ fontSize: '1.1rem' }}>
                      {L.production >= 100 ? L.production.toFixed(0) : L.production.toFixed(1)}
                      <span className="metric-unit">{activeMeta.unitProd}</span>
                    </span>
                    <span className="metric-hint">since {activeMeta.startYear}</span>
                  </div>
                  <div className="metric" style={{ cursor: 'default' }}>
                    <span className="metric-label">Capacity</span>
                    <span className="metric-value" style={{ fontSize: '1.1rem' }}>
                      {L.capacity >= 100 ? L.capacity.toFixed(0) : L.capacity.toFixed(1)}
                      <span className="metric-unit">{activeMeta.unitCap}</span>
                    </span>
                    <span className="metric-hint">operable / productive</span>
                  </div>
                  <div className="metric" style={{ cursor: 'default' }}>
                    <span className="metric-label">Exports</span>
                    <span className="metric-value" style={{ fontSize: '1.1rem' }}>
                      {L.exports >= 100 ? L.exports.toFixed(0) : L.exports.toFixed(1)}
                      <span className="metric-unit">{activeMeta.unitExport}</span>
                    </span>
                    <span className="metric-hint">
                      imports {L.imports >= 100 ? L.imports.toFixed(0) : L.imports.toFixed(1)}
                    </span>
                  </div>
                  <div className="metric" style={{ cursor: 'default' }}>
                    <span className="metric-label">Net exports</span>
                    <span className="metric-value" style={{ fontSize: '1.1rem' }}>
                      {net >= 0 ? '+' : ''}
                      {net >= 100 ? net.toFixed(0) : net.toFixed(1)}
                      <span className="metric-unit">{activeMeta.unitExport}</span>
                    </span>
                    <span className="metric-hint">use {L.consumption.toFixed(L.consumption >= 100 ? 0 : 1)}</span>
                  </div>
                </>
              )
            })()}
          </div>
          <p className="sub" style={{ maxWidth: 'none' }}>
            {activeMeta.note}
          </p>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            <section className="block">
              <p className="kicker">Full history · decade averages</p>
              <h2 className="page-h2">
                {activeMeta.label} from {activeMeta.startYear}
              </h2>
              <div className="chart-box chart-box-legend" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={longChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }} />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line type="monotone" dataKey="production" name="Production" stroke={cProd} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="capacity" name="Capacity" stroke={cCap} strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="exports" name="Exports" stroke={cExp} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="block">
              <p className="kicker">Modern era · annual</p>
              <h2 className="page-h2">1970 to present</h2>
              <div className="chart-box chart-box-legend" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={recentChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }} />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="production" name="Production" stroke={cProd} fill={cProd} fillOpacity={0.25} />
                    <Area type="monotone" dataKey="exports" name="Exports" stroke={cExp} fill={cExp} fillOpacity={0.35} />
                    <Line type="monotone" dataKey="imports" name="Imports" stroke={cImp} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="block">
            <p className="kicker">Net trade</p>
            <h2 className="page-h2">Exports minus imports</h2>
            <div className="chart-box" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={recentChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                  <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }} />
                  <Bar dataKey="net" name="Net exports" radius={[2, 2, 0, 0]}>
                    {recentChart.map((r) => (
                      <Cell key={r.year} fill={r.net >= 0 ? cProd : '#9f1239'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {tab === 'gas' && (
            <section className="block">
              <p className="kicker">Gas export split</p>
              <h2 className="page-h2">LNG vs pipeline exports</h2>
              <div className="chart-box chart-box-legend" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={gasSplit
                      .filter((g) => g.year >= 1970)
                      .map((g) => ({ ...g, year: String(g.year) }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                    <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={40} unit=" Bcf/d" />
                    <Tooltip contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }} />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="lng" name="LNG" stackId="1" stroke={cExp} fill={cExp} fillOpacity={0.5} />
                    <Area type="monotone" dataKey="pipeline" name="Pipeline" stackId="1" stroke={cCap} fill={cCap} fillOpacity={0.45} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="sub">
                LNG terminal capacity sample: operating {lngCap.operating.toFixed(1)} Bcf/d · under
                construction {lngCap.construction.toFixed(1)} · proposed {lngCap.proposed.toFixed(1)}.
              </p>
            </section>
          )}

          {tab === 'products' && (
            <section className="block">
              <p className="kicker">Product streams</p>
              <h2 className="page-h2">Export mix (latest sample)</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Stream</th>
                      <th style={{ textAlign: 'right' }}>Mbbl/d</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRODUCT_EXPORT_STREAMS.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{s.label}</td>
                        <td className="num">{s.mbbld.toFixed(2)}</td>
                        <td className="muted">{s.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {stateRows.length > 0 && (
            <div className="grid-2" style={{ alignItems: 'start' }}>
              <section className="block">
                <p className="kicker">By state</p>
                <h2 className="page-h2">Top producers (latest)</h2>
                <div className="chart-box" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={stateRows.map((s) => ({
                        abbr: s.abbr,
                        production: s.production,
                        fill: s.abbr === selectedState ? cProd : cExp,
                      }))}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                      <XAxis type="number" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="abbr" width={36} tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }} />
                      <Bar
                        dataKey="production"
                        radius={[0, 2, 2, 0]}
                        cursor="pointer"
                        onClick={(d) => {
                          const abbr = (d as { abbr?: string })?.abbr
                          if (abbr) {
                            setSelectedState(abbr)
                            setDrilldown(`fossil:${tab}:${abbr}`)
                          }
                        }}
                      >
                        {stateRows.map((s) => (
                          <Cell key={s.abbr} fill={s.abbr === selectedState ? cProd : cExp} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="block">
                <p className="kicker">State</p>
                {focusState ? (
                  <>
                    <h2 className="page-h2">
                      {focusState.name}{' '}
                      <span className="mono muted" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {focusState.abbr}
                      </span>
                    </h2>
                    <table className="list-table">
                      <tbody>
                        <tr>
                          <th scope="row">Production</th>
                          <td className="mono" style={{ color: 'var(--highlight)' }}>
                            {focusState.production.toLocaleString()} {activeMeta.unitProd}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row">US share</th>
                          <td className="mono">{focusState.sharePct}%</td>
                        </tr>
                        <tr>
                          <th scope="row">YoY</th>
                          <td className="mono">
                            {focusState.yoyPct >= 0 ? '+' : ''}
                            {focusState.yoyPct}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="sub" style={{ marginTop: 10, maxWidth: 'none' }}>
                      {focusState.note}
                    </p>
                    <Button size="sm" style={{ marginTop: 8 }} onClick={() => openStateDetail(focusState.abbr)}>
                      Open {focusState.abbr} page
                    </Button>
                  </>
                ) : (
                  <p className="sub">No state breakdown for this fuel.</p>
                )}
              </section>
            </div>
          )}

          {tab === 'gas' && (
            <section className="block">
              <p className="kicker">LNG terminals</p>
              <h2 className="page-h2">Export capacity</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Terminal</th>
                      <th>State</th>
                      <th style={{ textAlign: 'right' }}>Bcf/d</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...LNG_TERMINALS]
                      .sort((a, b) => b.capacityBcfd - a.capacityBcfd)
                      .map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{t.name}</td>
                          <td className="mono">{t.stateAbbr}</td>
                          <td className="num">{t.capacityBcfd.toFixed(1)}</td>
                          <td>
                            <Badge
                              variant={
                                t.status === 'operating'
                                  ? 'success'
                                  : t.status === 'under-construction'
                                    ? 'warning'
                                    : 'default'
                              }
                            >
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="block">
            <div className="block-head">
              <div>
                <p className="kicker">Annual history</p>
                <h2 className="page-h2">Every year · latest first</h2>
              </div>
              <Button
                size="sm"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={() =>
                  exportCsv(
                    tableRows.map((r) => ({
                      year: r.year,
                      production: r.production,
                      capacity: r.capacity,
                      exports: r.exports,
                      imports: r.imports,
                      consumption: r.consumption,
                      net_exports: r.exports - r.imports,
                    })),
                    `us-${tab}-history.csv`
                  )
                }
              >
                CSV
              </Button>
            </div>
            <div className="table-wrap" style={{ maxHeight: '28rem', overflow: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th style={{ textAlign: 'right' }}>Production</th>
                    <th style={{ textAlign: 'right' }}>Capacity</th>
                    <th style={{ textAlign: 'right' }}>Exports</th>
                    <th style={{ textAlign: 'right' }}>Imports</th>
                    <th style={{ textAlign: 'right' }}>Use</th>
                    <th style={{ textAlign: 'right' }}>Net exp</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => {
                    const net = r.exports - r.imports
                    return (
                      <tr key={r.year}>
                        <td className="mono" style={{ fontWeight: 600 }}>
                          {r.year}
                        </td>
                        <td className="num">{r.production.toFixed(r.production >= 100 ? 1 : 2)}</td>
                        <td className="num">{r.capacity.toFixed(r.capacity >= 100 ? 1 : 2)}</td>
                        <td className="num">{r.exports.toFixed(r.exports >= 100 ? 1 : 2)}</td>
                        <td className="num">{r.imports.toFixed(r.imports >= 100 ? 1 : 2)}</td>
                        <td className="num">{r.consumption.toFixed(r.consumption >= 100 ? 1 : 2)}</td>
                        <td className="num">
                          {net >= 0 ? '+' : ''}
                          {net.toFixed(net >= 100 ? 1 : 2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
              Units: {activeMeta.unitProd} (production / use) · {activeMeta.unitCap} (capacity) ·{' '}
              {activeMeta.unitExport} (trade). {tableRows.length} annual rows from{' '}
              {activeMeta.startYear}–{tableRows[0]?.year}.
            </p>
          </section>
        </>
      )}

      <p className="footer-line">
        Fossil / hydrocarbons · oil · gas · coal · products · full historical samples · pair with
        Policy and electricity gas fleet
      </p>
    </div>
  )
}
