import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import {
  CA_IMPORT_PATHS,
  CA_MONTHLY_TRADE,
  tradeOf,
  withTrade,
} from '../../data/energyTrade'
import type { USStateEnergy } from '../../data/usStates'

interface Props {
  states: USStateEnergy[]
  selectedAbbr?: string | null
  onSelect?: (abbr: string) => void
  maxBars?: number
}

export function ImportExportChart({ states, selectedAbbr, onSelect, maxBars = 50 }: Props) {
  const { theme } = useApp()
  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tipBg = theme === 'dark' ? '#000000' : '#ffffff'
  const importColor = theme === 'dark' ? '#38bdf8' : '#0369a1'
  const exportColor = theme === 'dark' ? '#86efac' : '#15803d'

  const chartData = useMemo(() => {
    const rows = withTrade(states)
      .map((s) => ({
        abbr: s.abbr,
        name: s.name,
        imports: s.importsTwh,
        exports: s.exportsTwh,
        net: s.netExportTwh,
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
      .slice(0, maxBars)
    return rows
  }, [states, maxBars])

  const netData = useMemo(
    () =>
      [...chartData].sort((a, b) => a.net - b.net).map((r) => ({
        abbr: r.abbr,
        net: r.net,
        fill: r.net >= 0 ? exportColor : importColor,
      })),
    [chartData, exportColor, importColor]
  )

  return (
    <div className="stack" style={{ gap: '1.25rem' }}>
      <div>
        <p className="kicker">Gross trade</p>
        <h3 className="page-h2">Imports vs exports by state (TWh/yr)</h3>
        <p className="sub">
          Annual sample electricity transfers. Click a bar to focus that state.
        </p>
        <div className="chart-box" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 28 }}
              barGap={1}
              barCategoryGap="12%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis
                dataKey="abbr"
                tick={{ fill: tick, fontSize: 9 }}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={48}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
                unit=" TWh"
              />
              <Tooltip
                contentStyle={{
                  background: tipBg,
                  border: `1px solid ${grid}`,
                  borderRadius: 2,
                  fontSize: 12,
                }}
                formatter={(v, name) => [`${Number(v).toFixed(1)} TWh`, String(name)]}
                labelFormatter={(l) => {
                  const row = chartData.find((d) => d.abbr === l)
                  return row ? `${row.name} (${row.abbr})` : String(l)
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="imports"
                name="Imports"
                fill={importColor}
                radius={[2, 2, 0, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const abbr = (d as { abbr?: string })?.abbr
                  if (abbr && onSelect) onSelect(abbr)
                }}
              >
                {chartData.map((d) => (
                  <Cell
                    key={`i-${d.abbr}`}
                    fill={importColor}
                    fillOpacity={selectedAbbr && selectedAbbr !== d.abbr ? 0.35 : 0.9}
                    stroke={selectedAbbr === d.abbr ? 'var(--highlight)' : 'transparent'}
                    strokeWidth={selectedAbbr === d.abbr ? 1.5 : 0}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="exports"
                name="Exports"
                fill={exportColor}
                radius={[2, 2, 0, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const abbr = (d as { abbr?: string })?.abbr
                  if (abbr && onSelect) onSelect(abbr)
                }}
              >
                {chartData.map((d) => (
                  <Cell
                    key={`e-${d.abbr}`}
                    fill={exportColor}
                    fillOpacity={selectedAbbr && selectedAbbr !== d.abbr ? 0.35 : 0.9}
                    stroke={selectedAbbr === d.abbr ? 'var(--highlight)' : 'transparent'}
                    strokeWidth={selectedAbbr === d.abbr ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="kicker">Net position</p>
        <h3 className="page-h2">Net exports (TWh/yr)</h3>
        <p className="sub">
          Positive = net exporter. Negative = net importer. Sorted left importer to right exporter.
        </p>
        <div className="chart-box" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={netData}
              margin={{ top: 8, right: 8, left: 0, bottom: 28 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis
                dataKey="abbr"
                tick={{ fill: tick, fontSize: 9 }}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={48}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
                unit=" TWh"
              />
              <ReferenceLine y={0} stroke="var(--ink-2)" strokeWidth={1} />
              <Tooltip
                contentStyle={{
                  background: tipBg,
                  border: `1px solid ${grid}`,
                  borderRadius: 2,
                  fontSize: 12,
                }}
                formatter={(v) => [
                  `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)} TWh`,
                  'Net export',
                ]}
              />
              <Bar
                dataKey="net"
                name="Net export"
                radius={[2, 2, 0, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const abbr = (d as { abbr?: string })?.abbr
                  if (abbr && onSelect) onSelect(abbr)
                }}
              >
                {netData.map((d) => (
                  <Cell
                    key={d.abbr}
                    fill={d.fill}
                    fillOpacity={selectedAbbr && selectedAbbr !== d.abbr ? 0.35 : 0.92}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function CaliforniaTradeDetail() {
  const { theme } = useApp()
  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tipBg = theme === 'dark' ? '#000000' : '#ffffff'
  const ca = tradeOf('CA')
  const monthly = CA_MONTHLY_TRADE.map((m) => ({
    ...m,
    net: m.exports - m.imports,
  }))

  return (
    <div className="stack" style={{ gap: '1.1rem' }}>
      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">CA imports</span>
          <span className="metric-value">
            {ca.importsTwh}
            <span className="metric-unit">TWh</span>
          </span>
          <span className="metric-hint">annual sample</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">CA exports</span>
          <span className="metric-value">
            {ca.exportsTwh}
            <span className="metric-unit">TWh</span>
          </span>
          <span className="metric-hint">annual sample</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">CA net</span>
          <span className="metric-value">
            {ca.exportsTwh - ca.importsTwh}
            <span className="metric-unit">TWh</span>
          </span>
          <span className="metric-hint">net importer</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Partners in</span>
          <span className="metric-value" style={{ fontSize: '0.95rem' }}>
            {ca.importFrom.slice(0, 3).join(' · ')}
          </span>
          <span className="metric-hint">NW · SW · NV</span>
        </div>
      </div>

      <p className="sub">{ca.note}</p>

      <div className="grid-2">
        <div>
          <p className="kicker">Seasonality</p>
          <h3 className="page-h2">California monthly trade</h3>
          <div className="chart-box" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={32} unit=" TWh" />
                <Tooltip
                  contentStyle={{
                    background: tipBg,
                    border: `1px solid ${grid}`,
                    borderRadius: 2,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="imports" name="Imports" stroke="#0369a1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="exports" name="Exports" stroke="#15803d" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="net" name="Net" stroke="var(--highlight)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="kicker">Paths in</p>
          <h3 className="page-h2">CA import corridors</h3>
          <div className="stack" style={{ gap: '0.55rem', marginTop: '0.5rem' }}>
            {CA_IMPORT_PATHS.map((p) => (
              <div key={p.path}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 550 }}>{p.path}</span>
                  <span className="mono" style={{ color: 'var(--highlight)' }}>
                    {p.twh} TWh · {p.share}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${p.share}%`, background: '#0369a1' }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mono muted" style={{ marginTop: 12, fontSize: 11 }}>
            Out to: {ca.exportTo.join(' · ') || 'limited'}
          </p>
        </div>
      </div>
    </div>
  )
}
