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
  GAS_EXPORT_ROUTES,
  GAS_REF_YEAR,
  GAS_STATE_PRODUCTION,
  LNG_TERMINALS,
  gasAnnualNewestFirst,
  gasAnnualOldestFirst,
  gasTotals,
  lngCapacityByStatus,
  topGasProducers,
} from '../../data/naturalGas'
import { useApp } from '../../context/AppContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'
import { exportCsv, exportJson } from '../../lib/utils'

export function NaturalGasPanel() {
  const { theme, openStateDetail, setDrilldown } = useApp()
  const [selectedState, setSelectedState] = useState<string | null>('TX')

  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tipBg = theme === 'dark' ? '#000000' : '#ffffff'
  const prodColor = theme === 'dark' ? '#86efac' : '#15803d'
  const lngColor = theme === 'dark' ? '#38bdf8' : '#0369a1'
  const pipeColor = theme === 'dark' ? '#fbbf24' : '#b45309'
  const consColor = theme === 'dark' ? '#a8a29e' : '#78716c'

  const latest = useMemo(() => gasTotals(GAS_REF_YEAR), [])
  const seriesAsc = useMemo(() => gasAnnualOldestFirst(), [])
  const seriesDesc = useMemo(() => gasAnnualNewestFirst(), [])
  const producers = useMemo(() => topGasProducers(15), [])
  const lngCap = useMemo(() => lngCapacityByStatus(), [])

  const tradeChart = useMemo(
    () =>
      seriesAsc.map((y) => ({
        year: String(y.year),
        production: y.productionBcfd,
        consumption: y.consumptionBcfd,
        lngExports: y.lngExportBcfd,
        pipeExports: y.pipelineExportBcfd,
        imports: y.importsBcfd,
        totalExports: +(y.lngExportBcfd + y.pipelineExportBcfd).toFixed(2),
        netExports: +(y.lngExportBcfd + y.pipelineExportBcfd - y.importsBcfd).toFixed(2),
      })),
    [seriesAsc]
  )

  const stateBars = useMemo(
    () =>
      producers.map((s) => ({
        abbr: s.abbr,
        name: s.name,
        bcf: s.productionBcf,
        share: s.sharePct,
        yoy: s.yoyPct,
        fill: s.abbr === selectedState ? prodColor : theme === 'dark' ? '#4ade80' : '#166534',
      })),
    [producers, selectedState, prodColor, theme]
  )

  const routeBars = useMemo(
    () =>
      [...GAS_EXPORT_ROUTES]
        .sort((a, b) => b.bcfd - a.bcfd)
        .map((r) => ({
          label: r.label.replace(' to ', '\n'),
          short: r.label,
          bcfd: r.bcfd,
          kind: r.kind,
          fill: r.kind === 'lng' ? lngColor : pipeColor,
        })),
    [lngColor, pipeColor]
  )

  const focus = GAS_STATE_PRODUCTION.find((s) => s.abbr === selectedState) ?? producers[0]

  return (
    <div id="gas" className="fadein t1">
      <div className="intro">
        <strong>Natural gas · production and exports</strong>
        <p>
          Track US dry gas production, domestic use, pipeline exports (Mexico / Canada), and LNG
          cargoes. Figures are EIA-scale annual samples for planning UX - wire to EIA Natural Gas
          Monthly for live series.
        </p>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Dry production · {latest.year}</span>
          <span className="metric-value">
            {latest.productionBcfd.toFixed(1)}
            <span className="metric-unit">Bcf/d</span>
          </span>
          <span className="metric-hint">
            ~{(latest.productionBcfYr / 1000).toFixed(1)} Tcf/yr
          </span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Total exports</span>
          <span className="metric-value">
            {latest.totalExportsBcfd.toFixed(1)}
            <span className="metric-unit">Bcf/d</span>
          </span>
          <span className="metric-hint">
            LNG {latest.lngExportBcfd.toFixed(1)} · pipe {latest.pipelineExportBcfd.toFixed(1)}
          </span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Net exports</span>
          <span className="metric-value">
            {latest.netExportsBcfd.toFixed(1)}
            <span className="metric-unit">Bcf/d</span>
          </span>
          <span className="metric-hint">exports minus imports {latest.importsBcfd.toFixed(1)}</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Consumption</span>
          <span className="metric-value">
            {latest.consumptionBcfd.toFixed(1)}
            <span className="metric-unit">Bcf/d</span>
          </span>
          <span className="metric-hint">storage ~{latest.storageTcf} Tcf working gas</span>
        </div>
      </div>

      {latest.note && (
        <p className="sub" style={{ maxWidth: 'none' }}>
          {latest.year}: {latest.note}
        </p>
      )}

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <Button
          size="sm"
          icon={<Download className="h-3.5 w-3.5" />}
          onClick={() =>
            exportCsv(
              seriesDesc.map((y) => ({
                year: y.year,
                production_bcfd: y.productionBcfd,
                consumption_bcfd: y.consumptionBcfd,
                lng_export_bcfd: y.lngExportBcfd,
                pipeline_export_bcfd: y.pipelineExportBcfd,
                total_export_bcfd: y.lngExportBcfd + y.pipelineExportBcfd,
                imports_bcfd: y.importsBcfd,
                net_export_bcfd: y.lngExportBcfd + y.pipelineExportBcfd - y.importsBcfd,
                storage_tcf: y.storageTcf,
              })),
              'us-natural-gas-annual.csv'
            )
          }
        >
          Annual CSV
        </Button>
        <Button
          size="sm"
          onClick={() =>
            exportCsv(
              GAS_STATE_PRODUCTION.map((s) => ({
                state: s.abbr,
                name: s.name,
                production_bcf_yr: s.productionBcf,
                share_pct: s.sharePct,
                yoy_pct: s.yoyPct,
                region: s.region,
              })),
              'us-gas-production-by-state.csv'
            )
          }
        >
          State CSV
        </Button>
        <Button
          size="sm"
          onClick={() =>
            exportJson(
              {
                refYear: GAS_REF_YEAR,
                annual: seriesDesc,
                states: GAS_STATE_PRODUCTION,
                routes: GAS_EXPORT_ROUTES,
                lngTerminals: LNG_TERMINALS,
              },
              'us-natural-gas.json'
            )
          }
        >
          JSON
        </Button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">National · Bcf/d</p>
          <h2 className="page-h2">Production vs consumption</h2>
          <p className="sub">Annual average dry production and total US consumption.</p>
          <div className="chart-box chart-box-legend" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tradeChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: tick, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit=" Bcf/d"
                />
                <Tooltip
                  contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toFixed(1)} Bcf/d`, '']}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="production" name="Production" stroke={prodColor} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="consumption" name="Consumption" stroke={consColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="block">
          <p className="kicker">National · Bcf/d</p>
          <h2 className="page-h2">Exports: LNG and pipeline</h2>
          <p className="sub">Gross exports by path; imports shown for net context.</p>
          <div className="chart-box chart-box-legend" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tradeChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: tick, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit=" Bcf/d"
                />
                <Tooltip
                  contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toFixed(1)} Bcf/d`, '']}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="lngExports" name="LNG exports" stackId="1" stroke={lngColor} fill={lngColor} fillOpacity={0.55} />
                <Area type="monotone" dataKey="pipeExports" name="Pipeline exports" stackId="1" stroke={pipeColor} fill={pipeColor} fillOpacity={0.45} />
                <Line type="monotone" dataKey="imports" name="Imports" stroke={consColor} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="block">
        <p className="kicker">Balance</p>
        <h2 className="page-h2">Net exports over time</h2>
        <p className="sub">Total exports (LNG + pipeline) minus imports - US as net gas exporter.</p>
        <div className="chart-box" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tradeChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={40} unit=" Bcf/d" />
              <Tooltip
                contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }}
                formatter={(v) => [`${Number(v).toFixed(1)} Bcf/d`, 'Net exports']}
              />
              <Bar dataKey="netExports" name="Net exports" radius={[2, 2, 0, 0]}>
                {tradeChart.map((r) => (
                  <Cell key={r.year} fill={r.netExports >= 0 ? prodColor : '#9f1239'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <hr className="rule" />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">Production by state · {GAS_REF_YEAR}</p>
          <h2 className="page-h2">Top dry gas producers</h2>
          <p className="sub">Bcf per year. Click a bar for state note and energy page.</p>
          <div className="chart-box" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={stateBars}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} unit=" Bcf" />
                <YAxis
                  type="category"
                  dataKey="abbr"
                  width={36}
                  tick={{ fill: tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }}
                  formatter={(v, _n, item) => {
                    const p = item?.payload as { share?: number; name?: string }
                    return [`${Number(v).toLocaleString()} Bcf/yr (${p?.share?.toFixed(1)}%)`, p?.name ?? '']
                  }}
                />
                <Bar
                  dataKey="bcf"
                  radius={[0, 2, 2, 0]}
                  cursor="pointer"
                  onClick={(d) => {
                    const abbr = (d as { abbr?: string })?.abbr
                    if (abbr) {
                      setSelectedState(abbr)
                      setDrilldown(`gas:${abbr}`)
                    }
                  }}
                >
                  {stateBars.map((s) => (
                    <Cell key={s.abbr} fill={s.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="block">
          <p className="kicker">State detail</p>
          {focus ? (
            <>
              <h2 className="page-h2">
                {focus.name}{' '}
                <span className="mono muted" style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {focus.abbr}
                </span>
              </h2>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Production</th>
                    <td className="mono" style={{ color: 'var(--highlight)' }}>
                      {focus.productionBcf.toLocaleString()} Bcf/yr
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">US share</th>
                    <td className="mono">{focus.sharePct}%</td>
                  </tr>
                  <tr>
                    <th scope="row">YoY change</th>
                    <td className="mono">
                      {focus.yoyPct >= 0 ? '+' : ''}
                      {focus.yoyPct}%
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Region</th>
                    <td>{focus.region}</td>
                  </tr>
                </tbody>
              </table>
              <p className="sub" style={{ marginTop: 10, maxWidth: 'none' }}>
                {focus.note}
              </p>
              {focus.abbr !== 'other' && (
                <Button
                  size="sm"
                  style={{ marginTop: 8 }}
                  onClick={() => openStateDetail(focus.abbr)}
                >
                  Open {focus.abbr} energy page
                </Button>
              )}
            </>
          ) : (
            <p className="sub">Select a producer state.</p>
          )}

          <p className="kicker" style={{ marginTop: '1.25rem' }}>
            Annual table · newest first
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th style={{ textAlign: 'right' }}>Prod</th>
                  <th style={{ textAlign: 'right' }}>Use</th>
                  <th style={{ textAlign: 'right' }}>LNG out</th>
                  <th style={{ textAlign: 'right' }}>Pipe out</th>
                  <th style={{ textAlign: 'right' }}>Import</th>
                  <th style={{ textAlign: 'right' }}>Net out</th>
                </tr>
              </thead>
              <tbody>
                {seriesDesc.map((y) => {
                  const exp = y.lngExportBcfd + y.pipelineExportBcfd
                  const net = exp - y.importsBcfd
                  return (
                    <tr key={y.year}>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {y.year}
                      </td>
                      <td className="num">{y.productionBcfd.toFixed(1)}</td>
                      <td className="num">{y.consumptionBcfd.toFixed(1)}</td>
                      <td className="num">{y.lngExportBcfd.toFixed(1)}</td>
                      <td className="num">{y.pipelineExportBcfd.toFixed(1)}</td>
                      <td className="num">{y.importsBcfd.toFixed(1)}</td>
                      <td className="num" style={{ color: net >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                        {net >= 0 ? '+' : ''}
                        {net.toFixed(1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
            All columns Bcf/d annual average.
          </p>
        </section>
      </div>

      <hr className="rule" />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">Export routes · {GAS_REF_YEAR}</p>
          <h2 className="page-h2">Where US gas goes</h2>
          <p className="sub">Pipeline vs LNG destinations (sample Bcf/d).</p>
          <div className="chart-box" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routeBars} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis
                  dataKey="short"
                  tick={{ fill: tick, fontSize: 9 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={36} unit=" Bcf/d" />
                <Tooltip
                  contentStyle={{ background: tipBg, border: `1px solid ${grid}`, borderRadius: 2, fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toFixed(1)} Bcf/d`, 'Flow']}
                />
                <Bar dataKey="bcfd" radius={[2, 2, 0, 0]}>
                  {routeBars.map((r) => (
                    <Cell key={r.short} fill={r.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Kind</th>
                  <th style={{ textAlign: 'right' }}>Bcf/d</th>
                  <th style={{ textAlign: 'right' }}>Share</th>
                  <th>Partners</th>
                </tr>
              </thead>
              <tbody>
                {[...GAS_EXPORT_ROUTES]
                  .sort((a, b) => b.bcfd - a.bcfd)
                  .map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{r.label}</td>
                      <td>
                        <Badge variant={r.kind === 'lng' ? 'info' : 'warning'}>{r.kind}</Badge>
                      </td>
                      <td className="num">{r.bcfd.toFixed(1)}</td>
                      <td className="num">{r.shareOfExportsPct}%</td>
                      <td className="muted">{r.partners.join(', ')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="block">
          <p className="kicker">LNG terminals</p>
          <h2 className="page-h2">Export capacity</h2>
          <p className="sub">
            Nominal capacity sample: operating {lngCap.operating.toFixed(1)} Bcf/d · construction{' '}
            {lngCap.construction.toFixed(1)} · proposed {lngCap.proposed.toFixed(1)}.
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Terminal</th>
                  <th>State</th>
                  <th>Coast</th>
                  <th style={{ textAlign: 'right' }}>Bcf/d</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...LNG_TERMINALS]
                  .sort((a, b) => {
                    const rank = { operating: 0, 'under-construction': 1, proposed: 2 }
                    return rank[a.status] - rank[b.status] || b.capacityBcfd - a.capacityBcfd
                  })
                  .map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{t.name}</td>
                      <td className="mono">{t.stateAbbr}</td>
                      <td className="muted">{t.coast}</td>
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
      </div>

      <p className="footer-line">
        Natural gas · production & exports · EIA-scale samples · {GAS_REF_YEAR} state table · pair
        with electricity gas fleet on Overview and Portfolios
      </p>
    </div>
  )
}
