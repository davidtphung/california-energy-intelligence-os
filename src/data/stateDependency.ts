/**
 * State electricity purchase, import dependence, and risk.
 * Combines trade, fleet mix, interconnect isolation, AI load, and partner concentration.
 * Educational sample path (not NERC RAS / IRP).
 */

import { US_STATES, type USStateEnergy } from './usStates'
import { tradeOf, type StateTrade } from './energyTrade'
import { GRID_ZONES, type GridZoneId, type InterconnectId } from './gridUtilities'
import { projectStateDemand } from './demandForecast'

export type RiskBand = 'resilient' | 'watch' | 'exposed' | 'critical'
export type IsolationKind = 'continental' | 'island-grid' | 'asynchronous' | 'peninsula'

export interface RiskFactor {
  id: string
  label: string
  points: number
  detail: string
}

export interface StateDependency {
  abbr: string
  name: string
  region: string
  lon: number
  lat: number
  grid: string
  interconnect: InterconnectId | 'island'
  zones: GridZoneId[]
  generationTwh: number
  peakGw: number
  capacityGw: number
  /** Gross electricity bought (imports) TWh/yr */
  buysTwh: number
  sellsTwh: number
  netBuyTwh: number
  /** Apparent consumption ≈ gen + imports − exports */
  useTwh: number
  /** Imports / use (0-100) */
  importSharePct: number
  /** max(0, net buy) / use */
  netDependPct: number
  reservePct: number
  isolation: IsolationKind
  partners: string[]
  partnerCount: number
  /** 0-1; 1 = single supplier */
  concentration: number
  foreignPartners: string[]
  aiPeak2030Gw: number
  primaryFuelSharePct: number
  primaryFuel: string
  factors: RiskFactor[]
  riskScore: number
  band: RiskBand
  headline: string
  note: string
}

const FOREIGN = new Set(['HQ', 'QC', 'BC', 'ON', 'NB', 'MX', 'CA path'])

const PENINSULA = new Set(['FL', 'MI'])
const ISLAND_GRID = new Set(['HI', 'AK', 'PR', 'GU', 'VI', 'AS', 'MP'])
const ASYNC = new Set(['TX'])

function zonesFor(abbr: string): GridZoneId[] {
  return GRID_ZONES.filter((z) => z.states.includes(abbr)).map((z) => z.id)
}

function interconnectFor(abbr: string, zones: GridZoneId[]): InterconnectId | 'island' {
  if (ISLAND_GRID.has(abbr)) return 'island'
  if (abbr === 'TX') return 'texas'
  const z = GRID_ZONES.find((g) => zones.includes(g.id))
  return z?.interconnect ?? 'eastern'
}

function isolationOf(abbr: string): IsolationKind {
  if (ISLAND_GRID.has(abbr)) return 'island-grid'
  if (ASYNC.has(abbr)) return 'asynchronous'
  if (PENINSULA.has(abbr)) return 'peninsula'
  return 'continental'
}

function fuelShare(s: USStateEnergy): { primary: string; sharePct: number } {
  const parts: [string, number][] = [
    ['Gas', s.gasGw],
    ['Coal', s.coalGw],
    ['Nuclear', s.nuclearGw],
    ['Solar', s.solarGw],
    ['Wind', s.windGw],
    ['Hydro', s.hydroGw],
  ]
  const tot = parts.reduce((a, [, v]) => a + v, 0) || 1
  parts.sort((a, b) => b[1] - a[1])
  return { primary: parts[0][0], sharePct: +((parts[0][1] / tot) * 100).toFixed(0) }
}

function bandOf(score: number): RiskBand {
  if (score >= 66) return 'critical'
  if (score >= 46) return 'exposed'
  if (score >= 26) return 'watch'
  return 'resilient'
}

export function analyzeState(s: USStateEnergy): StateDependency {
  const t: StateTrade = tradeOf(s.abbr)
  const buysTwh = t.importsTwh
  const sellsTwh = t.exportsTwh
  const netBuyTwh = +(buysTwh - sellsTwh).toFixed(1)
  const useTwh = Math.max(0.1, s.generationTwh + buysTwh - sellsTwh)
  const importSharePct = +((buysTwh / useTwh) * 100).toFixed(1)
  const netDependPct = +((Math.max(0, netBuyTwh) / useTwh) * 100).toFixed(1)
  const reservePct = +(((s.capacityGw - s.peakGw) / Math.max(0.1, s.peakGw)) * 100).toFixed(0)
  const isolation = isolationOf(s.abbr)
  const partners = t.importFrom
  const partnerCount = partners.length
  const concentration =
    partnerCount <= 0 ? (isolation === 'island-grid' ? 1 : 0.15) : +(1 / partnerCount).toFixed(2)
  const foreignPartners = partners.filter((p) => FOREIGN.has(p))
  const ai = projectStateDemand(s, 2030)
  const fuel = fuelShare(s)
  const zones = zonesFor(s.abbr)
  const interconnect = interconnectFor(s.abbr, zones)

  const factors: RiskFactor[] = []

  // Import share of energy use
  const importPts = Math.min(32, importSharePct * 0.38)
  if (importPts > 2) {
    factors.push({
      id: 'import-share',
      label: 'Import share of use',
      points: +importPts.toFixed(1),
      detail: `${importSharePct}% of apparent energy is bought in (${buysTwh} TWh).`,
    })
  }

  // Net buyer (structural deficit)
  if (netBuyTwh > 5) {
    const pts = Math.min(16, netBuyTwh * 0.22)
    factors.push({
      id: 'net-buyer',
      label: 'Structural net buyer',
      points: +pts.toFixed(1),
      detail: `Net purchase ${netBuyTwh} TWh/yr after sales.`,
    })
  }

  // Partner concentration
  if (partnerCount === 1) {
    factors.push({
      id: 'single-supplier',
      label: 'Single import path',
      points: 14,
      detail: `Nearly all buys from ${partners[0]}. Path outage is high-impact.`,
    })
  } else if (partnerCount === 2) {
    factors.push({
      id: 'dual-supplier',
      label: 'Two-partner concentration',
      points: 8,
      detail: `Buys from ${partners.join(' and ')}.`,
    })
  } else if (partnerCount === 0 && isolation !== 'island-grid') {
    factors.push({
      id: 'no-partners',
      label: 'Thin recorded partners',
      points: 4,
      detail: 'Little interstate buy book; self-serve or unmapped ties.',
    })
  }

  // Isolation
  if (isolation === 'island-grid') {
    factors.push({
      id: 'island',
      label: 'No interstate kWh path',
      points: 22,
      detail: 'Cannot buy grid energy from neighbors. Fuel ships are the backup.',
    })
  } else if (isolation === 'asynchronous') {
    factors.push({
      id: 'async',
      label: 'Asynchronous island (ERCOT)',
      points: 18,
      detail: 'Limited DC ties vs island size. Neighbor help is MW-small in a crisis.',
    })
  } else if (isolation === 'peninsula') {
    factors.push({
      id: 'peninsula',
      label: 'Peninsula topology',
      points: 10,
      detail: 'Few AC approaches. A seam or weather cut is more binding.',
    })
  }

  // Reserve
  if (reservePct < 12) {
    factors.push({
      id: 'thin-reserve',
      label: 'Thin nameplate vs peak',
      points: 14,
      detail: `Reserve ~${reservePct}%. Peak must be covered by imports or demand response.`,
    })
  } else if (reservePct < 25) {
    factors.push({
      id: 'modest-reserve',
      label: 'Modest reserve margin',
      points: 7,
      detail: `Reserve ~${reservePct}%.`,
    })
  }

  // AI / data-center load
  if (ai.aiPeakGw >= 6) {
    factors.push({
      id: 'ai-heavy',
      label: 'AI / DC load pressure (2030)',
      points: 14,
      detail: `~${ai.aiPeakGw.toFixed(1)} GW AI peak sample. Firm imports and new gas/nuclear matter.`,
    })
  } else if (ai.aiPeakGw >= 2.5) {
    factors.push({
      id: 'ai-rising',
      label: 'Rising AI corridor',
      points: 8,
      detail: `~${ai.aiPeakGw.toFixed(1)} GW AI peak by 2030 sample.`,
    })
  }

  // Fuel concentration
  if (fuel.sharePct >= 70 && ['Gas', 'Coal', 'Oil'].includes(fuel.primary)) {
    factors.push({
      id: 'fuel-conc',
      label: `${fuel.primary} fleet concentration`,
      points: 8,
      detail: `${fuel.sharePct}% of mapped capacity is ${fuel.primary}. Fuel or weather shock hits hard.`,
    })
  }

  // Foreign hydro / neighbor
  if (foreignPartners.length) {
    factors.push({
      id: 'foreign',
      label: 'Cross-border purchase',
      points: 6,
      detail: `Partners include ${foreignPartners.join(', ')} (treaty / hydro year risk).`,
    })
  }

  // Hydro-year for PNW exporters who still import some
  if (['WA', 'OR', 'CA', 'ID'].includes(s.abbr) && s.hydroGw > 3) {
    factors.push({
      id: 'hydro-year',
      label: 'Hydro-year sensitivity',
      points: 5,
      detail: 'West hydro drought can flip export hours into buy hours.',
    })
  }

  const riskScore = Math.min(99, Math.round(factors.reduce((a, f) => a + f.points, 0)))
  const band = bandOf(riskScore)

  let headline: string
  if (isolation === 'island-grid') {
    headline = `${s.name} cannot buy interstate kWh. Risk is fuel logistics, not interties.`
  } else if (netBuyTwh > 15) {
    headline = `${s.name} is a large net buyer (${netBuyTwh} TWh). ${importSharePct}% of use is imported.`
  } else if (netBuyTwh < -15) {
    headline = `${s.name} is a surplus seller (${Math.abs(netBuyTwh)} TWh net). Neighbors depend on it.`
  } else if (isolation === 'asynchronous') {
    headline = `${s.name} is mostly self-balanced on an asynchronous island. Crisis help is thin.`
  } else {
    headline = `${s.name} is near balanced on paper; residual risk is topology and fuel mix.`
  }

  return {
    abbr: s.abbr,
    name: s.name,
    region: s.region,
    lon: s.lon,
    lat: s.lat,
    grid: s.grid,
    interconnect,
    zones,
    generationTwh: s.generationTwh,
    peakGw: s.peakGw,
    capacityGw: s.capacityGw,
    buysTwh,
    sellsTwh,
    netBuyTwh,
    useTwh: +useTwh.toFixed(1),
    importSharePct,
    netDependPct,
    reservePct,
    isolation,
    partners,
    partnerCount,
    concentration,
    foreignPartners,
    aiPeak2030Gw: ai.aiPeakGw,
    primaryFuelSharePct: fuel.sharePct,
    primaryFuel: fuel.primary,
    factors,
    riskScore,
    band,
    headline,
    note: t.note,
  }
}

export function allDependencies(states = US_STATES): StateDependency[] {
  return states.map(analyzeState)
}

export function nationalDependency(states = US_STATES) {
  const rows = allDependencies(states)
  const buysTwh = +rows.reduce((a, r) => a + r.buysTwh, 0).toFixed(0)
  const sellsTwh = +rows.reduce((a, r) => a + r.sellsTwh, 0).toFixed(0)
  const netBuyers = rows.filter((r) => r.netBuyTwh > 1).length
  const netSellers = rows.filter((r) => r.netBuyTwh < -1).length
  const critical = rows.filter((r) => r.band === 'critical').length
  const exposed = rows.filter((r) => r.band === 'exposed').length
  const islands = rows.filter((r) => r.isolation === 'island-grid').length
  const topBuyers = [...rows].sort((a, b) => b.buysTwh - a.buysTwh).slice(0, 8)
  const topRisk = [...rows].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8)
  const avgRisk = +(rows.reduce((a, r) => a + r.riskScore, 0) / rows.length).toFixed(0)
  return {
    buysTwh,
    sellsTwh,
    netBuyers,
    netSellers,
    critical,
    exposed,
    islands,
    topBuyers,
    topRisk,
    avgRisk,
    count: rows.length,
  }
}

export function riskColor(band: RiskBand, dark: boolean): string {
  if (band === 'critical') return dark ? '#fb7185' : '#e11d48'
  if (band === 'exposed') return dark ? '#fb923c' : '#ea580c'
  if (band === 'watch') return dark ? '#facc15' : '#ca8a04'
  return dark ? '#4ade80' : '#16a34a'
}

export function interconnectColor(id: InterconnectId | 'island'): string {
  if (id === 'western') return '#22c55e'
  if (id === 'texas') return '#f59e0b'
  if (id === 'island') return '#64748b'
  return '#3b82f6'
}
