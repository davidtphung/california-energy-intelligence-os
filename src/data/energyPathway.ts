/** California clean-energy pathway — scenario-scale sample for the pathway map */

export type PathwayGateId =
  | 'now'
  | 'y27'
  | 'y30'
  | 'y33'
  | 'y35'
  | 'y40'
  | 'y45'

export type PathwayLayer = 'pathway' | 'capacity' | 'storage' | 'reliability'

export interface PathwayGate {
  id: PathwayGateId
  /** Position along timeline 0–1 */
  p: number
  year: number
  label: string
  short: string
  title: string
  gate: string
  today: string
  slip: string
  cleanPct: number
  peakGw: number
  capacityGw: number
  storageGw: number
  solarGw: number
  windGw: number
  gasGw: number
  reservePct: number
  emissionsMt: number
  netImportsGw: number
  highlight?: boolean
  peakCallout?: string
}

export const PATHWAY_GATES: PathwayGate[] = [
  {
    id: 'now',
    p: 0.02,
    year: 2025,
    label: 'Now',
    short: 'Now',
    title: 'Baseline grid',
    gate: 'Read the system as-built: capacity, clean share, reserve, imports.',
    today: 'Solar ~42 GW · battery ~13 GW · clean share mid-50s · Path 26 still binds midday.',
    slip: 'Without storage cadence, evening peaks stay gas-heavy.',
    cleanPct: 56,
    peakGw: 49.1,
    capacityGw: 124,
    storageGw: 13.5,
    solarGw: 42.5,
    windGw: 7.8,
    gasGw: 38,
    reservePct: 18.2,
    emissionsMt: 42,
    netImportsGw: 8.4,
  },
  {
    id: 'y27',
    p: 0.16,
    year: 2027,
    label: "'27",
    short: "'27",
    title: 'Storage scale-up',
    gate: '4-hour BESS covers the first evening ramp; RA showings clear summer stress.',
    today: 'Most new storage is 4h; duration product still immature.',
    slip: 'If build slips one year, 2028 heat waves re-open gas peakers.',
    cleanPct: 62,
    peakGw: 51.4,
    capacityGw: 138,
    storageGw: 22,
    solarGw: 52,
    windGw: 9.5,
    gasGw: 36,
    reservePct: 17.5,
    emissionsMt: 36,
    netImportsGw: 8.0,
    peakCallout: 'BESS 22 GW',
  },
  {
    id: 'y30',
    p: 0.32,
    year: 2030,
    label: "'30",
    short: "'30",
    title: '60% RPS / SB 100 interim',
    gate: 'Statutory 60% renewable / clean trajectory; Diablo Canyon still in the stack under SB 846.',
    today: 'RPS compliance is on track in mid cases; transmission remains the soft constraint.',
    slip: 'Missed interconnection queues move clean share 3–5 pts later.',
    cleanPct: 68,
    peakGw: 54.8,
    capacityGw: 158,
    storageGw: 32,
    solarGw: 68,
    windGw: 14,
    gasGw: 32,
    reservePct: 16.8,
    emissionsMt: 30,
    netImportsGw: 7.2,
    highlight: true,
    peakCallout: '60% clean path',
  },
  {
    id: 'y33',
    p: 0.48,
    year: 2033,
    label: "'33",
    short: "'33",
    title: 'Gas exit wave',
    gate: 'Once-through cooling / aging peaker retirements; multi-day storage starts to matter.',
    today: 'Local reliability areas still depend on gas in extreme heat.',
    slip: 'Without long-duration pilots, retirements pause in coastal air basins.',
    cleanPct: 76,
    peakGw: 58.2,
    capacityGw: 175,
    storageGw: 42,
    solarGw: 82,
    windGw: 18,
    gasGw: 24,
    reservePct: 16.2,
    emissionsMt: 22,
    netImportsGw: 6.5,
    peakCallout: 'Gas −14 GW',
  },
  {
    id: 'y35',
    p: 0.62,
    year: 2035,
    label: "'35",
    short: "'35",
    title: 'Firm clean stack',
    gate: 'Geothermal + hybrid solar+storage + imports contracts close the evening net peak.',
    today: 'Firm clean procurement is the binding IRP gap in several LSEs.',
    slip: 'A dry hydro year without extra storage reopens reserve-margin risk.',
    cleanPct: 84,
    peakGw: 61.5,
    capacityGw: 192,
    storageGw: 52,
    solarGw: 95,
    windGw: 22,
    gasGw: 18,
    reservePct: 15.8,
    emissionsMt: 14,
    netImportsGw: 5.8,
  },
  {
    id: 'y40',
    p: 0.8,
    year: 2040,
    label: "'40",
    short: "'40",
    title: 'Near-zero residual gas',
    gate: 'Gas retained only for rare contingency; seasonal storage + demand response online.',
    today: 'Seasonal storage remains pre-commercial at GW scale.',
    slip: 'Without seasonal options, residual gas stays for heat waves.',
    cleanPct: 94,
    peakGw: 66.0,
    capacityGw: 210,
    storageGw: 68,
    solarGw: 110,
    windGw: 28,
    gasGw: 8,
    reservePct: 15.2,
    emissionsMt: 6,
    netImportsGw: 4.5,
    peakCallout: '94% clean',
  },
  {
    id: 'y45',
    p: 0.98,
    year: 2045,
    label: "'45",
    short: "'45",
    title: 'SB 100 destination',
    gate: '100% clean retail sales — the statutory end state; residual firming is non-emitting.',
    today: 'Pathway exists on paper; last 6–10 pts need firm clean + flexibility.',
    slip: 'The last decade is won or lost on transmission and firm capacity.',
    cleanPct: 100,
    peakGw: 70.2,
    capacityGw: 228,
    storageGw: 80,
    solarGw: 125,
    windGw: 32,
    gasGw: 2,
    reservePct: 14.8,
    emissionsMt: 2,
    netImportsGw: 3.8,
    highlight: true,
    peakCallout: 'SB 100',
  },
]

export const PATHWAY_LAYERS: { id: PathwayLayer; label: string; hint: string }[] = [
  { id: 'pathway', label: 'Pathway', hint: 'Clean-share trajectory & statutory gates' },
  { id: 'capacity', label: 'Capacity', hint: 'Nameplate buildout by major tech' },
  { id: 'storage', label: 'Storage', hint: 'Battery power & evening coverage' },
  { id: 'reliability', label: 'Reliability', hint: 'Peak load, reserve, residual gas' },
]

/** Metric used for the upper “peak” callouts per layer */
export function gateMetric(gate: PathwayGate, layer: PathwayLayer): { value: string; unit: string } {
  switch (layer) {
    case 'capacity':
      return { value: gate.capacityGw.toFixed(0), unit: 'GW cap' }
    case 'storage':
      return { value: gate.storageGw.toFixed(0), unit: 'GW BESS' }
    case 'reliability':
      return { value: gate.reservePct.toFixed(1), unit: '% reserve' }
    default:
      return { value: gate.cleanPct.toFixed(0), unit: '% clean' }
  }
}

/** Normalize 0–1 for curve height from layer metric */
export function gateCurveY(gate: PathwayGate, layer: PathwayLayer): number {
  switch (layer) {
    case 'capacity':
      return (gate.capacityGw - 120) / (230 - 120)
    case 'storage':
      return gate.storageGw / 85
    case 'reliability':
      return (gate.reservePct - 14) / 6
    default:
      return (gate.cleanPct - 50) / 50
  }
}
