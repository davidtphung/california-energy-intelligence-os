/**
 * U.S. electricity demand forecast stack:
 * AI / data centers, population-driven load, industrial manufacturing.
 * Capital split: private vs public. Sample path for EIS map UX (not IRP).
 */

import { US_STATES, type USStateEnergy } from './usStates'

export const DEMAND_YEARS = [2025, 2027, 2030, 2032, 2035] as const
export type DemandYear = (typeof DEMAND_YEARS)[number]

export type DemandDriver = 'ai' | 'population' | 'industrial' | 'total'
export type CapitalSource = 'private' | 'public' | 'all'

export interface StateDemandRow {
  abbr: string
  name: string
  region: string
  lon: number
  lat: number
  year: DemandYear
  /** Peak-equivalent GW attributed to AI/data centers */
  aiPeakGw: number
  /** Annual energy TWh from AI/DC (rough CF ~0.75) */
  aiTwh: number
  /** Peak GW from population / residential-commercial growth vs 2025 base share */
  popPeakGw: number
  popTwh: number
  /** Peak GW industrial / manufacturing */
  indPeakGw: number
  indTwh: number
  /** Total peak demand proxy */
  totalPeakGw: number
  totalTwh: number
  /** Capex $B cumulative through year (sample) */
  privateCapexB: number
  publicCapexB: number
  /** Drivers */
  aiSharePct: number
  note: string
}

export interface NationalDemand {
  year: DemandYear
  aiPeakGw: number
  popPeakGw: number
  indPeakGw: number
  totalPeakGw: number
  aiTwh: number
  privateCapexB: number
  publicCapexB: number
  summary: string
}

/** AI/data-center intensity 0-1 by state (corridor weights) */
function aiWeight(s: USStateEnergy): number {
  const hot: Record<string, number> = {
    VA: 1, TX: 0.95, AZ: 0.85, OR: 0.8, IA: 0.75, GA: 0.78, OH: 0.72, IL: 0.7,
    NV: 0.74, NE: 0.68, CA: 0.65, NY: 0.55, WA: 0.6, CO: 0.5, PA: 0.55, NC: 0.58,
    SC: 0.45, IN: 0.48, UT: 0.5, OK: 0.4, TN: 0.42, FL: 0.38, NJ: 0.4, MD: 0.42,
  }
  return hot[s.abbr] ?? Math.min(0.35, s.peakGw / 80)
}

/** Population growth CAGR proxy */
function popCagr(s: USStateEnergy): number {
  const fast = ['TX', 'FL', 'AZ', 'NV', 'NC', 'SC', 'GA', 'TN', 'ID', 'UT', 'CO', 'WA']
  const slow = ['IL', 'NY', 'PA', 'OH', 'MI', 'WV', 'MS', 'LA', 'CT', 'RI']
  if (fast.includes(s.abbr)) return 0.012
  if (slow.includes(s.abbr)) return 0.001
  if (['CA', 'OR'].includes(s.abbr)) return 0.004
  return 0.005
}

/** Manufacturing / industrial intensity 0-1 */
function indWeight(s: USStateEnergy): number {
  const heavy: Record<string, number> = {
    TX: 0.95, LA: 0.9, OH: 0.85, IN: 0.82, MI: 0.8, PA: 0.75, IL: 0.78, AL: 0.72,
    KY: 0.7, GA: 0.68, SC: 0.65, NC: 0.62, TN: 0.7, WI: 0.6, IA: 0.55, OK: 0.58,
    CA: 0.5, NY: 0.4, WA: 0.45, AZ: 0.48,
  }
  return heavy[s.abbr] ?? 0.3 + Math.min(0.25, s.gasGw / 40)
}

/** Private capital share of AI+industrial build 0-1 (rest public) */
function privateShare(s: USStateEnergy): number {
  // Hyperscaler / PE heavy corridors more private; SE utility territory more public ratebase
  const priv: Record<string, number> = {
    VA: 0.82, OR: 0.85, IA: 0.8, NE: 0.78, AZ: 0.75, TX: 0.7, NV: 0.72, CA: 0.68,
    WA: 0.65, NY: 0.55, IL: 0.6, OH: 0.55, GA: 0.5, NC: 0.48, SC: 0.45, FL: 0.42,
  }
  return priv[s.abbr] ?? 0.55
}

/** National AI peak GW trajectory (sample, mid of public ranges) */
function nationalAiPeak(year: DemandYear): number {
  // Rough: ~15 GW effective AI peak 2025 → ~55 2030 → ~85 2035
  const map: Record<DemandYear, number> = {
    2025: 18,
    2027: 32,
    2030: 55,
    2032: 68,
    2035: 85,
  }
  return map[year]
}

function nationalIndAddPeak(year: DemandYear): number {
  const map: Record<DemandYear, number> = {
    2025: 0,
    2027: 4,
    2030: 12,
    2032: 16,
    2035: 22,
  }
  return map[year]
}

function yearsFromBase(year: DemandYear): number {
  return year - 2025
}

export function projectStateDemand(s: USStateEnergy, year: DemandYear): StateDemandRow {
  const t = yearsFromBase(year)
  const aw = aiWeight(s)
  const iw = indWeight(s)
  const sumAw = US_STATES.reduce((a, x) => a + aiWeight(x) * Math.max(1, x.peakGw), 0)
  const sumIw = US_STATES.reduce((a, x) => a + indWeight(x) * Math.max(1, x.peakGw), 0)

  const natAi = nationalAiPeak(year)
  const natInd = nationalIndAddPeak(year)

  const aiPeakGw = +((natAi * (aw * Math.max(1, s.peakGw))) / sumAw).toFixed(2)
  const indPeakGw = +((natInd * (iw * Math.max(1, s.peakGw))) / sumIw + s.peakGw * 0.08 * (1 - Math.exp(-t / 8))).toFixed(2)

  // Population: grow a slice of existing peak with pop CAGR + mild electrification
  const elec = 1 + 0.008 * t
  const popMult = Math.pow(1 + popCagr(s), t) * elec
  const popBaseShare = 0.55
  const popPeakGw = +(s.peakGw * popBaseShare * (popMult - 1)).toFixed(2)

  const baseNonAi = s.peakGw * 0.95
  const totalPeakGw = +(
    baseNonAi * Math.min(1.15, popMult * 0.5 + 0.5) +
    aiPeakGw +
    indPeakGw * 0.35 +
    popPeakGw
  ).toFixed(2)

  const cfAi = 0.72
  const cfPop = 0.45
  const cfInd = 0.55
  const aiTwh = +(aiPeakGw * 8.76 * cfAi).toFixed(1)
  const popTwh = +(popPeakGw * 8.76 * cfPop).toFixed(1)
  const indTwh = +(indPeakGw * 8.76 * cfInd).toFixed(1)
  const totalTwh = +(aiTwh + popTwh + indTwh + s.generationTwh * 0.15 * (t / 10)).toFixed(1)

  // Capex: ~$8-12M/MW AI IT+power (private heavy); public T&D / IRA share
  const priv = privateShare(s)
  const capexPerGwB = 9.5
  const privateCapexB = +(
    (aiPeakGw * capexPerGwB * priv + indPeakGw * 2.5 * 0.7) *
    (0.4 + t / 12)
  ).toFixed(1)
  const publicCapexB = +(
    (aiPeakGw * capexPerGwB * (1 - priv) + indPeakGw * 1.2 * 0.5 + popPeakGw * 0.8) *
    (0.35 + t / 14)
  ).toFixed(1)

  const aiSharePct = totalPeakGw > 0 ? +((aiPeakGw / totalPeakGw) * 100).toFixed(1) : 0

  let note = s.note
  if (aw > 0.7) note = 'AI / hyperscale corridor: private capital dominates campus and BTM power.'
  else if (iw > 0.75) note = 'Industrial / manufacturing load growth: mixed private plant + public T&D.'
  else if (popCagr(s) > 0.01) note = 'Population and service economy growth drive distribution and peak.'

  return {
    abbr: s.abbr,
    name: s.name,
    region: s.region,
    lon: s.lon,
    lat: s.lat,
    year,
    aiPeakGw,
    aiTwh,
    popPeakGw,
    popTwh,
    indPeakGw,
    indTwh,
    totalPeakGw,
    totalTwh,
    privateCapexB,
    publicCapexB,
    aiSharePct,
    note,
  }
}

export function demandForYear(year: DemandYear, states = US_STATES): StateDemandRow[] {
  return states.map((s) => projectStateDemand(s, year)).sort((a, b) => b.totalPeakGw - a.totalPeakGw)
}

export function nationalDemand(year: DemandYear, states = US_STATES): NationalDemand {
  const rows = demandForYear(year, states)
  const aiPeakGw = +rows.reduce((s, r) => s + r.aiPeakGw, 0).toFixed(1)
  const popPeakGw = +rows.reduce((s, r) => s + r.popPeakGw, 0).toFixed(1)
  const indPeakGw = +rows.reduce((s, r) => s + r.indPeakGw, 0).toFixed(1)
  const totalPeakGw = +rows.reduce((s, r) => s + r.totalPeakGw, 0).toFixed(1)
  const aiTwh = +rows.reduce((s, r) => s + r.aiTwh, 0).toFixed(0)
  const privateCapexB = +rows.reduce((s, r) => s + r.privateCapexB, 0).toFixed(0)
  const publicCapexB = +rows.reduce((s, r) => s + r.publicCapexB, 0).toFixed(0)

  const summary =
    year <= 2027
      ? `${year}: AI peak ~${aiPeakGw} GW sample · private hyperscale capex leads · population growth steady in Sun Belt.`
      : year <= 2030
        ? `${year}: AI ~${aiPeakGw} GW peak stack · industrial re-shoring adds ~${indPeakGw} GW · private $${privateCapexB}B vs public $${publicCapexB}B cumulative sample.`
        : `${year}: AI ~${aiPeakGw} GW · pop + industrial still material · capital mix tilts public on wires and firm power.`

  return {
    year,
    aiPeakGw,
    popPeakGw,
    indPeakGw,
    totalPeakGw,
    aiTwh,
    privateCapexB,
    publicCapexB,
    summary,
  }
}

export function demandTimeline(states = US_STATES): NationalDemand[] {
  return DEMAND_YEARS.map((y) => nationalDemand(y, states))
}

export function topStatesByDriver(
  year: DemandYear,
  driver: DemandDriver,
  n = 10
): StateDemandRow[] {
  const rows = demandForYear(year)
  const key =
    driver === 'ai'
      ? (r: StateDemandRow) => r.aiPeakGw
      : driver === 'population'
        ? (r: StateDemandRow) => r.popPeakGw
        : driver === 'industrial'
          ? (r: StateDemandRow) => r.indPeakGw
          : (r: StateDemandRow) => r.totalPeakGw
  return [...rows].sort((a, b) => key(b) - key(a)).slice(0, n)
}

export function metricValue(r: StateDemandRow, driver: DemandDriver, capital: CapitalSource): number {
  if (capital === 'private') return r.privateCapexB
  if (capital === 'public') return r.publicCapexB
  if (driver === 'ai') return r.aiPeakGw
  if (driver === 'population') return r.popPeakGw
  if (driver === 'industrial') return r.indPeakGw
  return r.totalPeakGw
}

export function driverColor(driver: DemandDriver, dark: boolean): string {
  if (driver === 'ai') return dark ? '#fb923c' : '#ea580c'
  if (driver === 'population') return dark ? '#38bdf8' : '#0284c7'
  if (driver === 'industrial') return dark ? '#a78bfa' : '#7c3aed'
  return dark ? '#86efac' : '#15803d'
}
