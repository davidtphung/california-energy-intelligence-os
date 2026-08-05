/**
 * California baseload + energy-density timeline (scenario-scale).
 * Density index is relative (nuclear ~100, solar fuel-equivalent ~0.01 on this scale)
 * for visual comparison, not a lab value.
 */

export type BaseloadLayer = 'density' | 'baseload' | 'firm' | 'gas'

export interface DensityStack {
  nuclear: number
  geothermal: number
  hydro: number
  gas: number
  storageFirm: number
  otherFirm: number
}

export interface BaseloadGate {
  id: string
  p: number
  year: number
  short: string
  title: string
  /** One-line peak callout on the chart */
  peak: string
  /** Relative fleet energy-density index (0-100) */
  densityIndex: number
  /** GW that can run as baseload / firm 24h-class */
  baseloadGw: number
  /** Share of peak coverable by firm resources (%) */
  firmPct: number
  /** Residual gas in firm stack (GW) */
  gasGw: number
  stack: DensityStack
  /** Icon key for timeline object */
  icon: 'atom' | 'flame' | 'geo' | 'water' | 'cell' | 'sun' | 'flag'
  gate: string
  today: string
  slip: string
  highlight?: boolean
}

export const BASELOAD_GATES: BaseloadGate[] = [
  {
    id: 'now',
    p: 0.03,
    year: 2025,
    short: 'Now',
    title: 'Dense core still holds',
    peak: 'Diablo 2.2 GW',
    densityIndex: 72,
    baseloadGw: 28.4,
    firmPct: 58,
    gasGw: 18.5,
    stack: {
      nuclear: 2.25,
      geothermal: 2.7,
      hydro: 6.2,
      gas: 18.5,
      storageFirm: 1.5,
      otherFirm: 1.25,
    },
    icon: 'atom',
    gate: 'Nuclear + geothermal + large hydro set the high-density floor. Gas still carries most firm MW overnight.',
    today: 'Diablo Canyon online under SB 846. Gas CCGTs dominate evening net peak when solar drops.',
    slip: 'If nuclear exits early without firm clean, density index falls hard and gas rises.',
    highlight: true,
  },
  {
    id: 'y28',
    p: 0.18,
    year: 2028,
    short: "'28",
    title: 'Storage firms the shoulder',
    peak: 'BESS 4h class',
    densityIndex: 68,
    baseloadGw: 30.1,
    firmPct: 61,
    gasGw: 17.2,
    stack: {
      nuclear: 2.25,
      geothermal: 3.0,
      hydro: 6.0,
      gas: 17.2,
      storageFirm: 3.5,
      otherFirm: 1.15,
    },
    icon: 'cell',
    gate: 'Four-hour batteries start counting as evening firm. Density of the fleet dips as storage (low mass-energy) scales.',
    today: 'Most new capacity is solar + short-duration BESS. True baseload additions are slow.',
    slip: 'Without multi-day storage pilots, density stays gas-tied after sunset.',
  },
  {
    id: 'y30',
    p: 0.34,
    year: 2030,
    short: "'30",
    title: 'Statutory clean gate',
    peak: '60% path',
    densityIndex: 70,
    baseloadGw: 32.8,
    firmPct: 64,
    gasGw: 15.0,
    stack: {
      nuclear: 2.25,
      geothermal: 3.6,
      hydro: 5.8,
      gas: 15.0,
      storageFirm: 5.0,
      otherFirm: 1.15,
    },
    icon: 'flag',
    gate: 'RPS / clean interim. Diablo still in the stack. Geothermal and hybrids lift firm clean without gas.',
    today: 'Interconnection and RA products decide whether firm clean arrives on time.',
    slip: 'Missed firm procurement replaces dense nuclear/gas with more gas runtime, not density.',
    highlight: true,
  },
  {
    id: 'y33',
    p: 0.5,
    year: 2033,
    short: "'33",
    title: 'Gas exit pressure',
    peak: 'Gas -4 GW',
    densityIndex: 66,
    baseloadGw: 31.5,
    firmPct: 63,
    gasGw: 11.0,
    stack: {
      nuclear: 2.25,
      geothermal: 4.2,
      hydro: 5.5,
      gas: 11.0,
      storageFirm: 7.0,
      otherFirm: 1.55,
    },
    icon: 'flame',
    gate: 'Aging peakers and once-through cooling retirements cut gas baseload. Density falls unless geothermal and nuclear hold.',
    today: 'Local capacity areas still need gas on extreme heat days.',
    slip: 'Retire gas before firm clean lands and reserve margin becomes a density problem.',
  },
  {
    id: 'y35',
    p: 0.64,
    year: 2035,
    short: "'35",
    title: 'Firm clean stack',
    peak: 'Geo + LDES',
    densityIndex: 74,
    baseloadGw: 36.0,
    firmPct: 70,
    gasGw: 8.0,
    stack: {
      nuclear: 2.25,
      geothermal: 5.5,
      hydro: 5.4,
      gas: 8.0,
      storageFirm: 12.0,
      otherFirm: 2.85,
    },
    icon: 'geo',
    gate: 'Geothermal and long-duration storage rebuild the dense floor without gas. Hydro stays the flexible baseload partner.',
    today: 'LDES and enhanced geothermal are the open industrial bets.',
    slip: 'Dry hydro years without LDES force residual gas back into baseload duty.',
  },
  {
    id: 'y40',
    p: 0.8,
    year: 2040,
    short: "'40",
    title: 'Near firm clean',
    peak: '94% clean',
    densityIndex: 78,
    baseloadGw: 40.5,
    firmPct: 78,
    gasGw: 4.0,
    stack: {
      nuclear: 2.25,
      geothermal: 7.0,
      hydro: 5.2,
      gas: 4.0,
      storageFirm: 18.0,
      otherFirm: 4.05,
    },
    icon: 'water',
    gate: 'Gas is contingency, not baseload. Density index rises again as firm clean replaces thermal fill.',
    today: 'Seasonal storage and advanced nuclear SMRs are still pre-scale in this case.',
    slip: 'If Diablo-class capacity leaves without replacement, density and firm % both drop.',
  },
  {
    id: 'y45',
    p: 0.97,
    year: 2045,
    short: "'45",
    title: 'SB 100 firm end-state',
    peak: '100% clean',
    densityIndex: 82,
    baseloadGw: 44.0,
    firmPct: 85,
    gasGw: 1.0,
    stack: {
      nuclear: 2.25,
      geothermal: 8.5,
      hydro: 5.0,
      gas: 1.0,
      storageFirm: 22.0,
      otherFirm: 5.25,
    },
    icon: 'sun',
    gate: 'Retail sales are clean. Residual gas is emergency only. Baseload is nuclear, geo, hydro, and multi-day storage.',
    today: 'The last 10 pts of firm clean decide whether density stays high without fossil fuel.',
    slip: 'Transmission and firm capacity, not nameplate solar, gate this outcome.',
    highlight: true,
  },
]

export const BASELOAD_LAYERS: {
  id: BaseloadLayer
  label: string
  hint: string
}[] = [
  {
    id: 'density',
    label: 'Density',
    hint: 'Relative fleet energy-density index (nuclear-weighted)',
  },
  {
    id: 'baseload',
    label: 'Baseload GW',
    hint: 'MW that can run as round-the-clock firm supply',
  },
  {
    id: 'firm',
    label: 'Firm %',
    hint: 'Share of peak coverable by firm resources',
  },
  {
    id: 'gas',
    label: 'Gas residual',
    hint: 'Gas still in the firm / baseload stack',
  },
]

export function baseloadMetric(
  g: BaseloadGate,
  layer: BaseloadLayer
): { value: string; unit: string; raw: number } {
  switch (layer) {
    case 'baseload':
      return { value: g.baseloadGw.toFixed(1), unit: 'GW', raw: g.baseloadGw }
    case 'firm':
      return { value: g.firmPct.toFixed(0), unit: '%', raw: g.firmPct }
    case 'gas':
      return { value: g.gasGw.toFixed(1), unit: 'GW gas', raw: g.gasGw }
    default:
      return { value: g.densityIndex.toFixed(0), unit: 'idx', raw: g.densityIndex }
  }
}

/** Normalize 0-1 for curve height (gas residual inverted so higher = less gas) */
export function baseloadCurveY(g: BaseloadGate, layer: BaseloadLayer): number {
  switch (layer) {
    case 'baseload':
      return (g.baseloadGw - 26) / (46 - 26)
    case 'firm':
      return (g.firmPct - 55) / (90 - 55)
    case 'gas':
      return 1 - (g.gasGw - 0) / 20
    default:
      return (g.densityIndex - 60) / (90 - 60)
  }
}

/** Approximate volumetric / mass energy density ranking labels for the detail table */
export const DENSITY_RANK = [
  { tech: 'Nuclear (UO2 class)', rel: '100', note: 'Highest grid-scale energy density' },
  { tech: 'Natural gas (pipeline)', rel: '12', note: 'Dense chemical fuel; CO2 cost' },
  { tech: 'Geothermal (reservoir)', rel: '8', note: 'Firm renewable; site limited' },
  { tech: 'Large hydro', rel: '5', note: 'Stored gravitational energy; drought risk' },
  { tech: 'Li-ion BESS (4h)', rel: '0.4', note: 'Power density high; energy duration limited' },
  { tech: 'Solar PV (land)', rel: '0.05', note: 'Low capacity factor; not baseload alone' },
  { tech: 'Wind (land)', rel: '0.04', note: 'Variable; correlates poorly with CA peak heat' },
] as const
