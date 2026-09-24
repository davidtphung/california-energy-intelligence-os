import { csvToObjects, num, parseCsv } from '../lib/csv.ts'
import type { Observation, TruthClass } from './types.ts'
import { caisoStampToUtc, wallTimeToUtc } from './time.ts'

export const CAISO_OUTLOOK_BASE = 'https://www.caiso.com/outlook/current'
export const CAISO_REGION = 'CISO'

const FUEL_SERIES: { column: string; series: string }[] = [
  { column: 'Solar', series: 'gen_solar_mw' },
  { column: 'Wind', series: 'gen_wind_mw' },
  { column: 'Geothermal', series: 'gen_geothermal_mw' },
  { column: 'Biomass', series: 'gen_biomass_mw' },
  { column: 'Biogas', series: 'gen_biogas_mw' },
  { column: 'Small hydro', series: 'gen_small_hydro_mw' },
  { column: 'Large Hydro', series: 'gen_large_hydro_mw' },
  { column: 'Nuclear', series: 'gen_nuclear_mw' },
  { column: 'Natural Gas', series: 'gen_natural_gas_mw' },
  { column: 'Coal', series: 'gen_coal_mw' },
  { column: 'Batteries', series: 'batteries_mw' },
  { column: 'Imports', series: 'imports_mw' },
  { column: 'Other', series: 'gen_other_mw' },
]

export interface CaisoFiles {
  systemStatus: string | null
  demand: string | null
  fuel: string | null
  storage: string | null
  netDemand: string | null
}

export class CaisoParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CaisoParseError'
  }
}

export function operatingDayFromStatus(systemStatus: string): { year: number; month: number; day: number } {
  const rows = parseCsv(systemStatus)
  const demand = rows.find((r) => r[0]?.toLowerCase().includes('current demand'))
  const produced = rows.find((r) => r[0]?.toLowerCase().includes('produced'))
  const stamp = demand?.[2] || produced?.[1]
  if (!stamp) throw new CaisoParseError('CAISO system status has no operating day')
  const parsed = stamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!parsed) throw new CaisoParseError(`CAISO operating day is not a date: ${stamp}`)
  return { month: Number(parsed[1]), day: Number(parsed[2]), year: Number(parsed[3]) }
}

function pushPoint(
  out: Observation[],
  args: {
    series: string
    ts: string | null
    value: number | null
    unit: string
    truthClass: TruthClass
    sourceUrl: string
    retrievedAt: string
  }
) {
  if (args.ts == null || args.value == null) return
  out.push({
    series: args.series,
    region: CAISO_REGION,
    ts: args.ts,
    value: args.value,
    unit: args.unit,
    truthClass: args.truthClass,
    source: 'CAISO Today\'s Outlook',
    sourceUrl: args.sourceUrl,
    retrievedAt: args.retrievedAt,
  })
}

function clockToUtc(
  day: { year: number; month: number; day: number },
  clock: string
): string | null {
  const m = clock.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return wallTimeToUtc(day.year, day.month, day.day, Number(m[1]), Number(m[2]), 'America/Los_Angeles')
}

export function observationsFromCaiso(files: CaisoFiles, retrievedAt: string): Observation[] {
  if (!files.systemStatus && !files.demand && !files.fuel && !files.storage && !files.netDemand) {
    throw new CaisoParseError('CAISO outlook returned no files')
  }
  const out: Observation[] = []
  const day = files.systemStatus ? operatingDayFromStatus(files.systemStatus) : null

  if (files.systemStatus) {
    const rows = parseCsv(files.systemStatus)
    const url = `${CAISO_OUTLOOK_BASE}/systemstatus.csv`
    const find = (needle: string) =>
      rows.find((r) => {
        const label = r[0]?.toLowerCase() ?? ''
        if (!label.includes(needle)) return false
        if (needle === 'forecasted peak' && label.includes('tomorrow')) return false
        return true
      })
    const point = (
      needle: string,
      series: string,
      truthClass: TruthClass
    ) => {
      const row = find(needle)
      if (!row) return
      const stamp = row[2] ? caisoStampToUtc(row[2]) : null
      pushPoint(out, {
        series,
        ts: stamp,
        value: num(row[1]),
        unit: 'MW',
        truthClass,
        sourceUrl: url,
        retrievedAt,
      })
    }
    point('current demand', 'demand_snapshot_mw', 'measured')
    point("today's peak", 'todays_peak_mw', 'measured')
    point('todays peak', 'todays_peak_mw', 'measured')
    point('forecasted peak', 'forecasted_peak_mw', 'estimate')
  }

  if (!day && (files.demand || files.fuel || files.storage || files.netDemand)) {
    throw new CaisoParseError('Refusing intraday CAISO rows without an operating day from system status')
  }

  if (files.demand && day) {
    const url = `${CAISO_OUTLOOK_BASE}/demand.csv`
    for (const row of csvToObjects(files.demand)) {
      const ts = clockToUtc(day, row.Time ?? '')
      pushPoint(out, {
        series: 'demand_mw',
        ts,
        value: num(row['Current demand']),
        unit: 'MW',
        truthClass: 'measured',
        sourceUrl: url,
        retrievedAt,
      })
      pushPoint(out, {
        series: 'demand_day_ahead_mw',
        ts,
        value: num(row['Day ahead forecast']),
        unit: 'MW',
        truthClass: 'estimate',
        sourceUrl: url,
        retrievedAt,
      })
      pushPoint(out, {
        series: 'demand_hour_ahead_mw',
        ts,
        value: num(row['Hour ahead forecast']),
        unit: 'MW',
        truthClass: 'estimate',
        sourceUrl: url,
        retrievedAt,
      })
    }
  }

  if (files.fuel && day) {
    const url = `${CAISO_OUTLOOK_BASE}/fuelsource.csv`
    for (const row of csvToObjects(files.fuel)) {
      const ts = clockToUtc(day, row.Time ?? '')
      for (const col of FUEL_SERIES) {
        pushPoint(out, {
          series: col.series,
          ts,
          value: num(row[col.column]),
          unit: 'MW',
          truthClass: 'measured',
          sourceUrl: url,
          retrievedAt,
        })
      }
    }
  }

  if (files.storage && day) {
    const url = `${CAISO_OUTLOOK_BASE}/storage.csv`
    for (const row of csvToObjects(files.storage)) {
      const ts = clockToUtc(day, row.Time ?? '')
      pushPoint(out, {
        series: 'batteries_total_mw',
        ts,
        value: num(row['Total batteries']),
        unit: 'MW',
        truthClass: 'measured',
        sourceUrl: url,
        retrievedAt,
      })
    }
  }

  if (files.netDemand && day) {
    const url = `${CAISO_OUTLOOK_BASE}/netdemand.csv`
    for (const row of csvToObjects(files.netDemand)) {
      const ts = clockToUtc(day, row.Time ?? '')
      pushPoint(out, {
        series: 'net_demand_mw',
        ts,
        value: num(row['Net demand']),
        unit: 'MW',
        truthClass: 'measured',
        sourceUrl: url,
        retrievedAt,
      })
    }
  }

  return out
}

export function observationsFromOpenMeteo(
  json: {
    current?: {
      time?: string
      temperature_2m?: number
      wind_speed_10m?: number
      shortwave_radiation?: number
    }
  },
  retrievedAt: string,
  sourceUrl: string
): Observation[] {
  const cur = json.current
  if (!cur?.time) return []
  const ts = new Date(cur.time).toISOString()
  const specs: { series: string; value: number | undefined; unit: string }[] = [
    { series: 'weather_temp_c', value: cur.temperature_2m, unit: 'C' },
    { series: 'weather_wind_kmh', value: cur.wind_speed_10m, unit: 'km/h' },
    { series: 'weather_solar_wm2', value: cur.shortwave_radiation, unit: 'W/m2' },
  ]
  const out: Observation[] = []
  for (const spec of specs) {
    if (spec.value == null || !Number.isFinite(spec.value)) continue
    out.push({
      series: spec.series,
      region: CAISO_REGION,
      ts,
      value: spec.value,
      unit: spec.unit,
      truthClass: 'reported',
      source: 'Open-Meteo',
      sourceUrl,
      retrievedAt,
    })
  }
  return out
}
