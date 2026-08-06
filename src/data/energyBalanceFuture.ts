/**
 * US future energy balance · demand, supply, and deficit by state.
 * Educational sample trajectories (electrification, data centers, renewables,
 * coal exit). Not an IRP forecast. Wire EIA AEO / NREL / ISO plans in production.
 */

import { US_STATES, type USStateEnergy } from './usStates'

export const BALANCE_YEARS = [2025, 2030, 2035, 2040, 2045] as const
export type BalanceYear = (typeof BALANCE_YEARS)[number]

export interface StateBalance {
  abbr: string
  name: string
  region: string
  grid: string
  lon: number
  lat: number
  year: number
  /** Peak demand GW */
  demandGw: number
  /** Available supply capacity GW (nameplate adjusted for retirements + builds) */
  supplyGw: number
  /** Firm-ish supply after reserve haircut (GW) */
  firmGw: number
  /** demand − firm; positive = shortfall */
  deficitGw: number
  /** firm − demand; positive = surplus */
  surplusGw: number
  /** reserve margin % vs demand */
  reservePct: number
  /** Drivers for intelligence copy */
  drivers: string[]
  status: 'surplus' | 'tight' | 'deficit' | 'critical'
}

export interface NationalBalance {
  year: number
  demandGw: number
  supplyGw: number
  firmGw: number
  deficitGw: number
  surplusGw: number
  statesDeficit: number
  statesCritical: number
  statesSurplus: number
  summary: string
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Demand growth CAGR by state characteristics */
function demandCagr(s: USStateEnergy): number {
  let g = 0.012 // base ~1.2%/yr
  // Data-center / industrial electrification hotspots
  if (['VA', 'TX', 'AZ', 'OR', 'IA', 'GA', 'OH', 'IL', 'NV', 'NE'].includes(s.abbr)) g += 0.018
  if (['CA', 'NY', 'WA', 'CO', 'MA'].includes(s.abbr)) g += 0.008 // EV + building heat
  if (['FL', 'NC', 'SC', 'TN'].includes(s.abbr)) g += 0.006 // population + AC
  // Slow / declining industrial pockets
  if (['WV', 'KY', 'ME', 'VT', 'RI'].includes(s.abbr)) g -= 0.004
  return Math.max(0.002, Math.min(0.045, g))
}

/** Supply build / retirement net CAGR */
function supplyCagr(s: USStateEnergy): number {
  let g = 0.008
  // Renewable / storage build leaders
  if (s.solarGw + s.windGw + s.storageGw > s.capacityGw * 0.25) g += 0.012
  if (['TX', 'CA', 'IA', 'OK', 'KS', 'NM', 'NV', 'AZ'].includes(s.abbr)) g += 0.01
  // Coal-heavy with slower replacement
  if (s.coalGw > s.capacityGw * 0.25 && s.cleanPct < 30) g -= 0.006
  // Nuclear stable / slight growth
  if (s.nuclearGw > 3) g += 0.002
  return Math.max(-0.008, Math.min(0.04, g))
}

/** Firm capacity factor vs nameplate (storage + thermal + nuclear higher than pure solar) */
function firmRatio(s: USStateEnergy, year: number): number {
  const t = (year - 2025) / 20
  const cleanHeavy = (s.solarGw + s.windGw) / Math.max(1, s.capacityGw)
  // More renewables without storage → lower firm ratio unless storage grows
  const storageBoost = Math.min(0.15, (s.storageGw / Math.max(1, s.capacityGw)) * 0.4 + t * 0.08)
  const base = 0.72 - cleanHeavy * 0.18 + storageBoost
  // Nuclear / hydro raise firm
  if (s.nuclearGw + s.hydroGw > s.capacityGw * 0.2) return Math.min(0.88, base + 0.08)
  return Math.max(0.48, Math.min(0.85, base))
}

function driversFor(s: USStateEnergy, bal: Omit<StateBalance, 'drivers' | 'status'>): string[] {
  const d: string[] = []
  const dc = demandCagr(s)
  if (dc >= 0.025) d.push('High load growth (data centers / industry)')
  else if (dc >= 0.015) d.push('Electrification + population load growth')
  if (s.coalGw > 4 && bal.year >= 2030) d.push('Coal retirements pressure supply')
  if (s.solarGw + s.windGw > 8) d.push('Renewable build offsets peak risk')
  if (s.storageGw > 1 || ['CA', 'TX', 'AZ', 'NV'].includes(s.abbr))
    d.push('Storage build improves firm capacity')
  if (bal.deficitGw > 2) d.push('Import dependence or new build required')
  if (bal.surplusGw > 5) d.push('Export-capable surplus')
  if (!d.length) d.push('Balanced trajectory under sample path')
  return d.slice(0, 3)
}

function statusOf(deficitGw: number, reservePct: number): StateBalance['status'] {
  if (deficitGw >= 5 || reservePct < -8) return 'critical'
  if (deficitGw > 0.5 || reservePct < 5) return 'deficit'
  if (reservePct < 12) return 'tight'
  return 'surplus'
}

export function projectState(s: USStateEnergy, year: BalanceYear): StateBalance {
  const years = year - 2025
  const dCagr = demandCagr(s)
  const sCagr = supplyCagr(s)
  // Peak demand growth from current peak
  const demandGw = +(s.peakGw * Math.pow(1 + dCagr, years)).toFixed(2)
  // Supply: start capacity, grow with builds, slight coal haircut over time
  const coalHaircut = Math.min(s.coalGw * 0.55, s.coalGw * (years / 20) * 0.9)
  const supplyGw = +Math.max(
    0.5,
    (s.capacityGw - coalHaircut) * Math.pow(1 + sCagr, years)
  ).toFixed(2)
  const firm = firmRatio(s, year)
  const firmGw = +(supplyGw * firm).toFixed(2)
  const deficitGw = +Math.max(0, demandGw - firmGw).toFixed(2)
  const surplusGw = +Math.max(0, firmGw - demandGw).toFixed(2)
  const reservePct = +(((firmGw - demandGw) / Math.max(0.1, demandGw)) * 100).toFixed(1)
  const base = {
    abbr: s.abbr,
    name: s.name,
    region: s.region,
    grid: s.grid,
    lon: s.lon,
    lat: s.lat,
    year,
    demandGw,
    supplyGw,
    firmGw,
    deficitGw,
    surplusGw,
    reservePct,
  }
  return {
    ...base,
    drivers: driversFor(s, base),
    status: statusOf(deficitGw, reservePct),
  }
}

export function balancesForYear(year: BalanceYear, states = US_STATES): StateBalance[] {
  return states.map((s) => projectState(s, year)).sort((a, b) => b.deficitGw - a.deficitGw)
}

export function nationalBalance(year: BalanceYear, states = US_STATES): NationalBalance {
  const rows = balancesForYear(year, states)
  const demandGw = rows.reduce((s, r) => s + r.demandGw, 0)
  const supplyGw = rows.reduce((s, r) => s + r.supplyGw, 0)
  const firmGw = rows.reduce((s, r) => s + r.firmGw, 0)
  const deficitGw = rows.reduce((s, r) => s + r.deficitGw, 0)
  const surplusGw = rows.reduce((s, r) => s + r.surplusGw, 0)
  const statesDeficit = rows.filter((r) => r.status === 'deficit' || r.status === 'critical').length
  const statesCritical = rows.filter((r) => r.status === 'critical').length
  const statesSurplus = rows.filter((r) => r.status === 'surplus').length

  let summary: string
  if (deficitGw < 20) {
    summary = `${year}: National firm supply roughly covers peak. ${statesDeficit} states still tight or short. Watch data-center corridors.`
  } else if (deficitGw < 80) {
    summary = `${year}: Aggregate firm shortfall ~${deficitGw.toFixed(0)} GW across ${statesDeficit} states. Build storage, transmission, and firm clean generation.`
  } else {
    summary = `${year}: Structural deficit risk ~${deficitGw.toFixed(0)} GW firm. ${statesCritical} critical states. Accelerate supply and demand response.`
  }

  return {
    year,
    demandGw: +demandGw.toFixed(1),
    supplyGw: +supplyGw.toFixed(1),
    firmGw: +firmGw.toFixed(1),
    deficitGw: +deficitGw.toFixed(1),
    surplusGw: +surplusGw.toFixed(1),
    statesDeficit,
    statesCritical,
    statesSurplus,
    summary,
  }
}

export function balanceTimeline(states = US_STATES): NationalBalance[] {
  return BALANCE_YEARS.map((y) => nationalBalance(y, states))
}

export function topDeficitStates(year: BalanceYear, n = 8): StateBalance[] {
  return balancesForYear(year)
    .filter((r) => r.deficitGw > 0)
    .slice(0, n)
}

export function topSurplusStates(year: BalanceYear, n = 8): StateBalance[] {
  return balancesForYear(year)
    .filter((r) => r.surplusGw > 0)
    .sort((a, b) => b.surplusGw - a.surplusGw)
    .slice(0, n)
}

/** Color: surplus blue/green → tight yellow → deficit orange → critical red */
export function balanceColor(b: StateBalance, dark: boolean): string {
  if (b.status === 'critical') return dark ? '#fb7185' : '#e11d48'
  if (b.status === 'deficit') return dark ? '#fb923c' : '#ea580c'
  if (b.status === 'tight') return dark ? '#fbbf24' : '#ca8a04'
  // surplus intensity by margin
  const t = Math.min(1, b.surplusGw / 15)
  if (dark) {
    const g = Math.round(100 + t * 80)
    const bl = Math.round(140 + t * 60)
    return `rgb(40,${g},${bl})`
  }
  return t > 0.5 ? '#15803d' : '#22c55e'
}

export function intelligenceBlurb(year: BalanceYear): string[] {
  const nat = nationalBalance(year)
  const tops = topDeficitStates(year, 3)
  const tips: string[] = [nat.summary]
  if (tops.length) {
    tips.push(
      `Largest shortfalls: ${tops.map((t) => `${t.abbr} ${t.deficitGw.toFixed(1)} GW`).join(' · ')}`
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

// silence unused if tree-shaken
void hash
