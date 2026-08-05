/**
 * Live multi-source California grid data.
 * CAISO Today's Outlook CSVs via same-origin proxy (/api/live/caiso/*).
 * Open-Meteo for CA weather context (browser CORS OK).
 * EIA optional via VITE_EIA_API_KEY.
 */

import { csvToObjects, latestWithValues, num, parseCsv } from '../lib/csv'

export type SourceHealth = 'ok' | 'error' | 'stale' | 'skipped'

export interface SourceStatus {
  id: string
  name: string
  organization: string
  url: string
  status: SourceHealth
  latencyMs?: number
  message?: string
  fetchedAt?: string
  records?: number
}

export interface CaisoLiveSnapshot {
  asOf: string
  produced?: string
  currentDemandMw: number | null
  todaysPeakMw: number | null
  forecastedPeakMw: number | null
  tomorrowPeakMw: number | null
  hourAheadMw: number | null
  dayAheadMw: number | null
  netDemandMw: number | null
  fuel: {
    solar: number
    wind: number
    geothermal: number
    biomass: number
    biogas: number
    smallHydro: number
    largeHydro: number
    nuclear: number
    naturalGas: number
    coal: number
    batteries: number
    imports: number
    other: number
    time: string
  } | null
  storage: {
    total: number
    standalone: number
    hybrid: number
    time: string
  } | null
  renewables: {
    solar: number
    wind: number
    geothermal: number
    biomass: number
    biogas: number
    smallHydro: number
    time: string
  } | null
  co2: {
    naturalGas: number
    imports: number
    biogas: number
    biomass: number
    coal: number
    geothermal: number
    total: number
    time: string
  } | null
  series: {
    demand: { time: string; current: number | null; dayAhead: number | null; hourAhead: number | null }[]
    fuel: {
      time: string
      solar: number
      wind: number
      gas: number
      coal: number
      hydro: number
      nuclear: number
      geothermal: number
      biomass: number
      biogas: number
      batteries: number
      imports: number
      other: number
    }[]
  }
}

export interface WeatherSnapshot {
  asOf: string
  tempC: number
  windKmh: number
  solarWm2: number
  location: string
}

export interface LiveBundle {
  fetchedAt: string
  caiso: CaisoLiveSnapshot | null
  weather: WeatherSnapshot | null
  eia: { note: string; series?: { period: string; value: number }[] } | null
  sources: SourceStatus[]
}

const CAISO_BASE = '/api/live/caiso'

async function fetchText(url: string, timeoutMs = 12000): Promise<{ text: string; ms: number }> {
  const t0 = performance.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'text/csv,application/json,*/*' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    return { text, ms: Math.round(performance.now() - t0) }
  } finally {
    clearTimeout(timer)
  }
}

function parseSystemStatus(text: string): Partial<CaisoLiveSnapshot> {
  const rows = parseCsv(text)
  const map = new Map<string, string[]>()
  for (const r of rows) {
    if (r[0]) map.set(r[0].toLowerCase(), r)
  }
  const get = (key: string) => {
    for (const [k, v] of map) {
      if (k.includes(key)) return v
    }
    return undefined
  }
  const produced = get('produced')?.[1]
  const demand = get('current demand')
  const peak = get("today's peak") ?? get('todays peak')
  const fpeak = get('forecasted peak')
  const tpeak = get("tomorrow")

  return {
    produced,
    asOf: demand?.[2] || produced || new Date().toISOString(),
    currentDemandMw: num(demand?.[1]),
    todaysPeakMw: num(peak?.[1]),
    forecastedPeakMw: num(fpeak?.[1]),
    tomorrowPeakMw: num(tpeak?.[1]),
  }
}

function parseDemand(text: string) {
  const rows = csvToObjects(text)
  const series = rows.map((r) => ({
    time: r.Time ?? r.time ?? '',
    current: num(r['Current demand']),
    dayAhead: num(r['Day ahead forecast']),
    hourAhead: num(r['Hour ahead forecast']),
  }))
  const latest = latestWithValues(rows, ['Current demand'])
  return {
    series,
    latestCurrent: num(latest?.['Current demand']),
    latestHourAhead: num(latest?.['Hour ahead forecast']),
    latestDayAhead: num(latest?.['Day ahead forecast']),
    latestTime: latest?.Time ?? null,
    records: rows.length,
  }
}

function parseFuel(text: string) {
  const rows = csvToObjects(text)
  const latest = latestWithValues(rows, ['Solar', 'Natural Gas', 'Wind'])
  if (!latest) return { fuel: null, series: [], records: rows.length }
  const fuel = {
    solar: num(latest.Solar) ?? 0,
    wind: num(latest.Wind) ?? 0,
    geothermal: num(latest.Geothermal) ?? 0,
    biomass: num(latest.Biomass) ?? 0,
    biogas: num(latest.Biogas) ?? 0,
    smallHydro: num(latest['Small hydro']) ?? 0,
    largeHydro: num(latest['Large Hydro']) ?? 0,
    nuclear: num(latest.Nuclear) ?? 0,
    naturalGas: num(latest['Natural Gas']) ?? 0,
    coal: num(latest.Coal) ?? 0,
    batteries: num(latest.Batteries) ?? 0,
    imports: num(latest.Imports) ?? 0,
    other: num(latest.Other) ?? 0,
    time: latest.Time ?? '',
  }
  const series = rows
    .filter((r) => num(r.Solar) != null || num(r['Natural Gas']) != null)
    .map((r) => ({
      time: r.Time ?? '',
      solar: num(r.Solar) ?? 0,
      wind: num(r.Wind) ?? 0,
      gas: num(r['Natural Gas']) ?? 0,
      coal: num(r.Coal) ?? 0,
      hydro: (num(r['Large Hydro']) ?? 0) + (num(r['Small hydro']) ?? 0),
      nuclear: num(r.Nuclear) ?? 0,
      geothermal: num(r.Geothermal) ?? 0,
      biomass: num(r.Biomass) ?? 0,
      biogas: num(r.Biogas) ?? 0,
      batteries: num(r.Batteries) ?? 0,
      imports: num(r.Imports) ?? 0,
      other: num(r.Other) ?? 0,
    }))
  return { fuel, series, records: rows.length }
}

function parseStorage(text: string) {
  const rows = csvToObjects(text)
  const latest = latestWithValues(rows, ['Total batteries'])
  if (!latest) return { storage: null, records: rows.length }
  return {
    storage: {
      total: num(latest['Total batteries']) ?? 0,
      standalone: num(latest['Stand-alone batteries']) ?? 0,
      hybrid: num(latest['Hybrid batteries']) ?? 0,
      time: latest.Time ?? '',
    },
    records: rows.length,
  }
}

function parseRenewables(text: string) {
  const rows = csvToObjects(text)
  const latest = latestWithValues(rows, ['Solar', 'Wind'])
  if (!latest) return { renewables: null, records: rows.length }
  return {
    renewables: {
      solar: num(latest.Solar) ?? 0,
      wind: num(latest.Wind) ?? 0,
      geothermal: num(latest.Geothermal) ?? 0,
      biomass: num(latest.Biomass) ?? 0,
      biogas: num(latest.Biogas) ?? 0,
      smallHydro: num(latest['Small hydro']) ?? 0,
      time: latest.Time ?? '',
    },
    records: rows.length,
  }
}

function parseCo2(text: string) {
  const rows = csvToObjects(text)
  const latest = latestWithValues(rows, ['Natural Gas CO2', 'Imports CO2'])
  if (!latest) return { co2: null, records: rows.length }
  const naturalGas = num(latest['Natural Gas CO2']) ?? 0
  const imports = num(latest['Imports CO2']) ?? 0
  const biogas = num(latest['Biogas CO2']) ?? 0
  const biomass = num(latest['Biomass CO2']) ?? 0
  const coal = num(latest['Coal CO2']) ?? 0
  const geothermal = num(latest['Geothermal CO2']) ?? 0
  return {
    co2: {
      naturalGas,
      imports,
      biogas,
      biomass,
      coal,
      geothermal,
      total: naturalGas + imports + biogas + biomass + coal + geothermal,
      time: latest.Time ?? '',
    },
    records: rows.length,
  }
}

function parseNetDemand(text: string) {
  const rows = csvToObjects(text)
  const latest = latestWithValues(rows, ['Net demand', 'Current demand'])
  return {
    netDemandMw: num(latest?.['Net demand']) ?? num(latest?.['Current demand']),
    records: rows.length,
  }
}

async function fetchCaisoFile(
  file: string,
  sources: SourceStatus[]
): Promise<string | null> {
  const id = `caiso-${file}`
  const url = `${CAISO_BASE}/${file}.csv`
  try {
    const { text, ms } = await fetchText(url)
    if (text.includes('<html') || text.includes('404')) {
      throw new Error('Not found or HTML error page')
    }
    sources.push({
      id,
      name: `CAISO ${file}`,
      organization: 'CAISO',
      url: `https://www.caiso.com/outlook/current/${file}.csv`,
      status: 'ok',
      latencyMs: ms,
      fetchedAt: new Date().toISOString(),
      records: text.split(/\n/).length - 1,
      message: `${ms}ms`,
    })
    return text
  } catch (e) {
    sources.push({
      id,
      name: `CAISO ${file}`,
      organization: 'CAISO',
      url: `https://www.caiso.com/outlook/current/${file}.csv`,
      status: 'error',
      message: e instanceof Error ? e.message : 'Failed',
      fetchedAt: new Date().toISOString(),
    })
    return null
  }
}

async function fetchWeather(sources: SourceStatus[]): Promise<WeatherSnapshot | null> {
  // Central Valley / CAISO-ish centroid
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=37.0&longitude=-120.0&current=temperature_2m,wind_speed_10m,shortwave_radiation&timezone=America%2FLos_Angeles'
  try {
    const { text, ms } = await fetchText(url)
    const json = JSON.parse(text) as {
      current: {
        time: string
        temperature_2m: number
        wind_speed_10m: number
        shortwave_radiation: number
      }
    }
    sources.push({
      id: 'open-meteo-ca',
      name: 'Open-Meteo CA weather',
      organization: 'Open-Meteo',
      url,
      status: 'ok',
      latencyMs: ms,
      fetchedAt: new Date().toISOString(),
      message: `${ms}ms · Central Valley proxy`,
    })
    return {
      asOf: json.current.time,
      tempC: json.current.temperature_2m,
      windKmh: json.current.wind_speed_10m,
      solarWm2: json.current.shortwave_radiation,
      location: 'Central Valley (37°N, 120°W)',
    }
  } catch (e) {
    sources.push({
      id: 'open-meteo-ca',
      name: 'Open-Meteo CA weather',
      organization: 'Open-Meteo',
      url,
      status: 'error',
      message: e instanceof Error ? e.message : 'Failed',
      fetchedAt: new Date().toISOString(),
    })
    return null
  }
}

async function fetchEia(sources: SourceStatus[]) {
  const key = import.meta.env.VITE_EIA_API_KEY as string | undefined
  const base =
    'https://api.eia.gov/v2/electricity/rto/region-data/data/?frequency=hourly&data[0]=value&facets[respondent][]=CISO&facets[type][]=D&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=24'
  if (!key) {
    sources.push({
      id: 'eia-ciso',
      name: 'EIA CISO demand (hourly)',
      organization: 'EIA',
      url: 'https://www.eia.gov/opendata/',
      status: 'skipped',
      message: 'Set VITE_EIA_API_KEY for live EIA pulls',
      fetchedAt: new Date().toISOString(),
    })
    return {
      note: 'Optional - add VITE_EIA_API_KEY to enable EIA Open Data for CISO hourly demand.',
    }
  }
  const url = `${base}&api_key=${encodeURIComponent(key)}`
  try {
    const { text, ms } = await fetchText(url)
    const json = JSON.parse(text) as {
      response?: { data?: { period: string; value: number }[] }
    }
    const series = (json.response?.data ?? []).map((d) => ({
      period: d.period,
      value: Number(d.value),
    }))
    sources.push({
      id: 'eia-ciso',
      name: 'EIA CISO demand (hourly)',
      organization: 'EIA',
      url: 'https://www.eia.gov/opendata/',
      status: 'ok',
      latencyMs: ms,
      records: series.length,
      fetchedAt: new Date().toISOString(),
      message: `${series.length} hours`,
    })
    return { note: 'EIA Open Data · CISO demand', series }
  } catch (e) {
    sources.push({
      id: 'eia-ciso',
      name: 'EIA CISO demand (hourly)',
      organization: 'EIA',
      url: 'https://www.eia.gov/opendata/',
      status: 'error',
      message: e instanceof Error ? e.message : 'Failed',
      fetchedAt: new Date().toISOString(),
    })
    return { note: 'EIA fetch failed' }
  }
}

export async function fetchAllLiveSources(): Promise<LiveBundle> {
  const sources: SourceStatus[] = []
  const fetchedAt = new Date().toISOString()

  const [statusTxt, demandTxt, fuelTxt, storageTxt, renTxt, co2Txt, netTxt, weather, eia] =
    await Promise.all([
      fetchCaisoFile('systemstatus', sources),
      fetchCaisoFile('demand', sources),
      fetchCaisoFile('fuelsource', sources),
      fetchCaisoFile('storage', sources),
      fetchCaisoFile('renewables', sources),
      fetchCaisoFile('co2', sources),
      fetchCaisoFile('netdemand', sources),
      fetchWeather(sources),
      fetchEia(sources),
    ])

  // Static catalog entries for sources that need accounts / bulk downloads
  sources.push(
    {
      id: 'cec-iepr',
      name: 'CEC IEPR demand forecast',
      organization: 'CEC',
      url: 'https://www.energy.ca.gov/data-reports/reports/integrated-energy-policy-report',
      status: 'skipped',
      message: 'Annual/biennial reports - not a live feed',
      fetchedAt,
    },
    {
      id: 'caiso-oasis',
      name: 'CAISO OASIS market API',
      organization: 'CAISO',
      url: 'https://oasis.caiso.com/',
      status: 'skipped',
      message: 'Zip/XML market reports - wire via backend job for LMP/ATC',
      fetchedAt,
    },
    {
      id: 'cpuc-ra',
      name: 'CPUC resource adequacy',
      organization: 'CPUC',
      url: 'https://www.cpuc.ca.gov/',
      status: 'skipped',
      message: 'Filings / proceedings - research workspace',
      fetchedAt,
    }
  )

  let caiso: CaisoLiveSnapshot | null = null

  if (statusTxt || demandTxt || fuelTxt) {
    const status = statusTxt ? parseSystemStatus(statusTxt) : {}
    const demand = demandTxt
      ? parseDemand(demandTxt)
      : { series: [], latestCurrent: null, latestHourAhead: null, latestDayAhead: null, latestTime: null, records: 0 }
    const fuel = fuelTxt ? parseFuel(fuelTxt) : { fuel: null, series: [], records: 0 }
    const storage = storageTxt ? parseStorage(storageTxt) : { storage: null, records: 0 }
    const ren = renTxt ? parseRenewables(renTxt) : { renewables: null, records: 0 }
    const co2 = co2Txt ? parseCo2(co2Txt) : { co2: null, records: 0 }
    const net = netTxt ? parseNetDemand(netTxt) : { netDemandMw: null, records: 0 }

    // Prefer systemstatus (matches Today's Outlook card); series still used for charts
    const currentDemandMw = status.currentDemandMw ?? demand.latestCurrent ?? null

    caiso = {
      asOf:
        status.asOf ||
        (demand.latestTime ? `Today ${demand.latestTime} PT` : fetchedAt),
      produced: status.produced,
      currentDemandMw,
      todaysPeakMw: status.todaysPeakMw ?? null,
      forecastedPeakMw: status.forecastedPeakMw ?? null,
      tomorrowPeakMw: status.tomorrowPeakMw ?? null,
      hourAheadMw: demand.latestHourAhead,
      dayAheadMw: demand.latestDayAhead,
      netDemandMw: net.netDemandMw,
      fuel: fuel.fuel,
      storage: storage.storage,
      renewables: ren.renewables,
      co2: co2.co2,
      series: {
        demand: demand.series.filter((s) => s.time),
        fuel: fuel.series,
      },
    }
  }

  // Sort sources: ok first, then skipped, then error
  const order = { ok: 0, stale: 1, skipped: 2, error: 3 }
  sources.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name))

  return { fetchedAt, caiso, weather, eia, sources }
}

export function cleanShareFromFuel(fuel: NonNullable<CaisoLiveSnapshot['fuel']>): number {
  const clean =
    fuel.solar +
    fuel.wind +
    fuel.geothermal +
    fuel.biomass +
    fuel.biogas +
    fuel.smallHydro +
    fuel.largeHydro +
    fuel.nuclear
  // Batteries are energy-shifting; imports ambiguous - exclude from clean calc
  const total = clean + fuel.naturalGas + fuel.coal + Math.max(0, fuel.other) + Math.max(0, fuel.imports)
  if (total <= 0) return 0
  return Math.round((clean / total) * 1000) / 10
}
