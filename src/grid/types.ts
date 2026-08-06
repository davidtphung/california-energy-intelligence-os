/**
 * Real-time electrical intelligence data model
 * Live + historical layers for power systems map UX.
 */

export type GridMode = 'live' | 'historical' | 'forecast'
export type RoleView = 'analyst' | 'operator' | 'executive'

export type MetricKey =
  | 'powerMw'
  | 'loadMw'
  | 'genMw'
  | 'voltageKv'
  | 'currentA'
  | 'energyMwh'
  | 'ampHours'
  | 'powerDensity'
  | 'energyDensity'
  | 'congestion'
  | 'emissions'
  | 'soc'
  | 'flowMw'

export type LayerId =
  | 'base'
  | 'demand'
  | 'generation'
  | 'flow'
  | 'density'
  | 'voltage'
  | 'current'
  | 'storage'
  | 'alerts'

export type NodeKind = 'region' | 'substation' | 'generator' | 'load' | 'battery' | 'hub'
export type LineKind = 'transmission' | 'flow' | 'intertie'
export type AlertSeverity = 'info' | 'warn' | 'critical'

export interface GridNode {
  id: string
  name: string
  kind: NodeKind
  lon: number
  lat: number
  stateAbbr: string
  region: string
  operator: string
  voltageKvNom: number
  capacityMw: number
  /** Battery capacity MWh if storage */
  energyMwhCap?: number
}

export interface GridLine {
  id: string
  name: string
  fromId: string
  toId: string
  kind: LineKind
  voltageKv: number
  ratingMw: number
  operator: string
}

export interface NodeSample {
  nodeId: string
  t: number // unix ms
  loadMw: number
  genMw: number
  powerMw: number // net injection
  voltageKv: number
  currentA: number
  energyMwh: number // rolling interval energy
  ampHours: number
  powerDensity: number // MW / km² proxy 0-100
  energyDensity: number // MWh / km² proxy
  congestion: number // 0-1
  emissions: number // kgCO2/MWh
  soc?: number // 0-100 battery
  outage: boolean
  freshnessSec: number
  confidence: number // 0-1
}

export interface LineSample {
  lineId: string
  t: number
  flowMw: number // signed: + from→to
  loading: number // 0-1 vs rating
  voltageKv: number
  currentA: number
  congestion: number
  outage: boolean
}

export interface GridAlert {
  id: string
  t: number
  severity: AlertSeverity
  title: string
  body: string
  nodeId?: string
  lineId?: string
  metric?: MetricKey
}

export interface GridFrame {
  t: number
  mode: GridMode
  nodes: Record<string, NodeSample>
  lines: Record<string, LineSample>
  alerts: GridAlert[]
  summary: string
}

export interface GridTopology {
  nodes: GridNode[]
  lines: GridLine[]
}

export interface GridKpis {
  loadGw: number
  genGw: number
  netFlowGw: number
  avgVoltageKv: number
  peakCurrentKa: number
  storageSocPct: number
  congestionLines: number
  alertsCritical: number
  emissionsIntensity: number
  freshnessSec: number
}

export interface GridFilters {
  mode: GridMode
  role: RoleView
  operator: string | 'all'
  region: string | 'all'
  assetType: NodeKind | 'all'
  metric: MetricKey
  units: 'si' | 'imperial'
  thresholdPct: number
  minConfidence: number
  search: string
}

export const LAYER_META: {
  id: LayerId
  label: string
  short: string
  defaultOn: boolean
  zoomMin?: number
}[] = [
  { id: 'base', label: 'Grid base', short: 'Base', defaultOn: true },
  { id: 'demand', label: 'Demand load', short: 'Demand', defaultOn: true },
  { id: 'generation', label: 'Generation', short: 'Gen', defaultOn: true },
  { id: 'flow', label: 'Transmission flow', short: 'Flow', defaultOn: true },
  { id: 'density', label: 'Power density', short: 'Density', defaultOn: true },
  { id: 'voltage', label: 'Voltage bands', short: 'Voltage', defaultOn: true },
  { id: 'current', label: 'Current hotspots', short: 'Current', defaultOn: true },
  { id: 'storage', label: 'Storage / SOC', short: 'Storage', defaultOn: true },
  { id: 'alerts', label: 'Alerts & outages', short: 'Alerts', defaultOn: true },
]

export const METRIC_META: Record<
  MetricKey,
  { label: string; unit: string; unitImp?: string; description: string }
> = {
  powerMw: { label: 'Power', unit: 'MW', description: 'Net real power' },
  loadMw: { label: 'Load', unit: 'MW', description: 'Demand' },
  genMw: { label: 'Generation', unit: 'MW', description: 'Supply' },
  voltageKv: { label: 'Voltage', unit: 'kV', description: 'Bus voltage' },
  currentA: { label: 'Current', unit: 'A', description: 'Line / node current' },
  energyMwh: { label: 'Energy', unit: 'MWh', description: 'Interval energy' },
  ampHours: { label: 'Amp-hours', unit: 'Ah', description: 'Storage charge units' },
  powerDensity: { label: 'Power density', unit: 'idx', description: 'Spatial power intensity' },
  energyDensity: { label: 'Energy density', unit: 'idx', description: 'Spatial energy intensity' },
  congestion: { label: 'Congestion', unit: '%', description: 'Constraint loading' },
  emissions: { label: 'Emissions intensity', unit: 'kg/MWh', description: 'CO₂ intensity' },
  soc: { label: 'Battery SOC', unit: '%', description: 'State of charge' },
  flowMw: { label: 'Flow', unit: 'MW', description: 'Transmission flow' },
}

export const DEFAULT_FILTERS: GridFilters = {
  mode: 'live',
  role: 'analyst',
  operator: 'all',
  region: 'all',
  assetType: 'all',
  metric: 'loadMw',
  units: 'si',
  thresholdPct: 85,
  minConfidence: 0.5,
  search: '',
}
