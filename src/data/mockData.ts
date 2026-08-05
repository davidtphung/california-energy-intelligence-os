import type {
  Assumption,
  CapacityByTech,
  Filters,
  GenerationBySource,
  KPISet,
  MetricDefinition,
  Note,
  PipelineError,
  PipelineRun,
  Plant,
  PolicyTarget,
  QualityCheck,
  Scenario,
  ScenarioAssumptions,
  ScenarioOutputs,
  Source,
  Technology,
  TransmissionFlow,
} from '../types'
import { seededRandom, TECH_LABELS } from '../lib/utils'

const TECHS: Technology[] = [
  'solar',
  'wind',
  'hydro',
  'natural_gas',
  'nuclear',
  'geothermal',
  'biomass',
  'battery',
  'other',
]

/** Installed capacity baselines (MW) — realistic CA-scale placeholders */
const BASE_CAPACITY_MW: Record<Technology, number> = {
  solar: 42_500,
  wind: 7_800,
  hydro: 14_200,
  natural_gas: 38_000,
  nuclear: 2_250,
  geothermal: 2_700,
  biomass: 1_100,
  battery: 13_500,
  other: 1_800,
}

export const REGIONS = [
  'Northern CA',
  'Bay Area',
  'Central Valley',
  'Central Coast',
  'Southern CA',
  'Desert / Inland Empire',
] as const

export const PLANTS: Plant[] = [
  { id: 'p1', name: 'Ivanpah Solar', technology: 'solar', capacityMw: 392, region: 'Desert / Inland Empire', operator: 'NRG', onlineYear: 2014, latitude: 35.57, longitude: -115.47 },
  { id: 'p2', name: 'Topaz Solar Farm', technology: 'solar', capacityMw: 550, region: 'Central Coast', operator: 'BHE Renewables', onlineYear: 2014, latitude: 35.38, longitude: -120.07 },
  { id: 'p3', name: 'Alta Wind Energy Center', technology: 'wind', capacityMw: 1548, region: 'Southern CA', operator: 'Terra-Gen', onlineYear: 2011, latitude: 35.02, longitude: -118.32 },
  { id: 'p4', name: 'Diablo Canyon', technology: 'nuclear', capacityMw: 2256, region: 'Central Coast', operator: 'PG&E', onlineYear: 1985, latitude: 35.21, longitude: -120.85 },
  { id: 'p5', name: 'The Geysers', technology: 'geothermal', capacityMw: 725, region: 'Northern CA', operator: 'Calpine', onlineYear: 1960, latitude: 38.79, longitude: -122.76 },
  { id: 'p6', name: 'Moss Landing BESS', technology: 'battery', capacityMw: 750, region: 'Central Coast', operator: 'Vistra', onlineYear: 2021, latitude: 36.8, longitude: -121.78 },
  { id: 'p7', name: 'Helms Pumped Storage', technology: 'hydro', capacityMw: 1212, region: 'Central Valley', operator: 'PG&E', onlineYear: 1984, latitude: 37.04, longitude: -119.1 },
  { id: 'p8', name: 'Shasta Dam', technology: 'hydro', capacityMw: 710, region: 'Northern CA', operator: 'USBR', onlineYear: 1944, latitude: 40.72, longitude: -122.42 },
  { id: 'p9', name: 'AES Alamitos Energy Center', technology: 'natural_gas', capacityMw: 1950, region: 'Southern CA', operator: 'AES', onlineYear: 2020, latitude: 33.77, longitude: -118.1 },
  { id: 'p10', name: 'Edwards & Sanborn Solar+Storage', technology: 'solar', capacityMw: 875, region: 'Desert / Inland Empire', operator: 'Terra-Gen', onlineYear: 2022, latitude: 34.9, longitude: -117.9 },
  { id: 'p11', name: 'Manzana Wind', technology: 'wind', capacityMw: 189, region: 'Southern CA', operator: 'Avangrid', onlineYear: 2012, latitude: 34.95, longitude: -118.45 },
  { id: 'p12', name: 'Gateway Generating Station', technology: 'natural_gas', capacityMw: 530, region: 'Bay Area', operator: 'PG&E', onlineYear: 2009, latitude: 38.02, longitude: -121.76 },
]

export function getCapacityByTech(filters: Filters): CapacityByTech[] {
  const yearFactor = 1 + (filters.year - 2024) * 0.04
  const total = Object.values(BASE_CAPACITY_MW).reduce((a, b) => a + b, 0) * yearFactor
  return TECHS.map((technology) => {
    let cap = BASE_CAPACITY_MW[technology] * yearFactor
    if (technology === 'solar') cap *= 1 + (filters.year - 2024) * 0.06
    if (technology === 'battery') cap *= 1 + (filters.year - 2024) * 0.12
    if (technology === 'natural_gas') cap *= 1 - (filters.year - 2024) * 0.015
    if (filters.technology !== 'all' && filters.technology !== technology) cap = 0
    return {
      technology,
      capacityMw: Math.round(cap),
      share: (cap / total) * 100,
    }
  }).filter((c) => c.capacityMw > 0)
}

export function getGenerationBySource(filters: Filters): GenerationBySource[] {
  const rand = seededRandom(filters.year * 100 + (typeof filters.month === 'number' ? filters.month : 0))
  const capacityFactors: Record<Technology, number> = {
    solar: 0.28,
    wind: 0.35,
    hydro: 0.42,
    natural_gas: 0.38,
    nuclear: 0.92,
    geothermal: 0.75,
    biomass: 0.55,
    battery: 0.12,
    other: 0.2,
  }
  const hours = filters.month === 'all' ? 8760 : 730
  const caps = getCapacityByTech(filters)
  const rows = caps.map((c) => {
    const noise = 0.9 + rand() * 0.2
    const mwh = c.capacityMw * capacityFactors[c.technology] * hours * noise
    return { technology: c.technology, mwh, share: 0 }
  })
  const total = rows.reduce((a, r) => a + r.mwh, 0)
  return rows.map((r) => ({ ...r, share: (r.mwh / total) * 100 }))
}

export function getHourlySeries(filters: Filters) {
  const rand = seededRandom(filters.year * 31 + (typeof filters.month === 'number' ? filters.month : 6))
  const hours = 24
  const data = []
  for (let h = 0; h < hours; h++) {
    const loadBase = 28_000 + Math.sin(((h - 6) / 24) * Math.PI * 2) * 8_000
    const solar = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI) * 18_000) * (0.9 + rand() * 0.1)
    const wind = 3_500 + Math.sin((h / 24) * Math.PI * 2 + 1) * 1_500 + rand() * 800
    const hydro = 5_200 + rand() * 400
    const nuclear = 2_200
    const geo = 2_000
    const gas = Math.max(2_000, loadBase - solar - wind - hydro - nuclear - geo + 3_000)
    const battery = h >= 17 && h <= 21 ? 4_500 * ((h - 16) / 5) : h >= 10 && h <= 15 ? -3_000 : 0
    data.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      load: Math.round(loadBase + rand() * 500),
      solar: Math.round(solar),
      wind: Math.round(wind),
      hydro: Math.round(hydro),
      nuclear: Math.round(nuclear),
      natural_gas: Math.round(gas),
      geothermal: Math.round(geo),
      battery: Math.round(battery),
      totalGen: Math.round(solar + wind + hydro + nuclear + gas + geo),
    })
  }
  return data
}

export function getTransmissionFlows(): TransmissionFlow[] {
  return [
    { id: 'f1', fromRegion: 'Pacific NW', toRegion: 'Northern CA', mw: 4200, direction: 'import', path: 'COI' },
    { id: 'f2', fromRegion: 'Southwest', toRegion: 'Southern CA', mw: 6800, direction: 'import', path: 'SWPL / Path 46' },
    { id: 'f3', fromRegion: 'Northern CA', toRegion: 'Bay Area', mw: 3100, direction: 'internal', path: 'Path 15 N' },
    { id: 'f4', fromRegion: 'Central Valley', toRegion: 'Southern CA', mw: 5400, direction: 'internal', path: 'Path 26' },
    { id: 'f5', fromRegion: 'Desert / Inland Empire', toRegion: 'Southern CA', mw: 7200, direction: 'internal', path: 'SCE System' },
    { id: 'f6', fromRegion: 'Southern CA', toRegion: 'Mexico', mw: 800, direction: 'export', path: 'IV / Tijuana' },
    { id: 'f7', fromRegion: 'Northern CA', toRegion: 'Nevada', mw: 450, direction: 'export', path: 'Path 24' },
    { id: 'f8', fromRegion: 'Arizona', toRegion: 'Southern CA', mw: 2900, direction: 'import', path: 'Devers / Palo Verde' },
  ]
}

export function getKPIs(filters: Filters): KPISet {
  const caps = getCapacityByTech(filters)
  const gen = getGenerationBySource(filters)
  const totalCap = caps.reduce((a, c) => a + c.capacityMw, 0) / 1000
  const cleanTechs: Technology[] = ['solar', 'wind', 'hydro', 'nuclear', 'geothermal', 'biomass']
  const cleanMwh = gen.filter((g) => cleanTechs.includes(g.technology)).reduce((a, g) => a + g.mwh, 0)
  const totalMwh = gen.reduce((a, g) => a + g.mwh, 0)
  const peakLoad = 48.2 + (filters.year - 2024) * 0.9
  const battery = caps.find((c) => c.technology === 'battery')?.capacityMw ?? 0
  const gasShare = gen.find((g) => g.technology === 'natural_gas')?.share ?? 20
  return {
    peakLoadGw: Math.round(peakLoad * 10) / 10,
    cleanEnergySharePct: Math.round((cleanMwh / totalMwh) * 1000) / 10,
    reserveMarginPct: Math.round(((totalCap - peakLoad) / peakLoad) * 1000) / 10,
    emissionsMt: Math.round((gasShare / 100) * 52 * 10) / 10,
    batteryCapacityGw: Math.round((battery / 1000) * 10) / 10,
    batteryDischargeGwh: Math.round(battery * 0.18) / 10,
    netImportsGw: 8.4 - (filters.year - 2024) * 0.15,
    totalCapacityGw: Math.round(totalCap * 10) / 10,
  }
}

export function getRegionalCapacity(filters: Filters) {
  const weights: Record<string, number> = {
    'Northern CA': 0.14,
    'Bay Area': 0.12,
    'Central Valley': 0.18,
    'Central Coast': 0.1,
    'Southern CA': 0.28,
    'Desert / Inland Empire': 0.18,
  }
  const total = getCapacityByTech(filters).reduce((a, c) => a + c.capacityMw, 0)
  return REGIONS.map((region) => ({
    region,
    capacityGw: Math.round((total * weights[region]) / 100) / 10,
    peakLoadGw: Math.round(getKPIs(filters).peakLoadGw * weights[region] * 10) / 10,
    cleanShare: Math.round(55 + weights[region] * 80 + (filters.year - 2024) * 1.5),
  }))
}

const defaultAssumptions = (overrides: Partial<ScenarioAssumptions> = {}): ScenarioAssumptions => ({
  demandGrowthPct: 1.8,
  solarBuildoutGw: 45,
  windBuildoutGw: 12,
  storageBuildoutGw: 35,
  gasRetirementsGw: 8,
  hydroVariability: 1.0,
  importLevelGw: 8,
  cleanEnergyTargetPct: 90,
  carbonPrice: 45,
  ...overrides,
})

function computeOutputs(a: ScenarioAssumptions): ScenarioOutputs[] {
  return ([2030, 2035, 2045] as const).map((year, i) => {
    const t = i + 1
    const peak = 52 + a.demandGrowthPct * t * 2.2
    const renew = a.solarBuildoutGw * (0.4 + t * 0.2) + a.windBuildoutGw * (0.35 + t * 0.15)
    const storage = a.storageBuildoutGw * (0.3 + t * 0.25)
    const gasLeft = Math.max(5, 38 - a.gasRetirementsGw * t * 0.4)
    const clean = Math.min(
      99,
      55 + (a.cleanEnergyTargetPct - 55) * (t / 3) + renew * 0.15 + a.hydroVariability * 2
    )
    const capacityNeed = peak * 1.15 + storage * 0.2
    const emissions = Math.max(2, 48 * (1 - clean / 100) * (gasLeft / 30) * (1 - a.carbonPrice / 200))
    const reserve = ((capacityNeed + a.importLevelGw * 0.5 - peak) / peak) * 100
    const cost =
      renew * 1.1 + storage * 1.4 + a.gasRetirementsGw * 0.3 + peak * 0.15 * t - a.carbonPrice * 0.02
    return {
      year,
      capacityNeedGw: Math.round(capacityNeed * 10) / 10,
      emissionsMt: Math.round(emissions * 10) / 10,
      reserveMarginPct: Math.round(reserve * 10) / 10,
      systemCostBillion: Math.round(cost * 10) / 10,
      cleanEnergySharePct: Math.round(clean * 10) / 10,
      peakLoadGw: Math.round(peak * 10) / 10,
      storageGw: Math.round(storage * 10) / 10,
    }
  })
}

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'base',
    name: 'Reference Case',
    description: 'Mid demand growth with current policy trajectory and moderate buildout.',
    isPreset: true,
    createdAt: '2024-01-15T00:00:00Z',
    assumptions: defaultAssumptions(),
    outputs: computeOutputs(defaultAssumptions()),
  },
  {
    id: 'high-renewables',
    name: 'High Renewables',
    description: 'Aggressive solar/wind/storage buildout and accelerated gas retirements.',
    isPreset: true,
    createdAt: '2024-02-01T00:00:00Z',
    assumptions: defaultAssumptions({
      solarBuildoutGw: 70,
      windBuildoutGw: 22,
      storageBuildoutGw: 55,
      gasRetirementsGw: 15,
      cleanEnergyTargetPct: 100,
      carbonPrice: 85,
    }),
    outputs: computeOutputs(
      defaultAssumptions({
        solarBuildoutGw: 70,
        windBuildoutGw: 22,
        storageBuildoutGw: 55,
        gasRetirementsGw: 15,
        cleanEnergyTargetPct: 100,
        carbonPrice: 85,
      })
    ),
  },
  {
    id: 'stress',
    name: 'Drought + Peak Stress',
    description: 'Low hydro, high demand growth, constrained imports.',
    isPreset: true,
    createdAt: '2024-03-10T00:00:00Z',
    assumptions: defaultAssumptions({
      demandGrowthPct: 2.8,
      hydroVariability: 0.7,
      importLevelGw: 4,
      storageBuildoutGw: 40,
    }),
    outputs: computeOutputs(
      defaultAssumptions({
        demandGrowthPct: 2.8,
        hydroVariability: 0.7,
        importLevelGw: 4,
        storageBuildoutGw: 40,
      })
    ),
  },
]

export function buildScenario(
  name: string,
  assumptions: ScenarioAssumptions,
  description = 'Custom scenario'
): Scenario {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    isPreset: false,
    createdAt: new Date().toISOString(),
    assumptions,
    outputs: computeOutputs(assumptions),
  }
}

export function recomputeScenario(scenario: Scenario, assumptions: ScenarioAssumptions): Scenario {
  return {
    ...scenario,
    assumptions,
    outputs: computeOutputs(assumptions),
  }
}

export const POLICY_TARGETS: PolicyTarget[] = [
  { id: 'pt1', name: 'SB 100 Clean Electricity', year: 2045, metric: 'clean_share', targetValue: 100, unit: '%', source: 'SB 100 / CEC' },
  { id: 'pt2', name: 'RPS Interim', year: 2030, metric: 'rps', targetValue: 60, unit: '%', source: 'SB 100' },
  { id: 'pt3', name: 'Storage Mandate (AB 2514+)', year: 2026, metric: 'storage', targetValue: 1.3, unit: 'GW', source: 'CPUC' },
  { id: 'pt4', name: 'GHG Cap (Electricity Sector)', year: 2030, metric: 'emissions', targetValue: 30, unit: 'Mt CO₂e', source: 'CARB Scoping Plan' },
  { id: 'pt5', name: 'Diablo Canyon Extension Window', year: 2030, metric: 'nuclear', targetValue: 2.2, unit: 'GW', source: 'SB 846' },
]

export const SOURCES: Source[] = [
  {
    id: 's1',
    title: 'Integrated Energy Policy Report (IEPR)',
    organization: 'CEC',
    url: 'https://www.energy.ca.gov/data-reports/reports/integrated-energy-policy-report',
    year: 2024,
    type: 'report',
    tags: ['demand', 'forecast', 'policy'],
    summary: 'Biennial statewide energy assessment covering electricity demand, efficiency, and clean energy pathways.',
  },
  {
    id: 's2',
    title: 'CAISO Summer Loads and Resources Assessment',
    organization: 'CAISO',
    url: 'https://www.caiso.com',
    year: 2025,
    type: 'report',
    tags: ['reliability', 'peak', 'reserve margin'],
    summary: 'Operational outlook for summer peak conditions, resource adequacy, and import reliance.',
  },
  {
    id: 's3',
    title: 'Electric Power Monthly — California',
    organization: 'EIA',
    url: 'https://www.eia.gov/electricity/monthly/',
    year: 2025,
    type: 'dataset',
    tags: ['generation', 'capacity', 'emissions'],
    summary: 'Monthly generation, capacity, and fuel consumption statistics by state and technology.',
  },
  {
    id: 's4',
    title: 'Resource Adequacy Proceeding Filings',
    organization: 'CPUC',
    url: 'https://www.cpuc.ca.gov',
    year: 2024,
    type: 'filing',
    tags: ['RA', 'procurement', 'storage'],
    summary: 'Utility and LSE resource adequacy showings and procurement decisions.',
  },
  {
    id: 's5',
    title: 'PG&E Integrated Resource Plan',
    organization: 'Utility',
    url: 'https://www.pge.com',
    year: 2023,
    type: 'filing',
    tags: ['IRP', 'procurement', 'PG&E'],
    summary: 'Long-term procurement plan aligning with SB 100 and reliability needs.',
  },
  {
    id: 's6',
    title: 'SCE Clean Power & Electrification Pathway',
    organization: 'Utility',
    url: 'https://www.sce.com',
    year: 2023,
    type: 'report',
    tags: ['electrification', 'SCE', 'pathways'],
    summary: 'Scenario analysis for deep decarbonization of the SCE service territory.',
  },
  {
    id: 's7',
    title: 'SB 100 Joint Agency Report',
    organization: 'Policy',
    url: 'https://www.energy.ca.gov',
    year: 2021,
    type: 'policy',
    tags: ['SB100', '2045', 'clean energy'],
    summary: 'Joint CEC/CPUC/CARB assessment of pathways to 100% clean electricity by 2045.',
  },
  {
    id: 's8',
    title: 'Today\'s Outlook — Supply & Demand',
    organization: 'CAISO',
    url: 'https://www.caiso.com/todaysoutlook',
    year: 2025,
    type: 'dataset',
    tags: ['real-time', 'load', 'renewables'],
    summary: 'Near-real-time system load, renewable production, and net demand curves.',
  },
]

export const NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Path 26 congestion risk in high solar hours',
    body: 'Central Valley solar exports often congest Path 26 mid-day. Scenario planner should stress-test transmission limits when adding >20 GW Central Valley solar.',
    tags: ['transmission', 'solar', 'Path 26'],
    linkedSourceIds: ['s2', 's8'],
    linkedAssumptionIds: ['a3'],
    createdAt: '2025-06-12T14:00:00Z',
    updatedAt: '2025-06-12T14:00:00Z',
  },
  {
    id: 'n2',
    title: 'Hydro drought sensitivity',
    body: '2021–2022 drought reduced hydro CF ~25–30%. Use hydroVariability 0.7 for stress cases aligned with CAISO summer assessments.',
    tags: ['hydro', 'drought', 'reliability'],
    linkedSourceIds: ['s2'],
    linkedAssumptionIds: ['a5'],
    createdAt: '2025-05-01T10:00:00Z',
    updatedAt: '2025-07-20T09:30:00Z',
  },
  {
    id: 'n3',
    title: 'Battery duration assumptions',
    body: 'Most new BESS is 4-hour. For 2045 evening peak coverage, track energy (GWh) not just power (GW).',
    tags: ['storage', 'duration', 'RA'],
    linkedSourceIds: ['s4'],
    linkedAssumptionIds: ['a4'],
    createdAt: '2025-04-18T16:20:00Z',
    updatedAt: '2025-04-18T16:20:00Z',
  },
]

export const ASSUMPTIONS: Assumption[] = [
  { id: 'a1', key: 'demand_growth_cagr', value: 1.8, unit: '%/yr', sourceId: 's1', confidence: 'high', notes: 'IEPR mid case including EV + building electrification', updatedAt: '2025-01-10' },
  { id: 'a2', key: 'solar_capacity_factor', value: 0.28, unit: 'CF', sourceId: 's3', confidence: 'high', updatedAt: '2025-02-01' },
  { id: 'a3', key: 'path26_limit', value: 5400, unit: 'MW', sourceId: 's2', confidence: 'medium', notes: 'Approximate southbound rating under normal conditions', updatedAt: '2025-03-15' },
  { id: 'a4', key: 'bess_duration', value: 4, unit: 'hours', sourceId: 's4', confidence: 'high', updatedAt: '2025-01-20' },
  { id: 'a5', key: 'hydro_drought_factor', value: 0.75, unit: 'multiplier', sourceId: 's2', confidence: 'medium', updatedAt: '2025-06-01' },
  { id: 'a6', key: 'carbon_intensity_gas', value: 0.42, unit: 'tCO2/MWh', sourceId: 's3', confidence: 'high', updatedAt: '2024-11-12' },
]

export const PIPELINE_RUNS: PipelineRun[] = [
  { id: 'pr1', name: 'caiso_hourly_load', status: 'success', startedAt: '2025-08-04T06:00:00Z', finishedAt: '2025-08-04T06:12:00Z', recordsProcessed: 8760, errorCount: 0 },
  { id: 'pr2', name: 'eia_generation_monthly', status: 'success', startedAt: '2025-08-04T05:30:00Z', finishedAt: '2025-08-04T05:41:00Z', recordsProcessed: 1240, errorCount: 2, message: '2 rows skipped (null fuel code)' },
  { id: 'pr3', name: 'plant_registry_sync', status: 'warning', startedAt: '2025-08-04T04:00:00Z', finishedAt: '2025-08-04T04:22:00Z', recordsProcessed: 890, errorCount: 12, message: '12 plants missing coordinates' },
  { id: 'pr4', name: 'storage_telemetry', status: 'running', startedAt: '2025-08-05T00:10:00Z', recordsProcessed: 4200, errorCount: 0 },
  { id: 'pr5', name: 'transmission_flows_rt', status: 'failed', startedAt: '2025-08-04T23:00:00Z', finishedAt: '2025-08-04T23:03:00Z', recordsProcessed: 0, errorCount: 1, message: 'API 503 from OASIS endpoint' },
  { id: 'pr6', name: 'policy_targets_refresh', status: 'queued', startedAt: '2025-08-05T01:00:00Z', recordsProcessed: 0, errorCount: 0 },
]

export const PIPELINE_ERRORS: PipelineError[] = [
  { id: 'e1', runId: 'pr5', timestamp: '2025-08-04T23:02:11Z', severity: 'error', entity: 'transmission_flows', message: 'OASIS API returned 503 Service Unavailable' },
  { id: 'e2', runId: 'pr3', timestamp: '2025-08-04T04:18:02Z', severity: 'warning', entity: 'plants', message: 'Missing lat/lon for plant_id=p_orphan_44' },
  { id: 'e3', runId: 'pr3', timestamp: '2025-08-04T04:18:05Z', severity: 'warning', entity: 'plants', message: 'Duplicate name collision: "Solar Farm 12"' },
  { id: 'e4', runId: 'pr2', timestamp: '2025-08-04T05:35:44Z', severity: 'warning', entity: 'generation_hourly', message: 'Null fuel code for plant EIA-000123' },
  { id: 'e5', runId: 'pr2', timestamp: '2025-08-04T05:36:01Z', severity: 'info', entity: 'generation_hourly', message: 'Backfilled 48 hours from previous month average' },
]

export const QUALITY_CHECKS: QualityCheck[] = [
  { id: 'q1', name: 'Load completeness', entity: 'load_hourly', status: 'pass', detail: '0 missing hours in last 30 days', lastRun: '2025-08-05T00:00:00Z' },
  { id: 'q2', name: 'Capacity vs generation CF bounds', entity: 'generation_hourly', status: 'pass', detail: 'All CF values within [0, 1.05]', lastRun: '2025-08-05T00:00:00Z' },
  { id: 'q3', name: 'Plant geo coverage', entity: 'plants', status: 'warn', detail: '1.3% of plants missing coordinates', lastRun: '2025-08-04T04:22:00Z' },
  { id: 'q4', name: 'Transmission balance', entity: 'transmission_flows', status: 'fail', detail: 'Last RT pull failed — stale > 24h', lastRun: '2025-08-04T23:03:00Z' },
  { id: 'q5', name: 'Storage SoC range', entity: 'storage_hourly', status: 'pass', detail: 'SoC within [0, max_capacity]', lastRun: '2025-08-05T00:15:00Z' },
  { id: 'q6', name: 'Policy target uniqueness', entity: 'policy_targets', status: 'pass', detail: 'No duplicate (metric, year) pairs', lastRun: '2025-08-01T12:00:00Z' },
]

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'm1',
    name: 'Peak Load',
    formula: 'MAX(load_hourly.load_mw) over period',
    unit: 'GW',
    description: 'Highest system demand observed in the selected period.',
    sourceEntities: ['load_hourly'],
  },
  {
    id: 'm2',
    name: 'Clean Energy Share',
    formula: 'SUM(gen WHERE tech IN clean) / SUM(gen) * 100',
    unit: '%',
    description: 'Share of generation from solar, wind, hydro, nuclear, geothermal, and biomass.',
    sourceEntities: ['generation_hourly'],
  },
  {
    id: 'm3',
    name: 'Reserve Margin',
    formula: '(available_capacity - peak_load) / peak_load * 100',
    unit: '%',
    description: 'Surplus capacity relative to peak demand, including imports credit.',
    sourceEntities: ['plants', 'load_hourly', 'transmission_flows'],
  },
  {
    id: 'm4',
    name: 'Emissions',
    formula: 'SUM(gen_gas * carbon_intensity_gas) / 1e6',
    unit: 'Mt CO₂e',
    description: 'Estimated CO₂e from natural gas generation using assumption carbon intensity.',
    sourceEntities: ['generation_hourly', 'assumptions'],
  },
  {
    id: 'm5',
    name: 'Net Imports',
    formula: 'SUM(import_mw) - SUM(export_mw)',
    unit: 'GW',
    description: 'Net electricity imports into California balancing areas.',
    sourceEntities: ['transmission_flows'],
  },
]

export const DATA_MODEL = [
  { entity: 'plants', fields: ['id', 'name', 'technology', 'capacity_mw', 'region', 'operator', 'online_year', 'lat', 'lon'], pk: 'id', rows: PLANTS.length },
  { entity: 'generation_hourly', fields: ['timestamp', 'technology', 'region', 'mwh'], pk: 'timestamp+technology+region', rows: 8760 * 9 },
  { entity: 'load_hourly', fields: ['timestamp', 'region', 'load_mw'], pk: 'timestamp+region', rows: 8760 * 6 },
  { entity: 'storage_hourly', fields: ['timestamp', 'region', 'charge_mw', 'discharge_mw', 'soc_mwh'], pk: 'timestamp+region', rows: 8760 * 6 },
  { entity: 'transmission_flows', fields: ['id', 'from_region', 'to_region', 'mw', 'direction', 'path'], pk: 'id', rows: 8 },
  { entity: 'policy_targets', fields: ['id', 'name', 'year', 'metric', 'target_value', 'unit', 'source'], pk: 'id', rows: POLICY_TARGETS.length },
  { entity: 'scenarios', fields: ['id', 'name', 'assumptions_json', 'outputs_json', 'created_at'], pk: 'id', rows: PRESET_SCENARIOS.length },
  { entity: 'assumptions', fields: ['id', 'key', 'value', 'unit', 'source_id', 'confidence'], pk: 'id', rows: ASSUMPTIONS.length },
  { entity: 'sources', fields: ['id', 'title', 'organization', 'url', 'year', 'type', 'tags'], pk: 'id', rows: SOURCES.length },
  { entity: 'notes', fields: ['id', 'title', 'body', 'tags', 'linked_source_ids'], pk: 'id', rows: NOTES.length },
  { entity: 'pipeline_runs', fields: ['id', 'name', 'status', 'started_at', 'finished_at', 'records', 'errors'], pk: 'id', rows: PIPELINE_RUNS.length },
]

export const LAST_REFRESH = '2025-08-05T00:15:00Z'

export { TECH_LABELS, computeOutputs, defaultAssumptions }
