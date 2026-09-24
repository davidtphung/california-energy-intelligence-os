import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { TEST_FIXTURE_LABEL, testTimelineFixture } from '../../history/testFixture.ts'

interface ObservationRow {
  ts: string
  value: number
  unit: string
  source: string
  sourceUrl: string | null
  truthClass: string
}

interface ForecastRow {
  targetTs: string
  value: number
  p10: number | null
  p90: number | null
  model: string
  issuedAt: string
  sourceNotes: string | null
}

interface ScoreRow {
  model: string
  mape: number | null
  mae: number | null
  n: number
  vintageIssuedAt: string
}

interface ProjectLoad {
  mw: number
  included: { name: string; mw: number; source: string; sourceUrl: string | null }[]
  excluded: { name: string; reason: string }[]
}

interface TimelinePayload {
  series: string
  region: string
  unit: string | null
  source: string | null
  sourceUrl: string | null
  observations: ObservationRow[]
  forecasts: ForecastRow[]
  projectLoad: ProjectLoad
  scores: ScoreRow[]
  note: { body: string; issuedAt: string; citations: { source: string; sourceUrl: string | null }[] } | null
  catalog: { series: string; region: string; unit: string; source: string }[]
  statusMin?: string
  error?: string
}

const PAST = [
  { hours: 24, label: '1 day' },
  { hours: 168, label: '7 days' },
  { hours: 720, label: '30 days' },
  { hours: 8760, label: '1 year' },
]
const FUTURE = [
  { hours: 0, label: 'None' },
  { hours: 24, label: '24 hours' },
  { hours: 72, label: '72 hours' },
  { hours: 168, label: '7 days' },
]

export function TimelinePanel() {
  const { theme } = useApp()
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const testMode = import.meta.env.DEV && hash.replace('#', '').startsWith('timeline/test')
  const [pastHours, setPastHours] = useState(168)
  const [futureHours, setFutureHours] = useState(72)
  const [series, setSeries] = useState('demand_mw')
  const [region, setRegion] = useState('CISO')
  const [includeProjects, setIncludeProjects] = useState(false)
  const [payload, setPayload] = useState<TimelinePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (testMode) {
      const fixture = testTimelineFixture()
      setPayload({
        series: fixture.series,
        region: fixture.region,
        unit: fixture.unit,
        source: fixture.source,
        sourceUrl: null,
        observations: fixture.observations,
        forecasts: fixture.forecasts,
        projectLoad: fixture.projectLoad,
        scores: [],
        note: null,
        catalog: [{ series: 'demand_mw', region: 'TEST', unit: 'MW', source: 'TEST DATA' }],
      })
      setSeries('demand_mw')
      setRegion('TEST')
      setError(null)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    const params = new URLSearchParams({
      series,
      region,
      pastHours: String(pastHours),
      futureHours: String(futureHours),
    })
    fetch(`/api/history/timeline?${params}`, { signal: ctrl.signal, cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json()) as TimelinePayload
        if (!res.ok) {
          setPayload(null)
          setError(json.error ?? `Timeline request failed (${res.status})`)
          return
        }
        setPayload(json)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Timeline request failed')
      })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [series, region, pastHours, futureHours, testMode])

  const chart = useMemo(() => {
    const rows = new Map<string, { ts: string; measured: number | null; forecast: number | null; bandBase: number | null; bandSpan: number | null; projects: number | null }>()
    for (const obs of payload?.observations ?? []) {
      rows.set(obs.ts, { ts: obs.ts, measured: obs.value, forecast: null, bandBase: null, bandSpan: null, projects: null })
    }
    const extra = includeProjects ? (payload?.projectLoad.mw ?? 0) : 0
    for (const fc of payload?.forecasts ?? []) {
      const existing = rows.get(fc.targetTs) ?? {
        ts: fc.targetTs,
        measured: null,
        forecast: null,
        bandBase: null,
        bandSpan: null,
        projects: null,
      }
      existing.forecast = fc.value
      if (fc.p10 != null && fc.p90 != null) {
        existing.bandBase = fc.p10
        existing.bandSpan = fc.p90 - fc.p10
      }
      if (includeProjects && extra) existing.projects = fc.value + extra
      rows.set(fc.targetTs, existing)
    }
    return [...rows.values()].sort((a, b) => a.ts.localeCompare(b.ts))
  }, [payload, includeProjects])

  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const regions = [...new Set((payload?.catalog ?? []).map((row) => row.region))]
  const seriesOptions = (payload?.catalog ?? []).filter((row) => row.region === region)
  const source = payload?.source
  const sourceUrl = payload?.sourceUrl
  const unit = payload?.unit ?? 'value'
  const forecastSource = payload?.forecasts[0]?.sourceNotes
  return (
    <section className="timeline">
      <p className="kicker">History</p>
      <h1 className="page-h1">Timeline</h1>
      <p className="sub">
        Measured history is solid. The latest forecast vintage is dashed, with a p10 to p90 band when the model stored one.
        Project load is an optional add-on and is not baked into the model value.
      </p>
      {testMode ? <p className="timeline-test">{TEST_FIXTURE_LABEL}</p> : null}
      {import.meta.env.DEV && !testMode ? (
        <p className="sub">
          Layout check with synthetic points: <a href="#timeline/test">open the test chart</a>.
        </p>
      ) : null}

      <div className="timeline-controls">
        <label>
          Series
          <select
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            disabled={testMode || seriesOptions.length === 0}
          >
            {seriesOptions.length === 0 ? <option value={series}>{series}</option> : null}
            {seriesOptions.map((row) => (
              <option key={row.series} value={row.series}>
                {row.series}
              </option>
            ))}
          </select>
        </label>
        <label>
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)} disabled={testMode || regions.length === 0}>
            {regions.length === 0 ? <option value={region}>{region}</option> : null}
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Past</legend>
          {PAST.map((item) => (
            <button
              key={item.hours}
              type="button"
              className={pastHours === item.hours ? 'on' : undefined}
              onClick={() => setPastHours(item.hours)}
            >
              {item.label}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>Future</legend>
          {FUTURE.map((item) => (
            <button
              key={item.hours}
              type="button"
              className={futureHours === item.hours ? 'on' : undefined}
              onClick={() => setFutureHours(item.hours)}
            >
              {item.label}
            </button>
          ))}
        </fieldset>
        <label className="timeline-check">
          <input
            type="checkbox"
            checked={includeProjects}
            onChange={(e) => setIncludeProjects(e.target.checked)}
          />
          Add project load
        </label>
      </div>

      {loading ? <p className="sub">Loading stored history.</p> : null}
      {error ? <p className="timeline-error">{error}</p> : null}

      <figure className="timeline-figure">
        <div className="chart-box timeline-chart">
          {chart.length === 0 ? (
            <p className="sub">No stored points for this series and range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis
                  dataKey="ts"
                  tick={{ fill: tick, fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5, 16).replace('T', ' ')}
                  minTickGap={24}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: tick, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: theme === 'dark' ? '#000' : '#fff',
                    border: `1px solid ${grid}`,
                    fontSize: 12,
                  }}
                />
                <Area dataKey="bandBase" stackId="band" stroke="none" fill="transparent" name="p10" legendType="none" />
                <Area dataKey="bandSpan" stackId="band" stroke="none" fill="var(--accent)" fillOpacity={0.18} name="p10 to p90" />
                <Line dataKey="measured" name="Measured" stroke="var(--highlight)" strokeWidth={2} dot={false} connectNulls />
                <Line
                  dataKey="forecast"
                  name="Forecast"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  connectNulls
                />
                {includeProjects ? (
                  <Line
                    dataKey="projects"
                    name="Forecast plus projects"
                    stroke="var(--warn)"
                    strokeDasharray="2 3"
                    dot={false}
                    connectNulls
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <figcaption>
          <SourceChip source={source} href={sourceUrl} />
          {forecastSource ? <SourceChip source={forecastSource} /> : null}
          <span className="muted">
            {unit} · {region} · {series}
          </span>
        </figcaption>
      </figure>

      <figure className="timeline-figure">
        <figcaption>
          Project load above status {payload?.statusMin ?? 'construction'}:{' '}
          {payload ? `${payload.projectLoad.mw} MW` : 'empty'}
          <SourceChip
            source={
              payload?.projectLoad.included[0]?.source ??
              'Projects table is empty until a cited row is stored'
            }
            href={payload?.projectLoad.included[0]?.sourceUrl}
          />
        </figcaption>
        {payload?.projectLoad.excluded.length ? (
          <ul className="timeline-excluded">
            {payload.projectLoad.excluded.map((row) => (
              <li key={`${row.name}-${row.reason}`}>
                {row.name}: {row.reason}
              </li>
            ))}
          </ul>
        ) : null}
      </figure>

      {payload?.scores.length ? (
        <figure className="timeline-figure">
          <table className="timeline-scores">
            <thead>
              <tr>
                <th>Model</th>
                <th>MAPE</th>
                <th>MAE</th>
                <th>n</th>
              </tr>
            </thead>
            <tbody>
              {payload.scores.map((score) => (
                <tr key={`${score.model}-${score.vintageIssuedAt}`}>
                  <td>{score.model}</td>
                  <td>{score.mape == null ? '' : score.mape.toFixed(1)}</td>
                  <td>{score.mae == null ? '' : score.mae.toFixed(1)}</td>
                  <td>{score.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <figcaption>
            <SourceChip source="Stored backtest against observations" />
          </figcaption>
        </figure>
      ) : null}

      {payload?.note ? (
        <figure className="timeline-figure">
          <p>{payload.note.body}</p>
          <figcaption>
            {payload.note.citations.map((item) => (
              <SourceChip key={`${item.source}-${item.sourceUrl}`} source={item.source} href={item.sourceUrl} />
            ))}
          </figcaption>
        </figure>
      ) : null}
    </section>
  )
}

function SourceChip({ source, href }: { source: string | null | undefined; href?: string | null }) {
  if (!source) return <span className="source-chip">Source missing</span>
  if (href) {
    return (
      <a className="source-chip" href={href} target="_blank" rel="noopener noreferrer">
        {source}
      </a>
    )
  }
  return <span className="source-chip">{source}</span>
}
