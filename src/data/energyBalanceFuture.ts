/**
 * US future energy balance: demand, firm supply, and predicted deficits by state.
 * Sample trajectories (electrification, data centers, renewables, coal exit).
 * Not an official IRP. Wire EIA AEO / NREL / ISO plans in production.
 */

import { US_STATES, type USStateEnergy } from './usStates'

export const BALANCE_YEARS = [2025, 2030, 2035, 2040, 2045] as const
export type BalanceYear = (typeof BALANCE_YEARS)[number]

/** Forecast stress cases */
export type ForecastScenario = 'base' | 'high-demand' | 'delayed-build'

export const SCENARIO_META: {
  id: ForecastScenario
  label: string
  short: string
  note: string
}[] = [
  {
    id: 'base',
    label: 'Base path',
    short: 'Base',
    note: 'Central growth, normal builds and coal exit pace.',
  },
  {
    id: 'high-demand',
    label: 'High demand',
    short: 'High load',
    note: 'Faster data-center and electrification load (+40% demand CAGR).',
  },
  {
    id: 'delayed-build',
    label: 'Delayed build',
    short: 'Slow supply',
    note: 'Interconnection / siting lag: supply growth cut ~45%.',
  },
]

export interface StateBalance {
  abbr: string
  name: string
  region: string
  grid: string
  lon: number
  lat: number
  year: number
  scenario: ForecastScenario
  demandGw: number
  supplyGw: number
  firmGw: number
  deficitGw: number
  surplusGw: number
  reservePct: number
  /** YoY change in deficit vs prior horizon (GW) */
  deficitDeltaGw: number
  drivers: string[]
  actions: string[]
  status: 'surplus' | 'tight' | 'deficit' | 'critical'
}

export interface NationalBalance {
  year: number
  scenario: ForecastScenario
  demandGw: number
  supplyGw: number
  firmGw: number
  deficitGw: number
  surplusGw: number
  statesDeficit: number
  statesCritical: number
  statesSurplus: number
  statesTight: number
  summary: string
}

export interface StateDeficitPrediction {
  abbr: string
  name: string
  lon: number
  lat: number
  /** First sample year with deficit > 0.5 GW, or null if none through 2045 */
  firstDeficitYear: BalanceYear | null
  /** Peak deficit GW across horizons under this scenario */
  peakDeficitGw: number
  peakDeficitYear: BalanceYear
  status2045: StateBalance['status']
  trajectory: { year: BalanceYear; deficitGw: number; demandGw: number; firmGw: number }[]
}

function demandCagr(s: USStateEnergy, scenario: ForecastScenario): number {
  let g = 0.012
  if (['VA', 'TX', 'AZ', 'OR', 'IA', 'GA', 'OH', 'IL', 'NV', 'NE'].includes(s.abbr)) g += 0.018
  if (['CA', 'NY', 'WA', 'CO', 'MA'].includes(s.abbr)) g += 0.008
  if (['FL', 'NC', 'SC', 'TN'].includes(s.abbr)) g += 0.006
  if (['WV', 'KY', 'ME', 'VT', 'RI'].includes(s.abbr)) g -= 0.004
  if (scenario === 'high-demand') g *= 1.4
  return Math.max(0.002, Math.min(0.055, g))
}

function supplyCagr(s: USStateEnergy, scenario: ForecastScenario): number {
  let g = 0.008
  if (s.solarGw + s.windGw + s.storageGw > s.capacityGw * 0.25) g += 0.012
  if (['TX', 'CA', 'IA', 'OK', 'KS', 'NM', 'NV', 'AZ'].includes(s.abbr)) g += 0.01
  if (s.coalGw > s.capacityGw * 0.25 && s.cleanPct < 30) g -= 0.006
  if (s.nuclearGw > 3) g += 0.002
  if (scenario === 'delayed-build') g *= 0.55
  return Math.max(-0.01, Math.min(0.045, g))
}

function firmRatio(s: USStateEnergy, year: number, scenario: ForecastScenario): number {
  const t = (year - 2025) / 20
  const cleanHeavy = (s.solarGw + s.windGw) / Math.max(1, s.capacityGw)
  let storageBoost = Math.min(0.15, (s.storageGw / Math.max(1, s.capacityGw)) * 0.4 + t * 0.08)
  if (scenario === 'delayed-build') storageBoost *= 0.6
  const base = 0.72 - cleanHeavy * 0.18 + storageBoost
  if (s.nuclearGw + s.hydroGw > s.capacityGw * 0.2) return Math.min(0.88, base + 0.08)
  return Math.max(0.45, Math.min(0.85, base))
}

function driversFor(
  s: USStateEnergy,
  bal: Omit<StateBalance, 'drivers' | 'actions' | 'status' | 'deficitDeltaGw'>,
  scenario: ForecastScenario
): string[] {
  const d: string[] = []
  const dc = demandCagr(s, scenario)
  if (scenario === 'high-demand') d.push('High-demand case: faster load growth')
  if (scenario === 'delayed-build') d.push('Delayed-build case: slower firm supply')
  if (dc >= 0.025) d.push('High load growth (data centers / industry)')
  else if (dc >= 0.015) d.push('Electrification + population load growth')
  if (s.coalGw > 4 && bal.year >= 2030) d.push('Coal retirements pressure supply')
  if (s.solarGw + s.windGw > 8) d.push('Renewable build offsets peak risk')
  if (s.storageGw > 1 || ['CA', 'TX', 'AZ', 'NV'].includes(s.abbr))
    d.push('Storage build improves firm capacity')
  if (bal.deficitGw > 2) d.push('Import dependence or new build required')
  if (bal.surplusGw > 5) d.push('Export-capable surplus')
  if (!d.length) d.push('Balanced trajectory under sample path')
  return d.slice(0, 4)
}

function actionsFor(bal: { deficitGw: number; reservePct: number; status: StateBalance['status'] }): string[] {
  if (bal.status === 'surplus') return ['Maintain reserve path; export / market sales optional.']
  if (bal.status === 'tight')
    return ['Advance storage and demand response before peak seasons.', 'Watch interconnection queue.']
  const a: string[] = []
  if (bal.deficitGw >= 5) a.push('Prioritize firm capacity (storage, gas peakers, nuclear life extension).')
  a.push('Accelerate transmission and imports where seams allow.')
  a.push('Target large flexible loads (data centers) with flexibility agreements.')
  if (bal.reservePct < -5) a.push('Raise contingency reserve plans for extreme weather peaks.')
  return a.slice(0, 3)
}

function statusOf(deficitGw: number, reservePct: number): StateBalance['status'] {
  if (deficitGw >= 5 || reservePct < -8) return 'critical'
  if (deficitGw > 0.5 || reservePct < 5) return 'deficit'
  if (reservePct < 12) return 'tight'
  return 'surplus'
}

export function projectState(
  s: USStateEnergy,
  year: BalanceYear,
  scenario: ForecastScenario = 'base'
): StateBalance {
  const years = year - 2025
  const dCagr = demandCagr(s, scenario)
  const sCagr = supplyCagr(s, scenario)
  const demandGw = +(s.peakGw * Math.pow(1 + dCagr, years)).toFixed(2)
  const coalHaircut = Math.min(s.coalGw * 0.55, s.coalGw * (years / 20) * 0.9)
  const supplyGw = +Math.max(
    0.5,
    (s.capacityGw - coalHaircut) * Math.pow(1 + sCagr, years)
  ).toFixed(2)
  const firm = firmRatio(s, year, scenario)
  const firmGw = +(supplyGw * firm).toFixed(2)
  const deficitGw = +Math.max(0, demandGw - firmGw).toFixed(2)
  const surplusGw = +Math.max(0, firmGw - demandGw).toFixed(2)
  const reservePct = +(((firmGw - demandGw) / Math.max(0.1, demandGw)) * 100).toFixed(1)

  // Delta vs prior horizon
  const prevYear = BALANCE_YEARS[Math.max(0, BALANCE_YEARS.indexOf(year) - 1)]
  let deficitDeltaGw = 0
  if (prevYear !== year) {
    const prev = projectStateRaw(s, prevYear, scenario)
    deficitDeltaGw = +(deficitGw - prev.deficitGw).toFixed(2)
  }

  const base = {
    abbr: s.abbr,
    name: s.name,
    region: s.region,
    grid: s.grid,
    lon: s.lon,
    lat: s.lat,
    year,
    scenario,
    demandGw,
    supplyGw,
    firmGw,
    deficitGw,
    surplusGw,
    reservePct,
  }
  const status = statusOf(deficitGw, reservePct)
  return {
    ...base,
    deficitDeltaGw,
    drivers: driversFor(s, base, scenario),
    actions: actionsFor({ deficitGw, reservePct, status }),
    status,
  }
}

/** Avoid recursion when computing delta */
function projectStateRaw(
  s: USStateEnergy,
  year: BalanceYear,
  scenario: ForecastScenario
): { deficitGw: number } {
  const years = year - 2025
  const dCagr = demandCagr(s, scenario)
  const sCagr = supplyCagr(s, scenario)
  const demandGw = s.peakGw * Math.pow(1 + dCagr, years)
  const coalHaircut = Math.min(s.coalGw * 0.55, s.coalGw * (years / 20) * 0.9)
  const supplyGw = Math.max(0.5, (s.capacityGw - coalHaircut) * Math.pow(1 + sCagr, years))
  const firmGw = supplyGw * firmRatio(s, year, scenario)
  return { deficitGw: Math.max(0, demandGw - firmGw) }
}

export function balancesForYear(
  year: BalanceYear,
  scenario: ForecastScenario = 'base',
  states = US_STATES
): StateBalance[] {
  return states
    .map((s) => projectState(s, year, scenario))
    .sort((a, b) => b.deficitGw - a.deficitGw || a.reservePct - b.reservePct)
}

export function nationalBalance(
  year: BalanceYear,
  scenario: ForecastScenario = 'base',
  states = US_STATES
): NationalBalance {
  const rows = balancesForYear(year, scenario, states)
  const demandGw = rows.reduce((s, r) => s + r.demandGw, 0)
  const supplyGw = rows.reduce((s, r) => s + r.supplyGw, 0)
  const firmGw = rows.reduce((s, r) => s + r.firmGw, 0)
  const deficitGw = rows.reduce((s, r) => s + r.deficitGw, 0)
  const surplusGw = rows.reduce((s, r) => s + r.surplusGw, 0)
  const statesDeficit = rows.filter((r) => r.status === 'deficit' || r.status === 'critical').length
  const statesCritical = rows.filter((r) => r.status === 'critical').length
  const statesSurplus = rows.filter((r) => r.status === 'surplus').length
  const statesTight = rows.filter((r) => r.status === 'tight').length

  const scenLabel = SCENARIO_META.find((m) => m.id === scenario)?.short ?? scenario
  let summary: string
  if (deficitGw < 20) {
    summary = `${year} (${scenLabel}): National firm supply roughly covers peak. ${statesDeficit} states still tight or short. Watch data-center corridors.`
  } else if (deficitGw < 80) {
    summary = `${year} (${scenLabel}): Aggregate firm shortfall ~${deficitGw.toFixed(0)} GW across ${statesDeficit} states. Build storage, transmission, and firm clean generation.`
  } else {
    summary = `${year} (${scenLabel}): Structural deficit risk ~${deficitGw.toFixed(0)} GW firm. ${statesCritical} critical states. Accelerate supply and demand response.`
  }

  return {
    year,
    scenario,
    demandGw: +demandGw.toFixed(1),
    supplyGw: +supplyGw.toFixed(1),
    firmGw: +firmGw.toFixed(1),
    deficitGw: +deficitGw.toFixed(1),
    surplusGw: +surplusGw.toFixed(1),
    statesDeficit,
    statesCritical,
    statesSurplus,
    statesTight,
    summary,
  }
}

export function balanceTimeline(
  scenario: ForecastScenario = 'base',
  states = US_STATES
): NationalBalance[] {
  return BALANCE_YEARS.map((y) => nationalBalance(y, scenario, states))
}

export function topDeficitStates(
  year: BalanceYear,
  n = 8,
  scenario: ForecastScenario = 'base'
): StateBalance[] {
  return balancesForYear(year, scenario)
    .filter((r) => r.deficitGw > 0)
    .slice(0, n)
}

export function topSurplusStates(
  year: BalanceYear,
  n = 8,
  scenario: ForecastScenario = 'base'
): StateBalance[] {
  return balancesForYear(year, scenario)
    .filter((r) => r.surplusGw > 0)
    .sort((a, b) => b.surplusGw - a.surplusGw)
    .slice(0, n)
}

/** Predict when each state first hits a firm deficit and peak shortfall */
export function predictDeficits(
  scenario: ForecastScenario = 'base',
  states = US_STATES
): StateDeficitPrediction[] {
  return states
    .map((s) => {
      const trajectory = BALANCE_YEARS.map((year) => {
        const b = projectState(s, year, scenario)
        return {
          year,
          deficitGw: b.deficitGw,
          demandGw: b.demandGw,
          firmGw: b.firmGw,
        }
      })
      const first = trajectory.find((t) => t.deficitGw > 0.5)
      let peak = trajectory[0]
      for (const t of trajectory) {
        if (t.deficitGw > peak.deficitGw) peak = t
      }
      const end = projectState(s, 2045, scenario)
      return {
        abbr: s.abbr,
        name: s.name,
        lon: s.lon,
        lat: s.lat,
        firstDeficitYear: first ? first.year : null,
        peakDeficitGw: +peak.deficitGw.toFixed(2),
        peakDeficitYear: peak.year,
        status2045: end.status,
        trajectory,
      }
    })
    .sort((a, b) => b.peakDeficitGw - a.peakDeficitGw)
}

export function statesEnteringDeficit(
  year: BalanceYear,
  scenario: ForecastScenario = 'base'
): StateDeficitPrediction[] {
  return predictDeficits(scenario).filter((p) => p.firstDeficitYear === year)
}

export function balanceColor(b: StateBalance, dark: boolean): string {
  if (b.status === 'critical') return dark ? '#fb7185' : '#e11d48'
  if (b.status === 'deficit') return dark ? '#fb923c' : '#ea580c'
  if (b.status === 'tight') return dark ? '#fbbf24' : '#ca8a04'
  const t = Math.min(1, b.surplusGw / 15)
  if (dark) {
    const g = Math.round(100 + t * 80)
    const bl = Math.round(140 + t * 60)
    return `rgb(40,${g},${bl})`
  }
  return t > 0.5 ? '#15803d' : '#22c55e'
}

export function intelligenceBlurb(
  year: BalanceYear,
  scenario: ForecastScenario = 'base'
): string[] {
  const nat = nationalBalance(year, scenario)
  const tops = topDeficitStates(year, 3, scenario)
  const entering = statesEnteringDeficit(year, scenario)
  const tips: string[] = [nat.summary]
  if (tops.length) {
    tips.push(
      `Largest shortfalls: ${tops.map((t) => `${t.abbr} ${t.deficitGw.toFixed(1)} GW`).join(' · ')}`
    )
  }
  if (entering.length) {
    tips.push(
      `First firm deficit this horizon: ${entering
        .slice(0, 5)
        .map((e) => e.abbr)
        .join(', ')}${entering.length > 5 ? '…' : ''}`
    )
  }
  tips.push(
    year <= 2030
      ? 'Near term: interconnection queues and storage siting decide summer peaks.'
      : year <= 2035
        ? 'Mid decade: coal exit + data centers set regional deficits if builds lag.'
        : 'Long term: firm clean (nuclear, geothermal, long-duration storage) closes residual gaps.'
  )
  return tips
}
