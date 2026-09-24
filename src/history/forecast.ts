import type { BacktestScore, Forecast, Observation } from './types.ts'
import { residualQuantiles, scorePairs } from './metrics.ts'
import { addHours } from './time.ts'
import { projectLoadAt, type ProjectLoad } from './projects.ts'
import type { Project } from './types.ts'

const YEAR_MS = 365 * 24 * 3600_000

export interface HistoryPoint {
  ts: string
  value: number
}

export function pointsFromObservations(rows: Observation[]): HistoryPoint[] {
  const byTs = new Map<string, number>()
  for (const row of rows) {
    if (!Number.isFinite(row.value)) continue
    byTs.set(new Date(row.ts).toISOString(), row.value)
  }
  return [...byTs.entries()]
    .map(([ts, value]) => ({ ts, value }))
    .sort((a, b) => a.ts.localeCompare(b.ts))
}

function indexByTs(points: HistoryPoint[]): Map<string, number> {
  return new Map(points.map((p) => [p.ts, p.value]))
}

function mean(values: number[]): number | null {
  if (!values.length) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

export interface TrendResult {
  factor: number
  recentMean: number
  baselineMean: number
  recentN: number
  baselineN: number
}

/** Same-hour last year level, scaled by the recent 28-day mean vs that window a year earlier. */
export function yearTrend(points: HistoryPoint[], issuedAt: string, windowDays = 28): TrendResult | null {
  const issued = Date.parse(issuedAt)
  const recentStart = issued - windowDays * 24 * 3600_000
  const baseEnd = issued - YEAR_MS
  const baseStart = baseEnd - windowDays * 24 * 3600_000
  const recent: number[] = []
  const baseline: number[] = []
  for (const p of points) {
    const t = Date.parse(p.ts)
    if (t >= recentStart && t < issued) recent.push(p.value)
    if (t >= baseStart && t < baseEnd) baseline.push(p.value)
  }
  const recentMean = mean(recent)
  const baselineMean = mean(baseline)
  if (recentMean == null || baselineMean == null || baselineMean === 0) return null
  if (recent.length < 24 || baseline.length < 24) return null
  return {
    factor: recentMean / baselineMean,
    recentMean,
    baselineMean,
    recentN: recent.length,
    baselineN: baseline.length,
  }
}

export interface IssuedPoint {
  targetTs: string
  value: number
  p10: number | null
  p90: number | null
  inputs: Record<string, unknown>
}

function withBand(
  value: number,
  band: { p10: number; p90: number } | null
): { p10: number | null; p90: number | null } {
  if (!band) return { p10: null, p90: null }
  return { p10: value + band.p10, p90: value + band.p90 }
}

export function seasonalNaiveForecast(args: {
  points: HistoryPoint[]
  issuedAt: string
  horizonHours: number
  withTrend: boolean
}): IssuedPoint[] {
  const lookup = indexByTs(args.points)
  const trend = args.withTrend ? yearTrend(args.points, args.issuedAt) : null
  const residuals: number[] = []
  const issued = Date.parse(args.issuedAt)
  for (const p of args.points) {
    const t = Date.parse(p.ts)
    if (t >= issued) continue
    const yoyTs = new Date(t - YEAR_MS).toISOString()
    const yoy = lookup.get(yoyTs)
    if (yoy == null) continue
    const pred = trend ? yoy * trend.factor : yoy
    residuals.push(p.value - pred)
  }
  const band = residualQuantiles(residuals)
  const out: IssuedPoint[] = []
  for (let h = 1; h <= args.horizonHours; h++) {
    const target = addHours(args.issuedAt, h)
    const yoyTs = new Date(Date.parse(target) - YEAR_MS).toISOString()
    const yoy = lookup.get(yoyTs)
    if (yoy == null) continue
    const value = trend ? yoy * trend.factor : yoy
    out.push({
      targetTs: target,
      value,
      ...withBand(value, band),
      inputs: {
        yoyTs,
        yoy,
        trendFactor: trend?.factor ?? null,
        trendRecentN: trend?.recentN ?? null,
        trendBaselineN: trend?.baselineN ?? null,
        residualN: residuals.length,
      },
    })
  }
  return out
}

interface WeatherRow {
  ts: string
  tempC: number | null
  solarWm2: number | null
}

function fitWeather(points: HistoryPoint[], weather: WeatherRow[], issuedAt: string) {
  const issued = Date.parse(issuedAt)
  const weatherByTs = new Map(weather.map((w) => [new Date(w.ts).toISOString(), w]))
  const rows: { y: number; x: number[] }[] = []
  for (const p of points) {
    if (Date.parse(p.ts) >= issued) continue
    const w = weatherByTs.get(p.ts)
    if (!w || w.tempC == null) continue
    const hour = new Date(p.ts).getUTCHours()
    const solar = w.solarWm2 ?? 0
    rows.push({
      y: p.value,
      x: [1, w.tempC, w.tempC * w.tempC, solar, Math.sin((2 * Math.PI * hour) / 24), Math.cos((2 * Math.PI * hour) / 24)],
    })
  }
  if (rows.length < 48) return null
  const beta = leastSquares(rows.map((r) => r.x), rows.map((r) => r.y))
  if (!beta) return null
  const residuals: number[] = []
  for (const row of rows) {
    residuals.push(row.y - dot(beta, row.x))
  }
  return { beta, residuals, n: rows.length, band: residualQuantiles(residuals) }
}

function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/** Normal equations. Returns null when the design is singular. */
export function leastSquares(x: number[][], y: number[]): number[] | null {
  const k = x[0]?.length ?? 0
  if (!k || x.length < k) return null
  const xtx: number[][] = Array.from({ length: k }, () => Array(k).fill(0))
  const xty: number[] = Array(k).fill(0)
  for (let n = 0; n < x.length; n++) {
    for (let i = 0; i < k; i++) {
      xty[i] += x[n][i] * y[n]
      for (let j = 0; j < k; j++) xtx[i][j] += x[n][i] * x[n][j]
    }
  }
  return solve(xtx, xty)
}

function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length
  const m = a.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r
    }
    if (Math.abs(m[pivot][col]) < 1e-10) return null
    ;[m[col], m[pivot]] = [m[pivot], m[col]]
    const div = m[col][col]
    for (let c = col; c <= n; c++) m[col][c] /= div
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = m[r][col]
      for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c]
    }
  }
  return m.map((row) => row[n])
}

export function weatherAdjustedForecast(args: {
  points: HistoryPoint[]
  weather: WeatherRow[]
  futureWeather: WeatherRow[]
  issuedAt: string
  horizonHours: number
}): IssuedPoint[] | null {
  const fit = fitWeather(args.points, args.weather, args.issuedAt)
  if (!fit) return null
  const future = new Map(args.futureWeather.map((w) => [new Date(w.ts).toISOString(), w]))
  const out: IssuedPoint[] = []
  for (let h = 1; h <= args.horizonHours; h++) {
    const targetTs = addHours(args.issuedAt, h)
    const w = future.get(targetTs)
    if (!w || w.tempC == null) continue
    const hour = new Date(targetTs).getUTCHours()
    const solar = w.solarWm2 ?? 0
    const x = [1, w.tempC, w.tempC * w.tempC, solar, Math.sin((2 * Math.PI * hour) / 24), Math.cos((2 * Math.PI * hour) / 24)]
    const value = dot(fit.beta, x)
    out.push({
      targetTs,
      value,
      ...withBand(value, fit.band),
      inputs: {
        tempC: w.tempC,
        solarWm2: w.solarWm2,
        fitN: fit.n,
      },
    })
  }
  return out.length ? out : null
}

export function toForecastRows(args: {
  points: IssuedPoint[]
  series: string
  region: string
  model: string
  issuedAt: string
  sourceNotes: string
}): Forecast[] {
  return args.points.map((p) => ({
    series: args.series,
    region: args.region,
    targetTs: p.targetTs,
    value: p.value,
    p10: p.p10,
    p90: p.p90,
    model: args.model,
    issuedAt: args.issuedAt,
    inputs: p.inputs,
    sourceNotes: args.sourceNotes,
  }))
}

export function backtestModel(args: {
  points: HistoryPoint[]
  weather?: WeatherRow[]
  model: 'seasonal_naive' | 'seasonal_naive_trend' | 'weather_adjusted'
  origin: string
  horizonHours: number
}): { pairs: { actual: number; pred: number; p10: number | null; p90: number | null }[]; issued: IssuedPoint[] } | null {
  const originMs = Date.parse(args.origin)
  const history = args.points.filter((p) => Date.parse(p.ts) < originMs)
  let issued: IssuedPoint[] | null = null
  if (args.model === 'seasonal_naive') {
    issued = seasonalNaiveForecast({ points: history, issuedAt: args.origin, horizonHours: args.horizonHours, withTrend: false })
  } else if (args.model === 'seasonal_naive_trend') {
    issued = seasonalNaiveForecast({ points: history, issuedAt: args.origin, horizonHours: args.horizonHours, withTrend: true })
  } else {
    const weather = (args.weather ?? []).filter((w) => Date.parse(w.ts) < originMs)
    const future = (args.weather ?? []).filter((w) => {
      const t = Date.parse(w.ts)
      return t > originMs && t <= originMs + args.horizonHours * 3600_000
    })
    issued = weatherAdjustedForecast({
      points: history,
      weather,
      futureWeather: future,
      issuedAt: args.origin,
      horizonHours: args.horizonHours,
    })
  }
  if (!issued?.length) return null
  const actual = indexByTs(args.points)
  const pairs = []
  for (const row of issued) {
    const y = actual.get(row.targetTs)
    if (y == null) continue
    pairs.push({ actual: y, pred: row.value, p10: row.p10, p90: row.p90 })
  }
  return { pairs, issued }
}

export function scoreBacktest(args: {
  series: string
  region: string
  model: string
  vintageIssuedAt: string
  scoredAt: string
  horizonHours: number
  pairs: { actual: number; pred: number; p10: number | null; p90: number | null }[]
}): BacktestScore {
  const score = scorePairs(args.pairs)
  return {
    series: args.series,
    region: args.region,
    model: args.model,
    vintageIssuedAt: args.vintageIssuedAt,
    scoredAt: args.scoredAt,
    horizonHours: args.horizonHours,
    n: score.n,
    mape: score.mape,
    mae: score.mae,
    rmse: score.rmse,
    bias: score.bias,
    coverageP10P90: score.coverageP10P90,
    notes: 'Scored only on hours with a stored actual and a model value. MAPE skips actuals of 0.',
  }
}

export function selectModel(scores: BacktestScore[], minN = 24): BacktestScore | null {
  const eligible = scores.filter((s) => s.n >= minN && s.mape != null)
  if (!eligible.length) return null
  return eligible.slice().sort((a, b) => (a.mape as number) - (b.mape as number) || a.model.localeCompare(b.model))[0]
}

export interface ForecastBundle {
  model: string
  rows: Forecast[]
  scores: BacktestScore[]
  selected: BacktestScore | null
  projectLoad: ProjectLoad | null
}

const MODEL_NOTES: Record<string, string> = {
  seasonal_naive: 'Same hour 365 days earlier. Interval is the in-sample residual p10 to p90.',
  seasonal_naive_trend: 'Same hour 365 days earlier, scaled by the last 28 days versus that window a year earlier.',
  weather_adjusted: 'Least squares on stored temperature, solar radiation, and hour of day. Skipped when fewer than 48 aligned hours exist.',
}

export function buildForecastBundle(args: {
  series: string
  region: string
  points: HistoryPoint[]
  weather: WeatherRow[]
  futureWeather: WeatherRow[]
  issuedAt: string
  horizonHours: number
  projects?: Project[]
  statusMin?: string
  backtestOrigins?: string[]
}): ForecastBundle {
  const scoredAt = args.issuedAt
  const scores: BacktestScore[] = []
  const origins = args.backtestOrigins ?? []
  for (const origin of origins) {
    for (const model of ['seasonal_naive', 'seasonal_naive_trend', 'weather_adjusted'] as const) {
      const result = backtestModel({
        points: args.points,
        weather: args.weather,
        model,
        origin,
        horizonHours: Math.min(args.horizonHours, 24),
      })
      if (!result) continue
      scores.push(
        scoreBacktest({
          series: args.series,
          region: args.region,
          model,
          vintageIssuedAt: args.issuedAt,
          scoredAt,
          horizonHours: Math.min(args.horizonHours, 24),
          pairs: result.pairs,
        })
      )
    }
  }

  const selected = selectModel(scores)
  const naive = seasonalNaiveForecast({
    points: args.points.filter((p) => Date.parse(p.ts) < Date.parse(args.issuedAt)),
    issuedAt: args.issuedAt,
    horizonHours: args.horizonHours,
    withTrend: false,
  })
  const trend = seasonalNaiveForecast({
    points: args.points.filter((p) => Date.parse(p.ts) < Date.parse(args.issuedAt)),
    issuedAt: args.issuedAt,
    horizonHours: args.horizonHours,
    withTrend: true,
  })
  const weather = weatherAdjustedForecast({
    points: args.points.filter((p) => Date.parse(p.ts) < Date.parse(args.issuedAt)),
    weather: args.weather.filter((w) => Date.parse(w.ts) < Date.parse(args.issuedAt)),
    futureWeather: args.futureWeather,
    issuedAt: args.issuedAt,
    horizonHours: args.horizonHours,
  })

  const produced: { model: string; points: IssuedPoint[] }[] = [
    { model: 'seasonal_naive', points: naive },
    { model: 'seasonal_naive_trend', points: trend },
  ]
  if (weather) produced.push({ model: 'weather_adjusted', points: weather })

  const chosen = selected?.model ?? (naive.length ? 'seasonal_naive' : produced.find((p) => p.points.length)?.model ?? 'seasonal_naive')
  const chosenPoints = produced.find((p) => p.model === chosen)?.points ?? []

  let projectLoad: ProjectLoad | null = null
  if (args.projects) {
    const first = chosenPoints[0]?.targetTs ?? args.issuedAt
    projectLoad = projectLoadAt(args.projects, first, args.statusMin)
  }

  const rows = produced.flatMap((item) =>
    toForecastRows({
      points: item.points,
      series: args.series,
      region: args.region,
      model: item.model,
      issuedAt: args.issuedAt,
      sourceNotes: MODEL_NOTES[item.model] ?? item.model,
    })
  )

  return { model: chosen, rows, scores, selected, projectLoad }
}
