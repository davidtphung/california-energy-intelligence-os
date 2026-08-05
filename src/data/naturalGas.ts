/**
 * US natural gas production and export tracking (EIA-scale educational samples).
 * Units: Bcf/d (billion cubic feet per day) and Bcf/yr unless noted.
 * Replace with EIA Natural Gas Monthly / API series in production.
 */

export interface GasYearPoint {
  year: number
  /** Dry gas marketed production, Bcf/d annual average */
  productionBcfd: number
  /** Gross withdrawals proxy (slightly above dry), Bcf/d */
  grossBcfd: number
  /** Total consumption, Bcf/d */
  consumptionBcfd: number
  /** Pipeline exports (mainly Mexico + Canada), Bcf/d */
  pipelineExportBcfd: number
  /** LNG exports, Bcf/d */
  lngExportBcfd: number
  /** Pipeline + LNG imports, Bcf/d */
  importsBcfd: number
  /** Working gas in storage end-of-year proxy, Tcf */
  storageTcf: number
  note?: string
}

export interface GasStateProduction {
  abbr: string
  name: string
  /** Annual dry gas production, Bcf/yr (latest sample year) */
  productionBcf: number
  /** Share of US dry production % */
  sharePct: number
  /** YoY change % (sample) */
  yoyPct: number
  region: string
  note: string
}

export interface GasExportRoute {
  id: string
  label: string
  kind: 'lng' | 'pipeline'
  /** Bcf/d sample */
  bcfd: number
  shareOfExportsPct: number
  partners: string[]
  note: string
}

export interface LngTerminal {
  id: string
  name: string
  stateAbbr: string
  /** Nominal export capacity Bcf/d (approx) */
  capacityBcfd: number
  status: 'operating' | 'under-construction' | 'proposed'
  coast: 'Gulf' | 'Atlantic' | 'Pacific' | 'Other'
}

/** National annual averages - production & trade (newest last in file; UI sorts newest first) */
export const US_GAS_ANNUAL: GasYearPoint[] = [
  {
    year: 2015,
    productionBcfd: 74.1,
    grossBcfd: 79.2,
    consumptionBcfd: 74.6,
    pipelineExportBcfd: 4.8,
    lngExportBcfd: 0.1,
    importsBcfd: 7.4,
    storageTcf: 3.9,
    note: 'Pre-LNG boom; net pipeline importer from Canada still material.',
  },
  {
    year: 2016,
    productionBcfd: 72.9,
    grossBcfd: 78.0,
    consumptionBcfd: 75.1,
    pipelineExportBcfd: 5.6,
    lngExportBcfd: 0.5,
    importsBcfd: 7.8,
    storageTcf: 3.8,
  },
  {
    year: 2017,
    productionBcfd: 74.8,
    grossBcfd: 80.1,
    consumptionBcfd: 74.3,
    pipelineExportBcfd: 6.2,
    lngExportBcfd: 1.9,
    importsBcfd: 8.1,
    storageTcf: 3.7,
  },
  {
    year: 2018,
    productionBcfd: 83.8,
    grossBcfd: 89.5,
    consumptionBcfd: 82.0,
    pipelineExportBcfd: 7.1,
    lngExportBcfd: 3.0,
    importsBcfd: 7.9,
    storageTcf: 3.2,
    note: 'Permian / Appalachia growth; LNG Sabine Pass ramp.',
  },
  {
    year: 2019,
    productionBcfd: 92.0,
    grossBcfd: 98.5,
    consumptionBcfd: 85.0,
    pipelineExportBcfd: 7.8,
    lngExportBcfd: 4.7,
    importsBcfd: 7.5,
    storageTcf: 3.3,
  },
  {
    year: 2020,
    productionBcfd: 91.5,
    grossBcfd: 97.8,
    consumptionBcfd: 83.3,
    pipelineExportBcfd: 7.9,
    lngExportBcfd: 6.5,
    importsBcfd: 7.0,
    storageTcf: 3.5,
    note: 'COVID demand dip; production resilient.',
  },
  {
    year: 2021,
    productionBcfd: 93.6,
    grossBcfd: 100.1,
    consumptionBcfd: 83.0,
    pipelineExportBcfd: 8.3,
    lngExportBcfd: 9.8,
    importsBcfd: 7.2,
    storageTcf: 3.2,
    note: 'Europe LNG pull begins into winter.',
  },
  {
    year: 2022,
    productionBcfd: 98.1,
    grossBcfd: 105.0,
    consumptionBcfd: 88.5,
    pipelineExportBcfd: 8.6,
    lngExportBcfd: 10.6,
    importsBcfd: 7.8,
    storageTcf: 3.1,
    note: 'Record exports after Russia-Ukraine energy shock.',
  },
  {
    year: 2023,
    productionBcfd: 103.8,
    grossBcfd: 111.2,
    consumptionBcfd: 89.0,
    pipelineExportBcfd: 8.9,
    lngExportBcfd: 11.9,
    importsBcfd: 8.0,
    storageTcf: 3.4,
    note: 'US among top global LNG exporters by capacity/utilization.',
  },
  {
    year: 2024,
    productionBcfd: 105.5,
    grossBcfd: 113.0,
    consumptionBcfd: 90.2,
    pipelineExportBcfd: 9.1,
    lngExportBcfd: 12.4,
    importsBcfd: 8.1,
    storageTcf: 3.5,
    note: 'Sample: dry gas near record; LNG + Mexico pipeline dominate exports.',
  },
  {
    year: 2025,
    productionBcfd: 107.2,
    grossBcfd: 114.8,
    consumptionBcfd: 91.0,
    pipelineExportBcfd: 9.3,
    lngExportBcfd: 13.1,
    importsBcfd: 8.0,
    storageTcf: 3.4,
    note: 'Planning sample year; wire to EIA Natural Gas Monthly for live figures.',
  },
]

/** Latest full year used for state tables (sample) */
export const GAS_REF_YEAR = 2024

/** State dry gas production (Bcf/yr) - sums approximate national dry output scale */
export const GAS_STATE_PRODUCTION: GasStateProduction[] = [
  { abbr: 'TX', name: 'Texas', productionBcf: 11800, sharePct: 30.6, yoyPct: 3.2, region: 'Southwest', note: 'Permian + Haynesville; largest producer and LNG feedstock corridor.' },
  { abbr: 'PA', name: 'Pennsylvania', productionBcf: 7600, sharePct: 19.7, yoyPct: 1.1, region: 'Northeast', note: 'Marcellus / Utica core.' },
  { abbr: 'LA', name: 'Louisiana', productionBcf: 4200, sharePct: 10.9, yoyPct: 4.5, region: 'Southeast', note: 'Haynesville + LNG coast infrastructure.' },
  { abbr: 'WV', name: 'West Virginia', productionBcf: 2800, sharePct: 7.3, yoyPct: 2.0, region: 'Southeast', note: 'Appalachian dry gas; pipeline east and Gulf.' },
  { abbr: 'OK', name: 'Oklahoma', productionBcf: 2600, sharePct: 6.7, yoyPct: -0.5, region: 'Southwest', note: 'STACK/SCOOP and Anadarko systems.' },
  { abbr: 'OH', name: 'Ohio', productionBcf: 2400, sharePct: 6.2, yoyPct: 1.8, region: 'Midwest', note: 'Utica shale growth plateauing.' },
  { abbr: 'NM', name: 'New Mexico', productionBcf: 2200, sharePct: 5.7, yoyPct: 5.0, region: 'Southwest', note: 'Delaware Basin (Permian) growth.' },
  { abbr: 'ND', name: 'North Dakota', productionBcf: 1100, sharePct: 2.9, yoyPct: 2.2, region: 'Midwest', note: 'Bakken associated gas; flaring policy relevant.' },
  { abbr: 'CO', name: 'Colorado', productionBcf: 1900, sharePct: 4.9, yoyPct: -1.2, region: 'Mountain', note: 'DJ / Piceance; methane rules tight.' },
  { abbr: 'WY', name: 'Wyoming', productionBcf: 1400, sharePct: 3.6, yoyPct: -2.0, region: 'Mountain', note: 'Rockies pipeline gas.' },
  { abbr: 'AR', name: 'Arkansas', productionBcf: 550, sharePct: 1.4, yoyPct: -3.0, region: 'Southeast', note: 'Fayetteville mature.' },
  { abbr: 'AK', name: 'Alaska', productionBcf: 320, sharePct: 0.8, yoyPct: 0.5, region: 'Alaska / Hawaii', note: 'Cook Inlet + North Slope; limited Lower 48 pipeline link.' },
  { abbr: 'UT', name: 'Utah', productionBcf: 280, sharePct: 0.7, yoyPct: -1.0, region: 'Mountain', note: 'Uinta Basin.' },
  { abbr: 'CA', name: 'California', productionBcf: 140, sharePct: 0.4, yoyPct: -4.0, region: 'Pacific', note: 'Declining in-state production; major consumer and net importer.' },
  { abbr: 'VA', name: 'Virginia', productionBcf: 110, sharePct: 0.3, yoyPct: 0.0, region: 'Southeast', note: 'Appalachian edge production.' },
  { abbr: 'KY', name: 'Kentucky', productionBcf: 90, sharePct: 0.2, yoyPct: -2.5, region: 'Southeast', note: 'Mature Appalachian fields.' },
  { abbr: 'AL', name: 'Alabama', productionBcf: 85, sharePct: 0.2, yoyPct: -1.5, region: 'Southeast', note: 'Black Warrior / Gulf Coast.' },
  { abbr: 'MS', name: 'Mississippi', productionBcf: 50, sharePct: 0.1, yoyPct: -2.0, region: 'Southeast', note: 'Small dry gas; storage regionally important.' },
  { abbr: 'MI', name: 'Michigan', productionBcf: 70, sharePct: 0.2, yoyPct: -3.0, region: 'Midwest', note: 'Antrim mature; storage hub.' },
  { abbr: 'MT', name: 'Montana', productionBcf: 45, sharePct: 0.1, yoyPct: -1.0, region: 'Mountain', note: 'Williston edge / conventional.' },
  { abbr: 'other', name: 'All other states', productionBcf: 1200, sharePct: 3.1, yoyPct: 0.5, region: 'Mixed', note: 'Remainder of US dry gas production sample.' },
]

export const GAS_EXPORT_ROUTES: GasExportRoute[] = [
  {
    id: 'lng-europe',
    label: 'LNG to Europe',
    kind: 'lng',
    bcfd: 5.8,
    shareOfExportsPct: 27,
    partners: ['UK', 'Netherlands', 'France', 'Spain', 'Germany (via terminals)'],
    note: 'Spot and term cargoes; post-2022 structural demand.',
  },
  {
    id: 'lng-asia',
    label: 'LNG to Asia',
    kind: 'lng',
    bcfd: 4.2,
    shareOfExportsPct: 19,
    partners: ['Japan', 'South Korea', 'China', 'India', 'Taiwan'],
    note: 'Long-term SPA cargoes plus spot.',
  },
  {
    id: 'lng-latam',
    label: 'LNG to Latin America / Caribbean',
    kind: 'lng',
    bcfd: 1.6,
    shareOfExportsPct: 7,
    partners: ['Mexico (West Coast via re-export)', 'Brazil', 'Argentina', 'Chile'],
    note: 'Seasonal and arbitrage cargoes.',
  },
  {
    id: 'pipe-mexico',
    label: 'Pipeline to Mexico',
    kind: 'pipeline',
    bcfd: 6.2,
    shareOfExportsPct: 29,
    partners: ['Mexico'],
    note: 'Largest pipeline export market; power generation demand in Mexico.',
  },
  {
    id: 'pipe-canada',
    label: 'Pipeline to Canada',
    kind: 'pipeline',
    bcfd: 2.9,
    shareOfExportsPct: 13,
    partners: ['Canada'],
    note: 'Two-way trade; net flows vary by region and season.',
  },
  {
    id: 'lng-other',
    label: 'LNG other / reloads',
    kind: 'lng',
    bcfd: 0.8,
    shareOfExportsPct: 4,
    partners: ['Middle East', 'Africa', 'Other'],
    note: 'Smaller markets and opportunistic cargoes.',
  },
]

export const LNG_TERMINALS: LngTerminal[] = [
  { id: 'sabine', name: 'Sabine Pass', stateAbbr: 'LA', capacityBcfd: 4.0, status: 'operating', coast: 'Gulf' },
  { id: 'corpus', name: 'Corpus Christi', stateAbbr: 'TX', capacityBcfd: 2.4, status: 'operating', coast: 'Gulf' },
  { id: 'cameron', name: 'Cameron LNG', stateAbbr: 'LA', capacityBcfd: 2.0, status: 'operating', coast: 'Gulf' },
  { id: 'freeport', name: 'Freeport LNG', stateAbbr: 'TX', capacityBcfd: 2.1, status: 'operating', coast: 'Gulf' },
  { id: 'calcasieu', name: 'Calcasieu Pass', stateAbbr: 'LA', capacityBcfd: 1.7, status: 'operating', coast: 'Gulf' },
  { id: 'elba', name: 'Elba Island', stateAbbr: 'GA', capacityBcfd: 0.4, status: 'operating', coast: 'Atlantic' },
  { id: 'cove', name: 'Cove Point', stateAbbr: 'MD', capacityBcfd: 0.8, status: 'operating', coast: 'Atlantic' },
  { id: 'golden', name: 'Golden Pass', stateAbbr: 'TX', capacityBcfd: 2.5, status: 'under-construction', coast: 'Gulf' },
  { id: 'plaquemines', name: 'Plaquemines LNG', stateAbbr: 'LA', capacityBcfd: 3.3, status: 'under-construction', coast: 'Gulf' },
  { id: 'rio-grande', name: 'Rio Grande LNG', stateAbbr: 'TX', capacityBcfd: 3.6, status: 'under-construction', coast: 'Gulf' },
  { id: 'port-arthur', name: 'Port Arthur LNG', stateAbbr: 'TX', capacityBcfd: 1.9, status: 'under-construction', coast: 'Gulf' },
  { id: 'cp2', name: 'CP2 LNG', stateAbbr: 'LA', capacityBcfd: 3.7, status: 'proposed', coast: 'Gulf' },
]

export function gasTotals(year = GAS_REF_YEAR) {
  const row =
    US_GAS_ANNUAL.find((y) => y.year === year) ?? US_GAS_ANNUAL[US_GAS_ANNUAL.length - 1]
  const totalExports = row.pipelineExportBcfd + row.lngExportBcfd
  const netExports = totalExports - row.importsBcfd
  return {
    year: row.year,
    productionBcfd: row.productionBcfd,
    consumptionBcfd: row.consumptionBcfd,
    lngExportBcfd: row.lngExportBcfd,
    pipelineExportBcfd: row.pipelineExportBcfd,
    totalExportsBcfd: totalExports,
    importsBcfd: row.importsBcfd,
    netExportsBcfd: netExports,
    storageTcf: row.storageTcf,
    /** Rough Bcf/yr from Bcf/d */
    productionBcfYr: Math.round(row.productionBcfd * 365),
    exportsBcfYr: Math.round(totalExports * 365),
    note: row.note,
  }
}

/** Newest year first for charts/tables */
export function gasAnnualNewestFirst() {
  return [...US_GAS_ANNUAL].sort((a, b) => b.year - a.year)
}

export function gasAnnualOldestFirst() {
  return [...US_GAS_ANNUAL].sort((a, b) => a.year - b.year)
}

export function topGasProducers(n = 12) {
  return [...GAS_STATE_PRODUCTION]
    .filter((s) => s.abbr !== 'other')
    .sort((a, b) => b.productionBcf - a.productionBcf)
    .slice(0, n)
}

export function lngCapacityByStatus() {
  const operating = LNG_TERMINALS.filter((t) => t.status === 'operating').reduce(
    (s, t) => s + t.capacityBcfd,
    0
  )
  const construction = LNG_TERMINALS.filter((t) => t.status === 'under-construction').reduce(
    (s, t) => s + t.capacityBcfd,
    0
  )
  const proposed = LNG_TERMINALS.filter((t) => t.status === 'proposed').reduce(
    (s, t) => s + t.capacityBcfd,
    0
  )
  return { operating, construction, proposed, total: operating + construction + proposed }
}
