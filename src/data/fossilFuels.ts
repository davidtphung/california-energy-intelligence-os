/**
 * US hydrocarbon & fossil fuel historical tracking:
 * crude oil, natural gas, coal, and petroleum products.
 * Production, capacity, and exports from commercial beginnings through latest sample.
 * EIA / historical-scale educational samples - wire to EIA Open Data in production.
 */

export type FossilFuelId = 'oil' | 'gas' | 'coal' | 'products'

export interface FossilFuelMeta {
  id: FossilFuelId
  label: string
  short: string
  unitProd: string
  unitCap: string
  unitExport: string
  startYear: number
  note: string
}

export interface FossilYearRow {
  year: number
  /** Primary production in fuel-native units */
  production: number
  /** Capacity (refinery, dry-gas capability proxy, coal mine capacity, or product output) */
  capacity: number
  /** Gross exports */
  exports: number
  /** Gross imports */
  imports: number
  /** Domestic consumption / apparent use */
  consumption: number
  note?: string
}

export interface FossilStateRow {
  abbr: string
  name: string
  production: number
  sharePct: number
  yoyPct: number
  note: string
}

/** Linear interpolate between control points (year → value) */
function seriesFromPoints(
  points: [number, number][],
  start: number,
  end: number
): { year: number; value: number }[] {
  const pts = [...points].sort((a, b) => a[0] - b[0])
  const out: { year: number; value: number }[] = []
  for (let y = start; y <= end; y++) {
    if (y < pts[0][0]) {
      out.push({ year: y, value: pts[0][1] })
      continue
    }
    if (y >= pts[pts.length - 1][0]) {
      out.push({ year: y, value: pts[pts.length - 1][1] })
      continue
    }
    let i = 0
    while (i < pts.length - 1 && pts[i + 1][0] < y) i++
    const [y0, v0] = pts[i]
    const [y1, v1] = pts[i + 1]
    const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0)
    // slight curve ease for smoother historical shape
    const e = t * t * (3 - 2 * t)
    out.push({ year: y, value: v0 + (v1 - v0) * e })
  }
  return out
}

function toMap(series: { year: number; value: number }[], key: string) {
  const m: Record<string, number> = {}
  for (const s of series) m[`${key}:${s.year}`] = +s.value.toFixed(3)
  return m
}

// - -  Oil (Mbbl/d) from Drake well era - -
// Production peaks ~1970, trough ~2008, shale rebound
const OIL_PROD: [number, number][] = [
  [1859, 0.002],
  [1865, 0.007],
  [1880, 0.07],
  [1900, 0.17],
  [1910, 0.57],
  [1920, 1.21],
  [1930, 2.46],
  [1940, 3.7],
  [1945, 4.7],
  [1950, 5.4],
  [1960, 7.0],
  [1970, 9.64],
  [1975, 8.38],
  [1980, 8.6],
  [1985, 8.97],
  [1990, 7.36],
  [1995, 6.56],
  [2000, 5.82],
  [2005, 5.18],
  [2008, 5.0],
  [2010, 5.48],
  [2015, 9.42],
  [2019, 12.29],
  [2020, 11.28],
  [2022, 11.89],
  [2024, 13.2],
  [2025, 13.4],
]
// Operable refinery capacity Mbbl/d
const OIL_CAP: [number, number][] = [
  [1860, 0.01],
  [1900, 0.2],
  [1920, 1.5],
  [1940, 4.0],
  [1950, 6.2],
  [1960, 9.8],
  [1970, 12.0],
  [1980, 18.6],
  [1990, 15.6],
  [2000, 16.5],
  [2010, 17.7],
  [2019, 18.8],
  [2020, 18.1],
  [2024, 18.4],
  [2025, 18.5],
]
// Crude oil exports near 0 until ban lifted Dec 2015
const OIL_EXP: [number, number][] = [
  [1860, 0.001],
  [1900, 0.02],
  [1940, 0.1],
  [1970, 0.05],
  [1980, 0.3],
  [2000, 0.05],
  [2010, 0.04],
  [2014, 0.35],
  [2015, 0.46],
  [2016, 0.53],
  [2018, 2.0],
  [2020, 3.18],
  [2022, 3.6],
  [2024, 4.1],
  [2025, 4.2],
]
const OIL_IMP: [number, number][] = [
  [1860, 0],
  [1920, 0.3],
  [1950, 0.85],
  [1970, 3.4],
  [1977, 8.8],
  [1985, 5.0],
  [1990, 8.0],
  [2005, 13.7],
  [2010, 11.8],
  [2015, 9.4],
  [2019, 6.8],
  [2020, 5.9],
  [2022, 6.3],
  [2024, 6.5],
  [2025, 6.4],
]
const OIL_CONS: [number, number][] = [
  [1860, 0.005],
  [1900, 0.15],
  [1920, 1.3],
  [1940, 3.9],
  [1950, 6.5],
  [1970, 14.7],
  [1978, 18.8],
  [1985, 15.7],
  [2000, 19.7],
  [2005, 20.8],
  [2010, 19.2],
  [2019, 20.5],
  [2020, 18.1],
  [2022, 20.0],
  [2024, 20.3],
  [2025, 20.4],
]

// - -  Natural gas (Bcf/d) - -
const GAS_PROD: [number, number][] = [
  [1900, 0.7],
  [1910, 1.4],
  [1920, 2.2],
  [1930, 5.3],
  [1940, 7.3],
  [1950, 17.2],
  [1960, 35.0],
  [1970, 59.5],
  [1973, 61.0],
  [1980, 54.5],
  [1986, 44.0],
  [1990, 49.0],
  [2000, 52.5],
  [2005, 49.5],
  [2008, 55.0],
  [2010, 58.4],
  [2015, 74.1],
  [2018, 83.8],
  [2020, 91.5],
  [2022, 98.1],
  [2024, 105.5],
  [2025, 107.2],
]
const GAS_CAP: [number, number][] = [
  // Productive capacity proxy ~ production * 1.05-1.12
  [1900, 0.9],
  [1950, 20],
  [1970, 68],
  [1990, 58],
  [2005, 58],
  [2015, 82],
  [2020, 100],
  [2024, 116],
  [2025, 118],
]
const GAS_EXP_LNG: [number, number][] = [
  [1900, 0],
  [2000, 0.05],
  [2010, 0.05],
  [2015, 0.1],
  [2016, 0.5],
  [2018, 3.0],
  [2020, 6.5],
  [2022, 10.6],
  [2024, 12.4],
  [2025, 13.1],
]
const GAS_EXP_PIPE: [number, number][] = [
  [1900, 0],
  [1950, 0.3],
  [1970, 1.5],
  [1990, 2.5],
  [2000, 3.5],
  [2010, 4.2],
  [2015, 4.8],
  [2018, 7.1],
  [2020, 7.9],
  [2022, 8.6],
  [2024, 9.1],
  [2025, 9.3],
]
const GAS_IMP: [number, number][] = [
  [1900, 0],
  [1950, 0.2],
  [1970, 2.5],
  [1990, 4.0],
  [2000, 10.0],
  [2007, 13.0],
  [2010, 10.5],
  [2015, 7.4],
  [2020, 7.0],
  [2024, 8.1],
  [2025, 8.0],
]
const GAS_CONS: [number, number][] = [
  [1900, 0.6],
  [1950, 16],
  [1970, 58],
  [1990, 52],
  [2000, 63],
  [2010, 66],
  [2015, 74.6],
  [2020, 83.3],
  [2022, 88.5],
  [2024, 90.2],
  [2025, 91.0],
]

// - -  Coal (MMst = million short tons / year) - -
const COAL_PROD: [number, number][] = [
  [1800, 0.1],
  [1830, 0.9],
  [1850, 8.4],
  [1860, 20],
  [1870, 40],
  [1880, 71],
  [1890, 158],
  [1900, 270],
  [1910, 448],
  [1918, 605],
  [1920, 568],
  [1930, 468],
  [1940, 512],
  [1945, 620],
  [1950, 560],
  [1960, 434],
  [1970, 613],
  [1980, 830],
  [1990, 1029],
  [2000, 1074],
  [2008, 1172],
  [2010, 1084],
  [2015, 897],
  [2019, 706],
  [2020, 535],
  [2022, 594],
  [2024, 520],
  [2025, 510],
]
// Productive capacity MMst/yr
const COAL_CAP: [number, number][] = [
  [1850, 12],
  [1900, 320],
  [1920, 700],
  [1950, 700],
  [1970, 750],
  [1990, 1200],
  [2008, 1400],
  [2015, 1100],
  [2020, 800],
  [2024, 720],
  [2025, 700],
]
const COAL_EXP: [number, number][] = [
  [1850, 0.2],
  [1900, 8],
  [1920, 35],
  [1945, 45],
  [1970, 71],
  [1980, 105],
  [1990, 106],
  [2000, 58],
  [2012, 126],
  [2015, 74],
  [2019, 93],
  [2020, 69],
  [2022, 86],
  [2024, 90],
  [2025, 88],
]
const COAL_IMP: [number, number][] = [
  [1850, 0],
  [1900, 2],
  [1950, 1],
  [1980, 3],
  [2000, 12],
  [2007, 36],
  [2015, 11],
  [2020, 5],
  [2024, 6],
  [2025, 6],
]
const COAL_CONS: [number, number][] = [
  [1850, 8],
  [1900, 260],
  [1920, 530],
  [1950, 500],
  [1970, 520],
  [1990, 900],
  [2000, 1080],
  [2007, 1128],
  [2015, 800],
  [2019, 587],
  [2020, 477],
  [2022, 515],
  [2024, 435],
  [2025, 420],
]

// - -  Petroleum products exports/production proxy (Mbbl/d product supplied / exports) - -
const PROD_SUPPLY: [number, number][] = [
  [1920, 1.2],
  [1940, 3.5],
  [1950, 6.0],
  [1970, 14.5],
  [1980, 16.0],
  [2000, 19.5],
  [2010, 19.0],
  [2019, 20.5],
  [2020, 18.2],
  [2024, 20.6],
  [2025, 20.7],
]
const PROD_CAP: [number, number][] = OIL_CAP // refinery capacity drives product capability
const PROD_EXP: [number, number][] = [
  [1920, 0.15],
  [1940, 0.3],
  [1970, 0.4],
  [1990, 0.9],
  [2000, 1.0],
  [2010, 2.3],
  [2015, 4.0],
  [2019, 5.6],
  [2020, 5.1],
  [2022, 6.0],
  [2024, 6.3],
  [2025, 6.4],
]
const PROD_IMP: [number, number][] = [
  [1920, 0.05],
  [1970, 2.0],
  [1980, 1.8],
  [2000, 2.3],
  [2010, 2.5],
  [2019, 2.2],
  [2020, 1.9],
  [2024, 2.0],
  [2025, 2.0],
]
const PROD_CONS: [number, number][] = OIL_CONS

function buildFuelSeries(
  _id: FossilFuelId,
  start: number,
  end: number,
  prod: [number, number][],
  cap: [number, number][],
  exp: [number, number][],
  imp: [number, number][],
  cons: [number, number][]
): FossilYearRow[] {
  const p = toMap(seriesFromPoints(prod, start, end), 'p')
  const c = toMap(seriesFromPoints(cap, start, end), 'c')
  const e = toMap(seriesFromPoints(exp, start, end), 'e')
  const i = toMap(seriesFromPoints(imp, start, end), 'i')
  const u = toMap(seriesFromPoints(cons, start, end), 'u')
  const years = []
  for (let y = start; y <= end; y++) years.push(y)
  return years.map((year) => ({
    year,
    production: p[`p:${year}`],
    capacity: c[`c:${year}`],
    exports: e[`e:${year}`],
    imports: i[`i:${year}`],
    consumption: u[`u:${year}`],
  }))
}

const END = 2025

export const FOSSIL_META: FossilFuelMeta[] = [
  {
    id: 'oil',
    label: 'Crude oil',
    short: 'Oil',
    unitProd: 'Mbbl/d',
    unitCap: 'Mbbl/d refinery',
    unitExport: 'Mbbl/d',
    startYear: 1859,
    note: 'Commercial US oil from 1859 (Drake). Crude export ban largely lifted 2015.',
  },
  {
    id: 'gas',
    label: 'Natural gas',
    short: 'Gas',
    unitProd: 'Bcf/d',
    unitCap: 'Bcf/d productive',
    unitExport: 'Bcf/d',
    startYear: 1900,
    note: 'Marketed dry gas; LNG exports scale after 2016.',
  },
  {
    id: 'coal',
    label: 'Coal',
    short: 'Coal',
    unitProd: 'MMst/yr',
    unitCap: 'MMst/yr capacity',
    unitExport: 'MMst/yr',
    startYear: 1800,
    note: 'Short tons; production peak ~2008, power-sector decline since.',
  },
  {
    id: 'products',
    label: 'Petroleum products',
    short: 'Products',
    unitProd: 'Mbbl/d supplied',
    unitCap: 'Mbbl/d refinery',
    unitExport: 'Mbbl/d',
    startYear: 1920,
    note: 'Gasoline, distillate, jet, residual, etc. US is a major product exporter.',
  },
]

/** Combined gas export control points (LNG + pipeline) for total export field */
const GAS_EXP_TOTAL: [number, number][] = (() => {
  const years = new Set<number>()
  for (const [y] of GAS_EXP_LNG) years.add(y)
  for (const [y] of GAS_EXP_PIPE) years.add(y)
  const lngS = seriesFromPoints(GAS_EXP_LNG, 1900, END)
  const pipeS = seriesFromPoints(GAS_EXP_PIPE, 1900, END)
  const pipeMap = Object.fromEntries(pipeS.map((s) => [s.year, s.value]))
  return lngS.map((s) => [s.year, s.value + (pipeMap[s.year] ?? 0)] as [number, number])
})()

export const FOSSIL_SERIES: Record<FossilFuelId, FossilYearRow[]> = {
  oil: buildFuelSeries('oil', 1859, END, OIL_PROD, OIL_CAP, OIL_EXP, OIL_IMP, OIL_CONS),
  gas: buildFuelSeries('gas', 1900, END, GAS_PROD, GAS_CAP, GAS_EXP_TOTAL, GAS_IMP, GAS_CONS),
  coal: buildFuelSeries('coal', 1800, END, COAL_PROD, COAL_CAP, COAL_EXP, COAL_IMP, COAL_CONS),
  products: buildFuelSeries(
    'products',
    1920,
    END,
    PROD_SUPPLY,
    PROD_CAP,
    PROD_EXP,
    PROD_IMP,
    PROD_CONS
  ),
}

/** Gas detail with LNG vs pipeline split (for charts) */
export function gasExportSplit(): { year: number; lng: number; pipeline: number; total: number }[] {
  const lng = seriesFromPoints(GAS_EXP_LNG, 1900, END)
  const pipe = seriesFromPoints(GAS_EXP_PIPE, 1900, END)
  const pipeMap = Object.fromEntries(pipe.map((s) => [s.year, s.value]))
  return lng.map((s) => {
    const pipeline = pipeMap[s.year] ?? 0
    return {
      year: s.year,
      lng: +s.value.toFixed(3),
      pipeline: +pipeline.toFixed(3),
      total: +(s.value + pipeline).toFixed(3),
    }
  })
}

export const OIL_STATE_PRODUCTION: FossilStateRow[] = [
  { abbr: 'TX', name: 'Texas', production: 5.8, sharePct: 43, yoyPct: 2.5, note: 'Permian dominant; largest crude producer.' },
  { abbr: 'NM', name: 'New Mexico', production: 2.0, sharePct: 15, yoyPct: 6.0, note: 'Delaware Basin growth.' },
  { abbr: 'ND', name: 'North Dakota', production: 1.2, sharePct: 9, yoyPct: 1.0, note: 'Bakken.' },
  { abbr: 'CO', name: 'Colorado', production: 0.5, sharePct: 4, yoyPct: -2.0, note: 'DJ Basin.' },
  { abbr: 'AK', name: 'Alaska', production: 0.42, sharePct: 3, yoyPct: -3.0, note: 'North Slope decline long-term.' },
  { abbr: 'OK', name: 'Oklahoma', production: 0.45, sharePct: 3, yoyPct: 0.5, note: 'Anadarko / STACK.' },
  { abbr: 'CA', name: 'California', production: 0.32, sharePct: 2, yoyPct: -5.0, note: 'Mature fields; net crude importer.' },
  { abbr: 'WY', name: 'Wyoming', production: 0.28, sharePct: 2, yoyPct: -1.0, note: 'Powder River / conventional.' },
  { abbr: 'UT', name: 'Utah', production: 0.18, sharePct: 1, yoyPct: 1.0, note: 'Uinta.' },
  { abbr: 'OH', name: 'Ohio', production: 0.1, sharePct: 1, yoyPct: 2.0, note: 'Utica liquids.' },
]

export const COAL_STATE_PRODUCTION: FossilStateRow[] = [
  { abbr: 'WY', name: 'Wyoming', production: 230, sharePct: 44, yoyPct: -3.0, note: 'PRB surface mines; largest US producer.' },
  { abbr: 'WV', name: 'West Virginia', production: 75, sharePct: 14, yoyPct: -2.0, note: 'Appalachian underground + surface.' },
  { abbr: 'PA', name: 'Pennsylvania', production: 38, sharePct: 7, yoyPct: -4.0, note: 'Bituminous + anthracite remnant.' },
  { abbr: 'IL', name: 'Illinois', production: 35, sharePct: 7, yoyPct: -1.0, note: 'Illinois Basin.' },
  { abbr: 'KY', name: 'Kentucky', production: 28, sharePct: 5, yoyPct: -5.0, note: 'East + west Kentucky.' },
  { abbr: 'MT', name: 'Montana', production: 26, sharePct: 5, yoyPct: -2.0, note: 'PRB northern.' },
  { abbr: 'IN', name: 'Indiana', production: 22, sharePct: 4, yoyPct: -3.0, note: 'Illinois Basin.' },
  { abbr: 'ND', name: 'North Dakota', production: 24, sharePct: 5, yoyPct: -1.0, note: 'Lignite.' },
  { abbr: 'TX', name: 'Texas', production: 18, sharePct: 3, yoyPct: -8.0, note: 'Lignite for power; declining.' },
  { abbr: 'AL', name: 'Alabama', production: 10, sharePct: 2, yoyPct: -2.0, note: 'Met + steam coal.' },
]

export const GAS_STATE_PRODUCTION: FossilStateRow[] = [
  { abbr: 'TX', name: 'Texas', production: 32.3, sharePct: 30.6, yoyPct: 3.2, note: 'Permian + Haynesville (Bcf/d).' },
  { abbr: 'PA', name: 'Pennsylvania', production: 20.8, sharePct: 19.7, yoyPct: 1.1, note: 'Marcellus.' },
  { abbr: 'LA', name: 'Louisiana', production: 11.5, sharePct: 10.9, yoyPct: 4.5, note: 'Haynesville + LNG coast.' },
  { abbr: 'WV', name: 'West Virginia', production: 7.7, sharePct: 7.3, yoyPct: 2.0, note: 'Appalachia.' },
  { abbr: 'OK', name: 'Oklahoma', production: 7.1, sharePct: 6.7, yoyPct: -0.5, note: 'Anadarko.' },
  { abbr: 'OH', name: 'Ohio', production: 6.6, sharePct: 6.2, yoyPct: 1.8, note: 'Utica.' },
  { abbr: 'NM', name: 'New Mexico', production: 6.0, sharePct: 5.7, yoyPct: 5.0, note: 'Permian Delaware.' },
  { abbr: 'CO', name: 'Colorado', production: 5.2, sharePct: 4.9, yoyPct: -1.2, note: 'DJ / Piceance.' },
  { abbr: 'WY', name: 'Wyoming', production: 3.8, sharePct: 3.6, yoyPct: -2.0, note: 'Rockies.' },
  { abbr: 'ND', name: 'North Dakota', production: 3.0, sharePct: 2.9, yoyPct: 2.2, note: 'Bakken associated gas.' },
]

export const PRODUCT_EXPORT_STREAMS = [
  { id: 'gasoline', label: 'Motor gasoline', mbbld: 0.9, note: 'Net exporter in many months.' },
  { id: 'distillate', label: 'Distillate (diesel / heating)', mbbld: 1.4, note: 'Largest product export stream.' },
  { id: 'jet', label: 'Jet fuel', mbbld: 0.35, note: 'Growing with Gulf refining.' },
  { id: 'propane', label: 'Propane / NGL products', mbbld: 1.6, note: 'Major LPG export growth.' },
  { id: 'residual', label: 'Residual fuel oil', mbbld: 0.25, note: 'Bunker / industrial.' },
  { id: 'other', label: 'Other products', mbbld: 1.8, note: 'Petrochemical feedstocks, etc.' },
]

export function fossilSeriesNewestFirst(id: FossilFuelId): FossilYearRow[] {
  return [...FOSSIL_SERIES[id]].sort((a, b) => b.year - a.year)
}

export function fossilSeriesOldestFirst(id: FossilFuelId): FossilYearRow[] {
  return [...FOSSIL_SERIES[id]].sort((a, b) => a.year - b.year)
}

export function fossilLatest(id: FossilFuelId, year = END): FossilYearRow {
  const rows = FOSSIL_SERIES[id]
  return rows.find((r) => r.year === year) ?? rows[rows.length - 1]
}

export function fossilNetExports(row: FossilYearRow) {
  return row.exports - row.imports
}

/** Decade aggregates for long history charts (reduces point density) */
export function fossilByDecade(id: FossilFuelId): FossilYearRow[] {
  const rows = fossilSeriesOldestFirst(id)
  const map = new Map<number, FossilYearRow[]>()
  for (const r of rows) {
    const d = Math.floor(r.year / 10) * 10
    const list = map.get(d) ?? []
    list.push(r)
    map.set(d, list)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, list]) => {
      const n = list.length
      const avg = (fn: (r: FossilYearRow) => number) =>
        list.reduce((s, r) => s + fn(r), 0) / n
      return {
        year: decade,
        production: +avg((r) => r.production).toFixed(3),
        capacity: +avg((r) => r.capacity).toFixed(3),
        exports: +avg((r) => r.exports).toFixed(3),
        imports: +avg((r) => r.imports).toFixed(3),
        consumption: +avg((r) => r.consumption).toFixed(3),
        note: `${decade}s average`,
      }
    })
}

export function fossilSummaryTable() {
  return FOSSIL_META.map((m) => {
    const latest = fossilLatest(m.id)
    const first = FOSSIL_SERIES[m.id][0]
    return {
      ...m,
      latestYear: latest.year,
      production: latest.production,
      capacity: latest.capacity,
      exports: latest.exports,
      imports: latest.imports,
      netExports: fossilNetExports(latest),
      firstYear: first.year,
      firstProduction: first.production,
    }
  })
}
