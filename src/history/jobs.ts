import type { StorageAdapter } from '../storage/adapter.ts'
import { acceptAnalystNote, analystPrompt, buildAnalystFacts } from './analyst.ts'
import {
  CAISO_OUTLOOK_BASE,
  CAISO_REGION,
  observationsFromCaiso,
  observationsFromOpenMeteo,
  type CaisoFiles,
} from './caisoParse.ts'
import {
  EIA_BACKFILL_START,
  EIA_FUELS,
  EIA_REGION_TYPES,
  eiaUrl,
  observationsFromEia,
  parseEiaPage,
  parseRespondents,
  timezoneForRespondent,
  utcToEiaPeriod,
} from './eia.ts'
import { buildForecastBundle, pointsFromObservations } from './forecast.ts'
import { addHours } from './time.ts'

const OPEN_METEO =
  'https://api.open-meteo.com/v1/forecast?latitude=37.0&longitude=-120.0&current=temperature_2m,wind_speed_10m,shortwave_radiation&timezone=America%2FLos_Angeles'

export interface JobResult {
  status: 'ok' | 'error' | 'skipped'
  message: string
  detail?: Record<string, unknown>
}

async function record(
  storage: StorageAdapter,
  agent: string,
  startedAt: string,
  result: JobResult
): Promise<JobResult> {
  try {
    await storage.logRun({
      agent,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: result.status,
      message: result.message,
      detail: result.detail ?? null,
    })
  } catch (err) {
    console.error(`[${agent}] failed to log run`, err)
  }
  if (result.status === 'error') console.error(`[${agent}] ${result.message}`)
  else console.log(`[${agent}] ${result.message}`)
  return result
}

export async function runCapture(args: {
  storage: StorageAdapter
  fetchImpl?: typeof fetch
  now?: Date
}): Promise<JobResult> {
  const startedAt = new Date().toISOString()
  const fetchImpl = args.fetchImpl ?? fetch
  const retrievedAt = (args.now ?? new Date()).toISOString()
  const files: CaisoFiles = {
    systemStatus: null,
    demand: null,
    fuel: null,
    storage: null,
    netDemand: null,
  }
  const names = [
    ['systemStatus', 'systemstatus'],
    ['demand', 'demand'],
    ['fuel', 'fuelsource'],
    ['storage', 'storage'],
    ['netDemand', 'netdemand'],
  ] as const
  const failures: string[] = []
  for (const [key, file] of names) {
    const url = `${CAISO_OUTLOOK_BASE}/${file}.csv`
    try {
      const res = await fetchImpl(url, { headers: { Accept: 'text/csv,*/*' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (!text.trim() || text.includes('<html')) throw new Error('empty or HTML body')
      files[key] = text
    } catch (err) {
      failures.push(`${file}: ${err instanceof Error ? err.message : 'failed'}`)
    }
  }
  if (!files.systemStatus && !files.demand && !files.fuel) {
    return record(args.storage, 'capture', startedAt, {
      status: 'error',
      message: `CAISO outlook fetch failed. ${failures.join('; ')}`,
      detail: { failures },
    })
  }
  let written = 0
  try {
    const rows = observationsFromCaiso(files, retrievedAt)
    const saved = await args.storage.upsertObservations(rows)
    written += saved.written
  } catch (err) {
    return record(args.storage, 'capture', startedAt, {
      status: 'error',
      message: err instanceof Error ? err.message : 'CAISO parse failed',
      detail: { failures },
    })
  }
  try {
    const res = await fetchImpl(OPEN_METEO)
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
    const json = (await res.json()) as Parameters<typeof observationsFromOpenMeteo>[0]
    const weather = observationsFromOpenMeteo(json, retrievedAt, OPEN_METEO)
    written += (await args.storage.upsertObservations(weather)).written
  } catch (err) {
    failures.push(`open-meteo: ${err instanceof Error ? err.message : 'failed'}`)
  }
  if (!written) {
    return record(args.storage, 'capture', startedAt, {
      status: 'error',
      message: 'Capture wrote 0 observations',
      detail: { failures },
    })
  }
  return record(args.storage, 'capture', startedAt, {
    status: failures.length ? 'error' : 'ok',
    message: failures.length
      ? `Wrote ${written} observations with file errors: ${failures.join('; ')}`
      : `Wrote ${written} observations`,
    detail: { written, failures },
  })
}

export interface BackfillStep {
  respondent: string
  route: 'region' | 'fuel'
  facet: string
  series: string
  truthClass: 'measured' | 'reported' | 'estimate'
}

export function backfillPlan(respondents: string[]): BackfillStep[] {
  const steps: BackfillStep[] = []
  for (const respondent of respondents) {
    timezoneForRespondent(respondent)
    for (const type of EIA_REGION_TYPES) {
      steps.push({
        respondent,
        route: 'region',
        facet: type.type,
        series: type.series,
        truthClass: type.truthClass,
      })
    }
    for (const fuel of EIA_FUELS) {
      steps.push({
        respondent,
        route: 'fuel',
        facet: fuel.fueltype,
        series: fuel.series,
        truthClass: 'reported',
      })
    }
  }
  return steps
}

export async function runBackfillChunk(args: {
  storage: StorageAdapter
  apiKey: string | undefined
  respondents?: string[]
  pages?: number
  fetchImpl?: typeof fetch
  now?: Date
  sleepMs?: number
}): Promise<JobResult> {
  const startedAt = new Date().toISOString()
  if (!args.apiKey) {
    return record(args.storage, 'backfill', startedAt, {
      status: 'error',
      message: 'EIA_API_KEY is not set',
    })
  }
  const fetchImpl = args.fetchImpl ?? fetch
  const now = args.now ?? new Date()
  const pages = args.pages ?? 1
  let respondents: string[]
  try {
    respondents = args.respondents ?? parseRespondents(process.env.EIA_RESPONDENTS)
    backfillPlan(respondents)
  } catch (err) {
    return record(args.storage, 'backfill', startedAt, {
      status: 'error',
      message: err instanceof Error ? err.message : 'respondent config failed',
    })
  }
  const plan = backfillPlan(respondents)
  let pagesDone = 0
  let written = 0
  const pause = args.sleepMs ?? 1100
  for (const step of plan) {
    if (pagesDone >= pages) break
    const zone = timezoneForRespondent(step.respondent)
    const cursor = await args.storage.getCursor('eia-930', step.series, step.respondent)
    const startIso = cursor?.nextStart ?? EIA_BACKFILL_START
    if (Date.parse(startIso) >= now.getTime()) continue
    const endIso = now.toISOString()
    const url = eiaUrl({
      route: step.route,
      apiKey: args.apiKey,
      respondent: step.respondent,
      facet: step.facet,
      start: utcToEiaPeriod(startIso, zone),
      end: utcToEiaPeriod(endIso, zone),
      offset: 0,
      length: 5000,
    })
    let page
    try {
      page = await fetchEiaWithRetry(fetchImpl, url, pause)
    } catch (err) {
      return record(args.storage, 'backfill', startedAt, {
        status: 'error',
        message: err instanceof Error ? err.message : 'EIA fetch failed',
        detail: { series: step.series, respondent: step.respondent, written, pagesDone },
      })
    }
    const rows = observationsFromEia({
      rows: page.data,
      respondent: step.respondent,
      series: step.series,
      truthClass: step.truthClass,
      sourceUrl: 'https://www.eia.gov/opendata/browser/electricity/rto',
      retrievedAt: now.toISOString(),
    })
    written += (await args.storage.upsertObservations(rows)).written
    const last = rows.at(-1)?.ts
    const nextStart = last ? addHours(last, 1) : startIso
    await args.storage.setCursor({
      source: 'eia-930',
      series: step.series,
      region: step.respondent,
      nextStart,
      updatedAt: now.toISOString(),
    })
    pagesDone += 1
    if (page.data.length === 5000) break
  }
  return record(args.storage, 'backfill', startedAt, {
    status: 'ok',
    message: `Backfill wrote ${written} observations across ${pagesDone} page(s)`,
    detail: { written, pagesDone },
  })
}

async function fetchEiaWithRetry(fetchImpl: typeof fetch, url: string, pauseMs: number): Promise<ReturnType<typeof parseEiaPage>> {
  let wait = pauseMs
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetchImpl(url)
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : wait
      await new Promise((r) => setTimeout(r, delay))
      wait *= 2
      continue
    }
    if (!res.ok) throw new Error(`EIA HTTP ${res.status}`)
    const json = await res.json()
    return parseEiaPage(json)
  }
  throw new Error('EIA rate limit persisted after retries')
}

export async function runForecast(args: {
  storage: StorageAdapter
  series?: string
  region?: string
  now?: Date
  horizonHours?: number
  statusMin?: string
}): Promise<JobResult> {
  const startedAt = new Date().toISOString()
  const issuedAt = (args.now ?? new Date()).toISOString()
  const region = args.region ?? CAISO_REGION
  const series = args.series ?? 'demand_mw'
  const from = addHours(issuedAt, -24 * 400)
  const history = await args.storage.listObservations({ series, region, from, to: issuedAt })
  const points = pointsFromObservations(history.filter((row) => row.truthClass === 'measured' || row.truthClass === 'reported'))
  if (points.length < 48) {
    return record(args.storage, 'forecast', startedAt, {
      status: 'skipped',
      message: `Not enough stored history for ${series} ${region} (${points.length} points)`,
    })
  }
  const weatherRows = await args.storage.listObservations({
    series: 'weather_temp_c',
    region,
    from,
    to: addHours(issuedAt, args.horizonHours ?? 72),
  })
  const solarRows = await args.storage.listObservations({
    series: 'weather_solar_wm2',
    region,
    from,
    to: addHours(issuedAt, args.horizonHours ?? 72),
  })
  const solarByTs = new Map(solarRows.map((r) => [r.ts, r.value]))
  const weather = weatherRows.map((r) => ({
    ts: r.ts,
    tempC: r.value,
    solarWm2: solarByTs.get(r.ts) ?? null,
  }))
  const origins = backtestOrigins(points.map((p) => p.ts), issuedAt)
  const projects = await args.storage.listProjects()
  const bundle = buildForecastBundle({
    series,
    region,
    points,
    weather,
    futureWeather: weather.filter((w) => Date.parse(w.ts) > Date.parse(issuedAt)),
    issuedAt,
    horizonHours: args.horizonHours ?? 72,
    projects,
    statusMin: args.statusMin ?? process.env.PROJECT_STATUS_MIN,
    backtestOrigins: origins,
  })
  const chosen = bundle.rows.filter((row) => row.model === bundle.model)
  if (!chosen.length) {
    return record(args.storage, 'forecast', startedAt, {
      status: 'skipped',
      message: 'No model produced a forecast from stored history',
      detail: { scores: bundle.scores.length },
    })
  }
  await args.storage.insertForecasts(bundle.rows)
  if (bundle.scores.length) await args.storage.insertBacktests(bundle.scores)
  return record(args.storage, 'forecast', startedAt, {
    status: 'ok',
    message: `Issued ${chosen.length} ${bundle.model} hours for ${series} ${region}`,
    detail: {
      model: bundle.model,
      rows: bundle.rows.length,
      projectMw: bundle.projectLoad?.mw ?? null,
      mape: bundle.selected?.mape ?? null,
    },
  })
}

function backtestOrigins(timestamps: string[], issuedAt: string): string[] {
  const issued = Date.parse(issuedAt)
  const day = 24 * 3600_000
  const origins: string[] = []
  for (let i = 14; i >= 1; i--) {
    const origin = new Date(issued - i * day).toISOString()
    const hasPast = timestamps.some((ts) => Date.parse(ts) < Date.parse(origin) - 370 * day)
    const hasFuture = timestamps.some((ts) => {
      const t = Date.parse(ts)
      return t > Date.parse(origin) && t <= Date.parse(origin) + day
    })
    if (hasPast && hasFuture) origins.push(origin)
  }
  return origins.slice(-3)
}

export async function runAnalyst(args: {
  storage: StorageAdapter
  apiKey: string | undefined
  region?: string
  now?: Date
  fetchImpl?: typeof fetch
}): Promise<JobResult> {
  const startedAt = new Date().toISOString()
  const key = args.apiKey
  if (!key) {
    return record(args.storage, 'analyst', startedAt, {
      status: 'skipped',
      message: 'No ANALYST_API_KEY or OPENAI_API_KEY. Analyst skipped.',
    })
  }
  const region = args.region ?? CAISO_REGION
  const now = args.now ?? new Date()
  const issuedAt = now.toISOString()
  const observations = await args.storage.listObservations({
    series: 'demand_mw',
    region,
    from: addHours(issuedAt, -48),
    to: issuedAt,
  })
  const vintage = await args.storage.latestForecastVintage('demand_mw', region)
  const forecasts = vintage
    ? await args.storage.listForecasts({
        series: 'demand_mw',
        region,
        from: addHours(issuedAt, -48),
        to: addHours(issuedAt, 72),
      })
    : []
  const scores = await args.storage.listBacktests('demand_mw', region)
  if (!observations.length && !forecasts.length) {
    return record(args.storage, 'analyst', startedAt, {
      status: 'skipped',
      message: 'No stored demand observations or forecasts to cite',
    })
  }
  const facts = buildAnalystFacts({
    region,
    generatedAt: issuedAt,
    observations: observations.slice(-24),
    forecasts: forecasts.slice(0, 24),
    scores: scores.slice(0, 6),
  })
  const base = process.env.ANALYST_API_BASE ?? 'https://api.openai.com/v1'
  const model = process.env.ANALYST_MODEL ?? 'gpt-4o-mini'
  const fetchImpl = args.fetchImpl ?? fetch
  const res = await fetchImpl(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: 'You only restate numbers present in the user FACTS JSON.' },
        { role: 'user', content: analystPrompt(facts) },
      ],
    }),
  })
  if (!res.ok) {
    return record(args.storage, 'analyst', startedAt, {
      status: 'error',
      message: `Analyst model HTTP ${res.status}`,
    })
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const body = json.choices?.[0]?.message?.content?.trim()
  if (!body) {
    return record(args.storage, 'analyst', startedAt, {
      status: 'error',
      message: 'Analyst model returned an empty note',
    })
  }
  try {
    const note = acceptAnalystNote({ body, facts, model, issuedAt })
    await args.storage.insertAnalystNote(note)
  } catch (err) {
    return record(args.storage, 'analyst', startedAt, {
      status: 'error',
      message: err instanceof Error ? err.message : 'Analyst note rejected',
    })
  }
  return record(args.storage, 'analyst', startedAt, {
    status: 'ok',
    message: 'Stored analyst note from cited facts',
  })
}

export function analystKeyFromEnv(): string | undefined {
  return process.env.ANALYST_API_KEY || process.env.OPENAI_API_KEY || undefined
}
