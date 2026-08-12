/** Core domain types for Energy Intelligence System (EIS) */

export type Technology =
  | 'solar'
  | 'wind'
  | 'hydro'
  | 'natural_gas'
  | 'coal'
  | 'nuclear'
  | 'geothermal'
  | 'biomass'
  | 'battery'
  | 'other'

export type CARegion =
  | 'Northern CA'
  | 'Bay Area'
  | 'Central Valley'
  | 'Central Coast'
  | 'Southern CA'
  | 'Desert / Inland Empire'
  | 'Statewide'

export type AppMode = 'analyst' | 'planner' | 'engineer' | 'developer'
export type AppView =
  | 'map' // primary live map
  | 'overview' // legacy alias → map
  | 'demand' // AI / pop / industrial demand + capital
  | 'balance' // all-source supply / demand / deficits
  | 'portfolios'
  | 'states'
  | 'state-detail'
  | 'fossil'
  | 'gas' // alias → fossil
  | 'policy'
  | 'consistency'
  | 'scenarios'
  | 'research'
  | 'data-engineering'
  | 'developer'
  | 'about'
  | 'thesis'

export type PortfolioKind =
  | 'IOU'
  | 'CCA'
  | 'Municipal'
  | 'Irrigation / water'
  | 'Generator'
  | 'Federal / state'
  | 'Balancing area'

export type PortfolioSector =
  | 'retail load'
  | 'wholesale gen'
  | 'storage'
  | 'hydro system'
  | 'nuclear'
  | 'renewables'
  | 'gas fleet'

export type PipelineStatus = 'success' | 'running' | 'failed' | 'queued' | 'warning'

export interface Plant {
  id: string
  name: string
  technology: Technology
  capacityMw: number
  region: CARegion
  operator: string
  onlineYear: number
  retirementYear?: number
  latitude: number
  longitude: number
}

export interface GenerationHourly {
  timestamp: string
  technology: Technology
  region: CARegion
  mwh: number
}

export interface LoadHourly {
  timestamp: string
  region: CARegion
  loadMw: number
}

export interface StorageHourly {
  timestamp: string
  region: CARegion
  chargeMw: number
  dischargeMw: number
  stateOfChargeMwh: number
}

export interface TransmissionFlow {
  id: string
  fromRegion: string
  toRegion: string
  mw: number
  direction: 'import' | 'export' | 'internal'
  path: string
}

export interface PolicyTarget {
  id: string
  name: string
  year: number
  metric: string
  targetValue: number
  unit: string
  source: string
}

export interface ScenarioAssumptions {
  demandGrowthPct: number
  solarBuildoutGw: number
  windBuildoutGw: number
  storageBuildoutGw: number
  gasRetirementsGw: number
  hydroVariability: number // 0.7-1.3 multiplier
  importLevelGw: number
  cleanEnergyTargetPct: number
  carbonPrice: number // $/ton
}

export interface ScenarioOutputs {
  year: 2030 | 2035 | 2045
  capacityNeedGw: number
  emissionsMt: number
  reserveMarginPct: number
  systemCostBillion: number
  cleanEnergySharePct: number
  peakLoadGw: number
  storageGw: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  isPreset: boolean
  createdAt: string
  assumptions: ScenarioAssumptions
  outputs: ScenarioOutputs[]
}

export interface Assumption {
  id: string
  key: string
  value: string | number
  unit: string
  sourceId?: string
  confidence: 'high' | 'medium' | 'low'
  notes?: string
  updatedAt: string
}

export interface Source {
  id: string
  title: string
  organization: 'CEC' | 'CAISO' | 'EIA' | 'CPUC' | 'Utility' | 'Policy' | 'Other'
  url: string
  year: number
  type: 'report' | 'dataset' | 'filing' | 'policy' | 'brief'
  tags: string[]
  summary: string
}

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  linkedSourceIds: string[]
  linkedAssumptionIds: string[]
  createdAt: string
  updatedAt: string
}

export interface PipelineRun {
  id: string
  name: string
  status: PipelineStatus
  startedAt: string
  finishedAt?: string
  recordsProcessed: number
  errorCount: number
  message?: string
}

export interface PipelineError {
  id: string
  runId: string
  timestamp: string
  severity: 'error' | 'warning' | 'info'
  entity: string
  message: string
}

export interface QualityCheck {
  id: string
  name: string
  entity: string
  status: 'pass' | 'fail' | 'warn'
  detail: string
  lastRun: string
}

export interface MetricDefinition {
  id: string
  name: string
  formula: string
  unit: string
  description: string
  sourceEntities: string[]
}

export interface Filters {
  year: number
  month: number | 'all'
  technology: Technology | 'all'
  region: CARegion | 'all'
  scenarioId: string
}

export interface CapacityByTech {
  technology: Technology
  capacityMw: number
  share: number
}

export interface GenerationBySource {
  technology: Technology
  mwh: number
  share: number
}

export interface KPISet {
  peakLoadGw: number
  cleanEnergySharePct: number
  reserveMarginPct: number
  emissionsMt: number
  batteryCapacityGw: number
  batteryDischargeGwh: number
  netImportsGw: number
  totalCapacityGw: number
}
