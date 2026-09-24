import type { Observation, TruthClass } from './types.ts'
import { eiaPeriodToUtc } from './time.ts'

export const EIA_REGION_DATA = 'https://api.eia.gov/v2/electricity/rto/region-data/data/'
export const EIA_FUEL_DATA = 'https://api.eia.gov/v2/electricity/rto/fuel-type-data/data/'

/** Zones EIA uses for these balancing authorities. Unknown codes are refused. */
export const EIA_TIMEZONES: Record<string, string> = {
  CISO: 'America/Los_Angeles',
  BANC: 'America/Los_Angeles',
  LDWP: 'America/Los_Angeles',
  TIDC: 'America/Los_Angeles',
  BPAT: 'America/Los_Angeles',
  PACW: 'America/Los_Angeles',
  NEVP: 'America/Los_Angeles',
  PSEI: 'America/Los_Angeles',
  SCL: 'America/Los_Angeles',
  AVA: 'America/Los_Angeles',
  ERCO: 'America/Chicago',
  MISO: 'America/Chicago',
  SWPP: 'America/Chicago',
  TVA: 'America/Chicago',
  AECI: 'America/Chicago',
  PJM: 'America/New_York',
  NYIS: 'America/New_York',
  ISNE: 'America/New_York',
  FPL: 'America/New_York',
  SOCO: 'America/New_York',
  PACE: 'America/Denver',
  AZPS: 'America/Phoenix',
  SRP: 'America/Phoenix',
  WALC: 'America/Phoenix',
}

export const EIA_REGION_TYPES: { type: string; series: string; truthClass: TruthClass }[] = [
  { type: 'D', series: 'eia_demand_mwh', truthClass: 'reported' },
  { type: 'DF', series: 'eia_demand_forecast_mwh', truthClass: 'estimate' },
  { type: 'NG', series: 'eia_net_generation_mwh', truthClass: 'reported' },
  { type: 'TI', series: 'eia_interchange_mwh', truthClass: 'reported' },
]

export const EIA_FUELS: { fueltype: string; series: string }[] = [
  { fueltype: 'SUN', series: 'eia_gen_sun_mwh' },
  { fueltype: 'WND', series: 'eia_gen_wnd_mwh' },
  { fueltype: 'WAT', series: 'eia_gen_wat_mwh' },
  { fueltype: 'NG', series: 'eia_gen_ng_mwh' },
  { fueltype: 'COL', series: 'eia_gen_col_mwh' },
  { fueltype: 'NUC', series: 'eia_gen_nuc_mwh' },
  { fueltype: 'OIL', series: 'eia_gen_oil_mwh' },
  { fueltype: 'OTH', series: 'eia_gen_oth_mwh' },
]

export interface EiaRow {
  period?: string
  respondent?: string
  value?: string | number | null
  'value-units'?: string
  type?: string
  fueltype?: string
}

export function parseRespondents(raw: string | undefined): string[] {
  const list = (raw ?? 'CISO')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  return list.length ? list : ['CISO']
}

export function timezoneForRespondent(code: string): string {
  const zone = EIA_TIMEZONES[code]
  if (!zone) {
    throw new Error(`No timezone configured for EIA respondent ${code}. Refusing to guess the offset.`)
  }
  return zone
}

export function eiaUrl(args: {
  route: 'region' | 'fuel'
  apiKey: string
  respondent: string
  facet: string
  start: string
  end: string
  offset: number
  length?: number
}): string {
  const base = args.route === 'region' ? EIA_REGION_DATA : EIA_FUEL_DATA
  const facetKey = args.route === 'region' ? 'type' : 'fueltype'
  const params = new URLSearchParams()
  params.set('api_key', args.apiKey)
  params.set('frequency', 'hourly')
  params.append('data[]', 'value')
  params.append('facets[respondent][]', args.respondent)
  params.append(`facets[${facetKey}][]`, args.facet)
  params.set('start', args.start)
  params.set('end', args.end)
  params.append('sort[0][column]', 'period')
  params.append('sort[0][direction]', 'asc')
  params.set('offset', String(args.offset))
  params.set('length', String(args.length ?? 5000))
  return `${base}?${params.toString()}`
}

/** EIA `start`/`end` use local period strings, not UTC. */
export function utcToEiaPeriod(iso: string, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
  })
  const parts = dtf.formatToParts(new Date(iso))
  const map: Record<string, string> = {}
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value
  const hour = String(Number(map.hour) % 24).padStart(2, '0')
  return `${map.year}-${map.month}-${map.day}T${hour}`
}

export function observationsFromEia(args: {
  rows: EiaRow[]
  respondent: string
  series: string
  truthClass: TruthClass
  sourceUrl: string
  retrievedAt: string
}): Observation[] {
  const zone = timezoneForRespondent(args.respondent)
  const out: Observation[] = []
  for (const row of args.rows) {
    if (!row.period || row.value == null || row.value === '') continue
    const value = Number(row.value)
    if (!Number.isFinite(value)) continue
    const ts = eiaPeriodToUtc(row.period, zone)
    if (!ts) continue
    const respondent = (row.respondent ?? args.respondent).toUpperCase()
    if (respondent !== args.respondent) continue
    out.push({
      series: args.series,
      region: args.respondent,
      ts,
      value,
      unit: row['value-units']?.trim() || 'megawatthours',
      truthClass: args.truthClass,
      source: 'EIA Form 930',
      sourceUrl: args.sourceUrl,
      retrievedAt: args.retrievedAt,
    })
  }
  return out
}

export interface EiaPage {
  total: number
  data: EiaRow[]
}

export function parseEiaPage(json: unknown): EiaPage {
  const response = (json as { response?: { total?: string | number; data?: EiaRow[] } }).response
  if (!response || !Array.isArray(response.data)) {
    throw new Error('EIA response is missing response.data')
  }
  const total = Number(response.total ?? response.data.length)
  if (!Number.isFinite(total)) throw new Error('EIA response total is not a number')
  return { total, data: response.data }
}

export const EIA_BACKFILL_START = '2015-07-01T00:00:00.000Z'
