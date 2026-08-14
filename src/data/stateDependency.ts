/**
 * State electricity purchase, import dependence, and risk.
 * Combines trade, fleet mix, interconnect isolation, AI load, and partner concentration.
 * Educational sample path (not NERC RAS / IRP).
 */

import { US_STATES, type USStateEnergy } from './usStates'
import { tradeOf, type StateTrade } from './energyTrade'
import {
  GRID_ZONES,
  UTILITIES,
  zoneById,
  type GridZoneId,
  type InterconnectId,
  type UtilityCompany,
} from './gridUtilities'
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

export type UtilityRole = 'lse' | 'wires' | 'genco' | 'federal' | 'iso'

export interface UtilityStateSlice {
  abbr: string
  weight: number
  buysTwh: number
  importSharePct: number
  riskScore: number
}

export interface UtilityDependency {
  id: string
  name: string
  short: string
  kind: UtilityCompany['kind']
  role: UtilityRole
  lon: number
  lat: number
  zoneId: GridZoneId
  alsoZones: GridZoneId[]
  interconnect: InterconnectId | 'island'
  states: string[]
  customersM: number
  buysTwh: number
  sellsTwh: number
  netBuyTwh: number
  importSharePct: number
  aiPeak2030Gw: number
  riskScore: number
  band: RiskBand
  factors: RiskFactor[]
  slices: UtilityStateSlice[]
  headline: string
  note: string
}

const WIRES_IDS = new Set(['oncor', 'centerpoint', 'aep-texas'])

export function utilityRole(u: UtilityCompany): UtilityRole {
  if (u.kind === 'iso') return 'iso'
  if (u.kind === 'merchant') return 'genco'
  if (u.kind === 'federal') return 'federal'
  if (WIRES_IDS.has(u.id)) return 'wires'
  return 'lse'
}

function utilWeight(u: UtilityCompany): number {
  return Math.max(0.25, u.customersM ?? (u.kind === 'federal' ? 2.2 : 0.5))
}

/** Share of a state's mapped retail/federal book this utility represents */
function stateUtilityShares(): Map<string, { u: UtilityCompany; share: number }[]> {
  const byState = new Map<string, UtilityCompany[]>()
  for (const u of UTILITIES) {
    if (u.kind === 'iso' || u.kind === 'merchant') continue
    for (const st of u.states) {
      const list = byState.get(st) ?? []
      list.push(u)
      byState.set(st, list)
    }
  }
  const out = new Map<string, { u: UtilityCompany; share: number }[]>()
  for (const [st, list] of byState) {
    const tot = list.reduce((a, u) => a + utilWeight(u), 0)
    out.set(
      st,
      list.map((u) => ({ u, share: utilWeight(u) / tot }))
    )
  }
  return out
}

export function analyzeUtility(
  u: UtilityCompany,
  stateRows?: StateDependency[]
): UtilityDependency {
  const rows = stateRows ?? allDependencies()
  const byAbbr = new Map(rows.map((r) => [r.abbr, r]))
  const shares = stateUtilityShares()
  const role = utilityRole(u)
  const z = zoneById(u.zoneId)
  const interconnect = (z?.interconnect ?? 'eastern') as InterconnectId | 'island'

  const slices: UtilityStateSlice[] = []
  let buysTwh = 0
  let sellsTwh = 0
  let useWeighted = 0
  let importAcc = 0
  let riskAcc = 0
  let aiPeak2030Gw = 0
  let wSum = 0

  for (const st of u.states) {
    const s = byAbbr.get(st)
    if (!s) continue
    const share = shares.get(st)?.find((x) => x.u.id === u.id)?.share ?? 1 / Math.max(1, u.states.length)
    const w = share
    const buy = +(s.buysTwh * share).toFixed(2)
    const sell = +(s.sellsTwh * share).toFixed(2)
    slices.push({
      abbr: st,
      weight: +share.toFixed(3),
      buysTwh: buy,
      importSharePct: s.importSharePct,
      riskScore: s.riskScore,
    })
    buysTwh += buy
    sellsTwh += sell
    useWeighted += s.useTwh * share
    importAcc += s.importSharePct * w
    riskAcc += s.riskScore * w
    aiPeak2030Gw += s.aiPeak2030Gw * share
    wSum += w
  }

  // Role adjustments: wires buy almost all delivered energy; gencos sell
  if (role === 'wires') {
    buysTwh = +(buysTwh * 1.35 + useWeighted * 0.25).toFixed(1)
    sellsTwh = +(sellsTwh * 0.15).toFixed(1)
  } else if (role === 'genco') {
    sellsTwh = +(Math.max(sellsTwh, buysTwh) * 1.6 + 8).toFixed(1)
    buysTwh = +(buysTwh * 0.15).toFixed(1)
  } else if (role === 'federal') {
    sellsTwh = +(sellsTwh * 1.4 + 6).toFixed(1)
  }

  buysTwh = +buysTwh.toFixed(1)
  sellsTwh = +sellsTwh.toFixed(1)
  const netBuyTwh = +(buysTwh - sellsTwh).toFixed(1)
  const importSharePct = wSum > 0 ? +(importAcc / wSum).toFixed(1) : 0
  let baseRisk = wSum > 0 ? riskAcc / wSum : 20

  const factors: RiskFactor[] = []
  if (role === 'wires') {
    factors.push({
      id: 'wires',
      label: 'Wires-only purchaser',
      points: 12,
      detail: 'T&D utility buys nearly all energy from the market / affiliates for load.',
    })
    baseRisk += 12
  }
  if (role === 'genco') {
    factors.push({
      id: 'genco',
      label: 'Merchant generator',
      points: 5,
      detail: 'Sells into the market. Price and congestion risk more than import dependence.',
    })
    baseRisk += 5
  }
  if ((u.alsoZones?.length ?? 0) > 0) {
    factors.push({
      id: 'multizone',
      label: 'Multi-zone operator',
      points: 7,
      detail: `Also in ${(u.alsoZones ?? []).join(', ')}. Seam and RA rules stack.`,
    })
    baseRisk += 7
  }
  if (aiPeak2030Gw >= 4) {
    factors.push({
      id: 'ai',
      label: 'AI / DC in footprint',
      points: 10,
      detail: `Allocated ~${aiPeak2030Gw.toFixed(1)} GW AI peak (2030 sample) across served states.`,
    })
    baseRisk += 10
  } else if (aiPeak2030Gw >= 1.5) {
    factors.push({
      id: 'ai-mod',
      label: 'Rising AI in footprint',
      points: 5,
      detail: `Allocated ~${aiPeak2030Gw.toFixed(1)} GW AI peak (2030).`,
    })
    baseRisk += 5
  }
  if (netBuyTwh > 8) {
    const pts = Math.min(12, netBuyTwh * 0.18)
    factors.push({
      id: 'net-buy',
      label: 'Allocated net buyer',
      points: +pts.toFixed(1),
      detail: `Net purchase ~${netBuyTwh} TWh after allocated state trade.`,
    })
    baseRisk += pts
  }
  if (u.states.length === 1) {
    const s = byAbbr.get(u.states[0])
    if (s && s.isolation !== 'continental') {
      factors.push({
        id: 'iso-topo',
        label: `Footprint: ${s.isolation}`,
        points: 6,
        detail: `${s.name} topology carries through to this utility.`,
      })
      baseRisk += 6
    }
  }

  // Pull top state factors (deduped)
  const seen = new Set(factors.map((f) => f.id))
  for (const sl of slices.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, 2)) {
    const s = byAbbr.get(sl.abbr)
    if (!s) continue
    for (const f of s.factors.slice(0, 2)) {
      const id = `${sl.abbr}-${f.id}`
      if (seen.has(id)) continue
      seen.add(id)
      factors.push({
        id,
        label: `${sl.abbr}: ${f.label}`,
        points: +(f.points * sl.weight).toFixed(1),
        detail: f.detail,
      })
    }
  }

  const riskScore = Math.min(99, Math.round(baseRisk))
  const band = bandOf(riskScore)

  let headline: string
  if (role === 'iso') {
    headline = `${u.short} is a grid operator, not a load-serving buyer.`
  } else if (role === 'wires') {
    headline = `${u.short} is wires-only: it purchases energy for load and does not self-serve generation.`
  } else if (role === 'genco') {
    headline = `${u.short} is a merchant seller. Dependence is market/congestion, not retail imports.`
  } else if (role === 'federal') {
    headline = `${u.short} markets federal / public power across ${u.states.length} states.`
  } else if (netBuyTwh > 5) {
    headline = `${u.short} is an allocated net buyer (~${netBuyTwh} TWh) across ${u.states.join(', ')}.`
  } else {
    headline = `${u.short} is near balanced or a net seller on allocated state trade.`
  }

  return {
    id: u.id,
    name: u.name,
    short: u.short,
    kind: u.kind,
    role,
    lon: u.lon,
    lat: u.lat,
    zoneId: u.zoneId,
    alsoZones: u.alsoZones ?? [],
    interconnect,
    states: u.states,
    customersM: u.customersM ?? 0,
    buysTwh,
    sellsTwh,
    netBuyTwh,
    importSharePct,
    aiPeak2030Gw: +aiPeak2030Gw.toFixed(2),
    riskScore,
    band,
    factors,
    slices,
    headline,
    note: u.note,
  }
}

export function allUtilityDependencies(): UtilityDependency[] {
  const states = allDependencies()
  return UTILITIES.filter((u) => u.kind !== 'iso').map((u) => analyzeUtility(u, states))
}

export function nationalUtilityDependency() {
  const rows = allUtilityDependencies()
  return {
    count: rows.length,
    buysTwh: +rows.reduce((a, r) => a + r.buysTwh, 0).toFixed(0),
    netBuyers: rows.filter((r) => r.netBuyTwh > 1).length,
    critical: rows.filter((r) => r.band === 'critical').length,
    exposed: rows.filter((r) => r.band === 'exposed').length,
    avgRisk: +(rows.reduce((a, r) => a + r.riskScore, 0) / Math.max(1, rows.length)).toFixed(0),
    topBuyers: [...rows].sort((a, b) => b.buysTwh - a.buysTwh).slice(0, 8),
    topRisk: [...rows].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8),
  }
}
