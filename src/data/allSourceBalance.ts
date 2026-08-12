/**
 * Multi-source US energy balance: production, demand, and deficits
 * for every major fuel / generation class — not just natural gas.
 *
 * Demand drivers: AI / data centers, population growth, industrial manufacturing.
 * Sample educational path (not IRP / EIA AEO official case).
 */

import { US_STATES, type USStateEnergy } from './usStates'
import {
  DEMAND_YEARS,
  projectStateDemand,
  type DemandYear,
} from './demandForecast'

export const SOURCE_YEARS = [2025, 2027, 2030, 2032, 2035, 2040] as const
export type SourceYear = (typeof SOURCE_YEARS)[number]

export type EnergySourceId =
  | 'gas'
  | 'coal'
  | 'nuclear'
  | 'oil'
  | 'solar'
  | 'wind'
  | 'hydro'
  | 'battery'
  | 'geothermal'
  | 'biomass'
  | 'all'

export type BalanceMetric = 'production' | 'demand' | 'deficit' | 'surplus' | 'balance'

export interface SourceMeta {
  id: Exclude<EnergySourceId, 'all'>
  label: string
  short: string
  unit: string
  color: string
  colorDark: string
  /** Firm capacity factor for deficit math (nameplate → firm) */
  firmCf: number
  note: string
}

export const SOURCE_META: SourceMeta[] = [
  {
    id: 'gas',
    label: 'Natural gas',
    short: 'Gas',
    unit: 'GW',
    color: '#ea580c',
    colorDark: '#fb923c',
    firmCf: 0.88,
    note: 'Power + industrial heat proxy. Backbone for AI peak and flexible load.',
  },
  {
    id: 'coal',
    label: 'Coal',
    short: 'Coal',
    unit: 'GW',
    color: '#57534e',
    colorDark: '#a8a29e',
    firmCf: 0.75,
    note: 'Retiring fleet; residual baseload in Midwest / Appalachia / Rockies.',
  },
  {
    id: 'nuclear',
    label: 'Nuclear',
    short: 'Nuclear',
    unit: 'GW',
    color: '#7c3aed',
    colorDark: '#a78bfa',
    firmCf: 0.92,
    note: 'Firm clean baseload; limited new builds until late decade / 2030s.',
  },
  {
    id: 'oil',
    label: 'Oil / distillate',
    short: 'Oil',
    unit: 'GW',
    color: '#0f766e',
    colorDark: '#2dd4bf',
    firmCf: 0.7,
    note: 'Island and residual peaker / industrial oil. Small lower-48 power share.',
  },
  {
    id: 'solar',
    label: 'Solar PV',
    short: 'Solar',
    unit: 'GW',
    color: '#ca8a04',
    colorDark: '#facc15',
    firmCf: 0.22,
    note: 'Fastest capacity growth; firm contribution low without storage.',
  },
  {
    id: 'wind',
    label: 'Wind',
    short: 'Wind',
    unit: 'GW',
    color: '#0284c7',
    colorDark: '#38bdf8',
    firmCf: 0.35,
    note: 'Plains / ERCOT / Midwest growth; seasonal and diurnal variability.',
  },
  {
    id: 'hydro',
    label: 'Hydro',
    short: 'Hydro',
    unit: 'GW',
    color: '#0369a1',
    colorDark: '#7dd3fc',
    firmCf: 0.45,
    note: 'Mostly fixed fleet; drought risk in West; PNW export backbone.',
  },
  {
    id: 'battery',
    label: 'Battery storage',
    short: 'Battery',
    unit: 'GW',
    color: '#16a34a',
    colorDark: '#4ade80',
    firmCf: 0.55,
    note: 'Peak firming and solar shift; duration-limited (not seasonal energy).',
  },
  {
    id: 'geothermal',
    label: 'Geothermal',
    short: 'Geo',
    unit: 'GW',
    color: '#b45309',
    colorDark: '#fbbf24',
    firmCf: 0.85,
    note: 'West-concentrated firm renewable; slow build.',
  },
  {
    id: 'biomass',
    label: 'Biomass / biogas',
    short: 'Bio',
    unit: 'GW',
    color: '#65a30d',
    colorDark: '#a3e635',
    firmCf: 0.7,
    note: 'Small baseload and industrial steam / power.',
  },
]

export function sourceMeta(id: Exclude<EnergySourceId, 'all'>): SourceMeta {
  return SOURCE_META.find((s) => s.id === id)!
}

export function sourceColor(id: EnergySourceId, dark: boolean): string {
  if (id === 'all') return dark ? '#86efac' : '#15803d'
  const m = sourceMeta(id)
  return dark ? m.colorDark : m.color
}

/** Nameplate capacity by source in base year from state catalog + small residuals */
function baseNameplate(s: USStateEnergy, id: Exclude<EnergySourceId, 'all'>): number {
  switch (id) {
    case 'gas':
      return s.gasGw
    case 'coal':
      return s.coalGw
    case 'nuclear':
      return s.nuclearGw
    case 'solar':
      return s.solarGw
    case 'wind':
      return s.windGw
    case 'hydro':
      return s.hydroGw
    case 'battery':
      return s.storageGw
    case 'oil': {
      // Island / residual oil fleets
      if (['HI', 'PR', 'GU', 'VI', 'AS', 'MP', 'AK'].includes(s.abbr)) {
        return Math.max(0.05, s.capacityGw * 0.35)
      }
      return Math.max(0, s.capacityGw * 0.01)
    }
    case 'geothermal': {
      const hot: Record<string, number> = {
        CA: 2.7,
        NV: 0.8,
        UT: 0.1,
        OR: 0.03,
        ID: 0.02,
        NM: 0.02,
        HI: 0.04,
      }
      return hot[s.abbr] ?? 0
    }
    case 'biomass': {
      const bio: Record<string, number> = {
        CA: 1.0,
        FL: 0.6,
        GA: 0.5,
        ME: 0.4,
        VA: 0.35,
        NC: 0.3,
        AL: 0.25,
        LA: 0.2,
        WA: 0.25,
        OR: 0.2,
        NY: 0.2,
        MI: 0.25,
        WI: 0.2,
      }
      return bio[s.abbr] ?? Math.min(0.15, s.capacityGw * 0.01)
    }
  }
}

/**
 * Nameplate growth multipliers by source (national sample path).
 * Coal declines; solar/wind/battery rise hard; nuclear flat then slight up.
 */
function nameplateMult(id: Exclude<EnergySourceId, 'all'>, year: SourceYear): number {
  const t = year - 2025
  const map: Record<Exclude<EnergySourceId, 'all'>, number> = {
    gas: 1 + 0.022 * t, // AI-driven gas peakers / CCGTs
    coal: Math.max(0.25, 1 - 0.055 * t),
    nuclear: year >= 2032 ? 1 + 0.008 * (year - 2030) : 1.0,
    oil: Math.max(0.55, 1 - 0.03 * t),
    solar: 1 + 0.14 * t + 0.008 * t * t,
    wind: 1 + 0.08 * t + 0.003 * t * t,
    hydro: 1 + 0.004 * t,
    battery: 1 + 0.22 * t + 0.012 * t * t,
    geothermal: 1 + 0.025 * t,
    biomass: 1 + 0.01 * t,
  }
  return map[id]
}

/** State-specific boosts (resource corridors) */
function stateGrowthBoost(s: USStateEnergy, id: Exclude<EnergySourceId, 'all'>): number {
  if (id === 'solar') {
    if (['TX', 'CA', 'AZ', 'NV', 'FL', 'NC', 'GA'].includes(s.abbr)) return 1.25
    if (['NM', 'CO', 'UT', 'SC'].includes(s.abbr)) return 1.12
  }
  if (id === 'wind') {
    if (['TX', 'IA', 'OK', 'KS', 'ND', 'SD', 'NE'].includes(s.abbr)) return 1.2
    if (['IL', 'MN', 'CO', 'WY', 'NM'].includes(s.abbr)) return 1.1
  }
  if (id === 'battery') {
    if (['CA', 'TX', 'AZ', 'NV'].includes(s.abbr)) return 1.35
  }
  if (id === 'gas') {
    if (['VA', 'TX', 'GA', 'OH', 'PA', 'LA'].includes(s.abbr)) return 1.15
  }
  if (id === 'coal' && ['WV', 'WY', 'KY', 'IN', 'ND'].includes(s.abbr)) return 0.92
  if (id === 'nuclear' && ['GA', 'SC', 'TN', 'IL', 'PA'].includes(s.abbr)) return 1.05
  return 1
}

export interface SourceSlice {
  productionGw: number
  firmGw: number
  demandGw: number
  deficitGw: number
  surplusGw: number
  /** TWh-ish annual energy proxy */
  productionTwh: number
  demandTwh: number
}

export interface StateSourceBalance {
  abbr: string
  name: string
  region: string
  lon: number
  lat: number
  year: SourceYear
  /** Demand drivers (from demand stack) */
  aiPeakGw: number
  popPeakGw: number
  indPeakGw: number
  totalDemandPeakGw: number
  bySource: Record<Exclude<EnergySourceId, 'all'>, SourceSlice>
  /** Aggregate firm vs total demand */
  totalFirmGw: number
  totalDeficitGw: number
  totalSurplusGw: number
  status: 'surplus' | 'tight' | 'deficit' | 'critical'
  note: string
}

export interface NationalSourceRow {
  year: SourceYear
  bySource: Record<
    Exclude<EnergySourceId, 'all'>,
    SourceSlice & { statesDeficit: number }
  >
  aiPeakGw: number
  popPeakGw: number
  indPeakGw: number
  totalDemandPeakGw: number
  totalFirmGw: number
  totalDeficitGw: number
  summary: string
}

function nearestDemandYear(year: SourceYear): DemandYear {
  const years = [...DEMAND_YEARS]
  let best = years[0]
  let bestD = Math.abs(year - best)
  for (const y of years) {
    const d = Math.abs(year - y)
    if (d < bestD) {
      best = y
      bestD = d
    }
  }
  return best
}

/**
 * Allocate state peak demand across sources using fleet mix + driver bias.
 * AI prefers firm (gas, nuclear, battery) and clean nameplate; industrial prefers gas/coal.
 */
function allocateDemand(
  s: USStateEnergy,
  year: SourceYear,
  totalPeak: number,
  ai: number,
  pop: number,
  ind: number
): Record<Exclude<EnergySourceId, 'all'>, number> {
  const ids = SOURCE_META.map((m) => m.id)
  const nameplates: Record<string, number> = {}
  let sumNp = 0
  for (const id of ids) {
    const np = baseNameplate(s, id) * nameplateMult(id, year) * stateGrowthBoost(s, id)
    nameplates[id] = Math.max(0.001, np)
    sumNp += nameplates[id]
  }

  // Base weights from nameplate share
  const w: Record<string, number> = {}
  for (const id of ids) w[id] = nameplates[id] / sumNp

  // AI tilt: gas, nuclear, battery, solar(+battery system)
  const aiShare = totalPeak > 0 ? ai / totalPeak : 0
  w.gas += 0.18 * aiShare
  w.nuclear += 0.12 * aiShare
  w.battery += 0.14 * aiShare
  w.solar += 0.08 * aiShare
  w.coal -= 0.06 * aiShare
  w.oil -= 0.02 * aiShare

  // Population tilt: follow clean-ish mix + gas peak
  const popShare = totalPeak > 0 ? pop / totalPeak : 0
  w.gas += 0.08 * popShare
  w.solar += 0.06 * popShare
  w.wind += 0.04 * popShare
  w.battery += 0.05 * popShare

  // Industrial tilt: gas + residual coal + nuclear process
  const indShare = totalPeak > 0 ? ind / totalPeak : 0
  w.gas += 0.2 * indShare
  w.coal += 0.08 * indShare
  w.nuclear += 0.05 * indShare
  w.biomass += 0.03 * indShare

  // Normalize positive
  let sum = 0
  for (const id of ids) {
    w[id] = Math.max(0.002, w[id])
    sum += w[id]
  }
  const out = {} as Record<Exclude<EnergySourceId, 'all'>, number>
  for (const id of ids) {
    out[id] = +((totalPeak * w[id]) / sum).toFixed(3)
  }
  return out
}

export function projectStateSources(s: USStateEnergy, year: SourceYear): StateSourceBalance {
  const dy = nearestDemandYear(year)
  const dem = projectStateDemand(s, dy)
  // Scale demand if year beyond 2035 sample
  const scale = year <= 2035 ? 1 : 1 + 0.035 * (year - 2035)
  const aiPeakGw = +(dem.aiPeakGw * scale).toFixed(2)
  const popPeakGw = +(dem.popPeakGw * scale).toFixed(2)
  const indPeakGw = +(dem.indPeakGw * scale).toFixed(2)
  // Total peak demand: catalog peak grown + driver adds
  const basePeak = s.peakGw * (1 + 0.01 * (year - 2025) * scale)
  const totalDemandPeakGw = +(
    basePeak * 0.55 +
    aiPeakGw +
    popPeakGw +
    indPeakGw * 0.45 +
    s.peakGw * 0.35 * (1 + 0.008 * (year - 2025))
  ).toFixed(2)

  const demandBy = allocateDemand(s, year, totalDemandPeakGw, aiPeakGw, popPeakGw, indPeakGw)
  const bySource = {} as Record<Exclude<EnergySourceId, 'all'>, SourceSlice>
  let totalFirmGw = 0
  let totalDeficitGw = 0
  let totalSurplusGw = 0

  for (const m of SOURCE_META) {
    const id = m.id
    const productionGw = +(
      baseNameplate(s, id) *
      nameplateMult(id, year) *
      stateGrowthBoost(s, id)
    ).toFixed(3)
    const firmGw = +(productionGw * m.firmCf).toFixed(3)
    const demandGw = demandBy[id]
    const deficitGw = +Math.max(0, demandGw - firmGw).toFixed(3)
    const surplusGw = +Math.max(0, firmGw - demandGw).toFixed(3)
    // rough CF for TWh
    const energyCf = Math.min(0.9, m.firmCf * 0.95)
    bySource[id] = {
      productionGw,
      firmGw,
      demandGw,
      deficitGw,
      surplusGw,
      productionTwh: +(productionGw * 8.76 * energyCf).toFixed(1),
      demandTwh: +(demandGw * 8.76 * 0.55).toFixed(1),
    }
    totalFirmGw += firmGw
    totalDeficitGw += deficitGw
    totalSurplusGw += surplusGw
  }

  totalFirmGw = +totalFirmGw.toFixed(2)
  totalDeficitGw = +totalDeficitGw.toFixed(2)
  totalSurplusGw = +totalSurplusGw.toFixed(2)

  // System-level status uses aggregate firm vs total demand
  const gap = totalDemandPeakGw - totalFirmGw
  let status: StateSourceBalance['status'] = 'surplus'
  if (gap > totalDemandPeakGw * 0.15) status = 'critical'
  else if (gap > 0.5) status = 'deficit'
  else if (gap > -totalDemandPeakGw * 0.05) status = 'tight'

  let note = s.note
  if (aiPeakGw > 2) note = `AI / DC corridor: ${aiPeakGw.toFixed(1)} GW peak stack drives firm need.`
  else if (indPeakGw > 1.5) note = `Industrial load ${indPeakGw.toFixed(1)} GW: gas and process power pressure.`
  else if (bySource.coal.deficitGw > 1) note = 'Coal exit vs residual demand creates local firm gaps.'

  return {
    abbr: s.abbr,
    name: s.name,
    region: s.region,
    lon: s.lon,
    lat: s.lat,
    year,
    aiPeakGw,
    popPeakGw,
    indPeakGw,
    totalDemandPeakGw,
    bySource,
    totalFirmGw,
    totalDeficitGw,
    totalSurplusGw,
    status,
    note,
  }
}

export function balancesForYear(year: SourceYear, states = US_STATES): StateSourceBalance[] {
  return states.map((s) => projectStateSources(s, year)).sort((a, b) => b.totalDeficitGw - a.totalDeficitGw)
}

export function nationalSources(year: SourceYear, states = US_STATES): NationalSourceRow {
  const rows = balancesForYear(year, states)
  const bySource = {} as NationalSourceRow['bySource']
  for (const m of SOURCE_META) {
    const id = m.id
    let productionGw = 0
    let firmGw = 0
    let demandGw = 0
    let deficitGw = 0
    let surplusGw = 0
    let productionTwh = 0
    let demandTwh = 0
    let statesDeficit = 0
    for (const r of rows) {
      const sl = r.bySource[id]
      productionGw += sl.productionGw
      firmGw += sl.firmGw
      demandGw += sl.demandGw
      deficitGw += sl.deficitGw
      surplusGw += sl.surplusGw
      productionTwh += sl.productionTwh
      demandTwh += sl.demandTwh
      if (sl.deficitGw > 0.25) statesDeficit++
    }
    bySource[id] = {
      productionGw: +productionGw.toFixed(1),
      firmGw: +firmGw.toFixed(1),
      demandGw: +demandGw.toFixed(1),
      deficitGw: +deficitGw.toFixed(1),
      surplusGw: +surplusGw.toFixed(1),
      productionTwh: +productionTwh.toFixed(0),
      demandTwh: +demandTwh.toFixed(0),
      statesDeficit,
    }
  }

  const aiPeakGw = +rows.reduce((a, r) => a + r.aiPeakGw, 0).toFixed(1)
  const popPeakGw = +rows.reduce((a, r) => a + r.popPeakGw, 0).toFixed(1)
  const indPeakGw = +rows.reduce((a, r) => a + r.indPeakGw, 0).toFixed(1)
  const totalDemandPeakGw = +rows.reduce((a, r) => a + r.totalDemandPeakGw, 0).toFixed(1)
  const totalFirmGw = +rows.reduce((a, r) => a + r.totalFirmGw, 0).toFixed(1)
  const totalDeficitGw = +rows.reduce((a, r) => a + r.totalDeficitGw, 0).toFixed(1)

  const topDef = [...SOURCE_META]
    .map((m) => ({ id: m.id, d: bySource[m.id].deficitGw }))
    .sort((a, b) => b.d - a.d)[0]

  const summary =
    `${year}: Total peak demand ~${totalDemandPeakGw.toFixed(0)} GW · firm ~${totalFirmGw.toFixed(0)} GW. ` +
    `AI ${aiPeakGw.toFixed(0)} · pop add ${popPeakGw.toFixed(0)} · industrial ${indPeakGw.toFixed(0)} GW. ` +
    `Largest source gap: ${sourceMeta(topDef.id).short} ${topDef.d.toFixed(0)} GW deficit stack (sample).`

  return {
    year,
    bySource,
    aiPeakGw,
    popPeakGw,
    indPeakGw,
    totalDemandPeakGw,
    totalFirmGw,
    totalDeficitGw,
    summary,
  }
}

export function sourceTimeline(states = US_STATES): NationalSourceRow[] {
  return SOURCE_YEARS.map((y) => nationalSources(y, states))
}

export function metricForSource(
  row: StateSourceBalance,
  source: EnergySourceId,
  metric: BalanceMetric
): number {
  if (source === 'all') {
    if (metric === 'production') return row.totalFirmGw
    if (metric === 'demand') return row.totalDemandPeakGw
    if (metric === 'deficit') return Math.max(0, row.totalDemandPeakGw - row.totalFirmGw)
    if (metric === 'surplus') return Math.max(0, row.totalFirmGw - row.totalDemandPeakGw)
    return row.totalFirmGw - row.totalDemandPeakGw
  }
  const sl = row.bySource[source]
  if (metric === 'production') return sl.productionGw
  if (metric === 'demand') return sl.demandGw
  if (metric === 'deficit') return sl.deficitGw
  if (metric === 'surplus') return sl.surplusGw
  return sl.firmGw - sl.demandGw
}

export function topStatesForSource(
  year: SourceYear,
  source: EnergySourceId,
  metric: BalanceMetric,
  n = 12
): StateSourceBalance[] {
  const rows = balancesForYear(year)
  return [...rows]
    .sort((a, b) => metricForSource(b, source, metric) - metricForSource(a, source, metric))
    .slice(0, n)
}

export function firstDeficitYearBySource(
  abbr: string,
  source: EnergySourceId,
  threshold = 0.35
): SourceYear | null {
  const s = US_STATES.find((x) => x.abbr === abbr)
  if (!s) return null
  for (const y of SOURCE_YEARS) {
    const row = projectStateSources(s, y)
    const v = metricForSource(row, source, 'deficit')
    if (v >= threshold) return y
  }
  return null
}
