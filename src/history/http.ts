import { postgresAdapterFromEnv } from '../storage/postgres.ts'
import { StorageUnavailable, type StorageAdapter } from '../storage/adapter.ts'
import { CAISO_REGION } from './caisoParse.ts'
import { analystKeyFromEnv, runAnalyst, runBackfillChunk, runCapture, runForecast } from './jobs.ts'
import { selectModel } from './forecast.ts'
import { projectLoadAt } from './projects.ts'
import { addHours } from './time.ts'

type Req = {
  method?: string
  url?: string
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
}

type Res = {
  status: (code: number) => Res
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
  end: () => void
}

async function storageOrNull(): Promise<{ storage: StorageAdapter } | { error: string }> {
  try {
    const storage = await postgresAdapterFromEnv()
    return { storage }
  } catch (err) {
    if (err instanceof StorageUnavailable) return { error: err.message }
    return { error: err instanceof Error ? err.message : 'storage failed' }
  }
}

function queryValue(req: Req, key: string): string | null {
  const fromQuery = req.query?.[key]
  if (typeof fromQuery === 'string') return fromQuery
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === 'string') return fromQuery[0]
  if (!req.url) return null
  const q = req.url.split('?')[1]
  if (!q) return null
  return new URLSearchParams(q).get(key)
}

export function cronAuthorized(req: Req): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers?.authorization ?? req.headers?.Authorization
  const value = Array.isArray(header) ? header[0] : header
  return value === `Bearer ${secret}`
}

function denyCron(res: Res) {
  res.status(401).json({ error: 'Unauthorized cron request' })
}

export async function timelineHandler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const ready = await storageOrNull()
  if ('error' in ready) {
    res.status(503).json({
      error: ready.error,
      observations: [],
      forecasts: [],
      projects: [],
    })
    return
  }
  const series = queryValue(req, 'series') ?? 'demand_mw'
  const region = queryValue(req, 'region') ?? CAISO_REGION
  const now = new Date()
  const pastHours = Number(queryValue(req, 'pastHours') ?? '168')
  const futureHours = Number(queryValue(req, 'futureHours') ?? '72')
  const from = addHours(now.toISOString(), - (Number.isFinite(pastHours) ? pastHours : 168))
  const to = addHours(now.toISOString(), Number.isFinite(futureHours) ? futureHours : 72)
  const requestedModel = queryValue(req, 'model')
  const { storage } = ready
  const observations = await storage.listObservations({ series, region, from, to })
  const scores = await storage.listBacktests(series, region)
  const model = requestedModel ?? selectModel(scores)?.model
  let forecasts = await storage.listForecasts({
    series,
    region,
    from,
    to,
    model,
  })
  if (!forecasts.length && !requestedModel) {
    const anyModel = await storage.listForecasts({ series, region, from, to })
    const keep = anyModel[0]?.model
    forecasts = keep ? anyModel.filter((row) => row.model === keep) : []
  }
  const projects = await storage.listProjects()
  const note = await storage.latestAnalystNote(region)
  const catalog = await storage.listSeries()
  const load = projectLoadAt(projects, to, process.env.PROJECT_STATUS_MIN)
  const source = observations[0]?.source ?? forecasts[0]?.sourceNotes ?? null
  res.status(200).json({
    series,
    region,
    from,
    to,
    unit: observations[0]?.unit ?? null,
    source,
    sourceUrl: observations[0]?.sourceUrl ?? null,
    observations,
    forecasts,
    projectLoad: load,
    scores: scores.slice(0, 12),
    note,
    catalog,
    statusMin: process.env.PROJECT_STATUS_MIN ?? 'construction',
  })
}

export async function captureHandler(req: Req, res: Res) {
  if (!cronAuthorized(req)) return denyCron(res)
  const ready = await storageOrNull()
  if ('error' in ready) {
    console.error('[capture] ' + ready.error)
    res.status(500).json({ error: ready.error })
    return
  }
  const result = await runCapture({ storage: ready.storage })
  res.status(result.status === 'error' ? 500 : 200).json(result)
}

export async function forecastHandler(req: Req, res: Res) {
  if (!cronAuthorized(req)) return denyCron(res)
  const ready = await storageOrNull()
  if ('error' in ready) {
    console.error('[forecast] ' + ready.error)
    res.status(500).json({ error: ready.error })
    return
  }
  const result = await runForecast({
    storage: ready.storage,
    series: queryValue(req, 'series') ?? undefined,
    region: queryValue(req, 'region') ?? undefined,
  })
  const code = result.status === 'error' ? 500 : 200
  res.status(code).json(result)
}

export async function analystHandler(req: Req, res: Res) {
  if (!cronAuthorized(req)) return denyCron(res)
  const ready = await storageOrNull()
  if ('error' in ready) {
    console.error('[analyst] ' + ready.error)
    res.status(500).json({ error: ready.error })
    return
  }
  const result = await runAnalyst({ storage: ready.storage, apiKey: analystKeyFromEnv() })
  res.status(result.status === 'error' ? 500 : 200).json(result)
}

export async function backfillHandler(req: Req, res: Res) {
  if (!cronAuthorized(req)) return denyCron(res)
  const ready = await storageOrNull()
  if ('error' in ready) {
    console.error('[backfill] ' + ready.error)
    res.status(500).json({ error: ready.error })
    return
  }
  const pages = Number(queryValue(req, 'pages') ?? '1')
  const result = await runBackfillChunk({
    storage: ready.storage,
    apiKey: process.env.EIA_API_KEY,
    pages: Number.isFinite(pages) ? pages : 1,
  })
  res.status(result.status === 'error' ? 500 : 200).json(result)
}
