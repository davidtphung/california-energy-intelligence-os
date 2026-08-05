import type {
  GridFilters,
  GridFrame,
  GridKpis,
  GridLine,
  GridNode,
  GridTopology,
  LayerId,
  MetricKey,
  NodeSample,
} from './types'
import { METRIC_META } from './types'

export function computeKpis(frame: GridFrame, _topo?: GridTopology): GridKpis {
  const nodes = Object.values(frame.nodes)
  const lines = Object.values(frame.lines)
  const loadMw = nodes.reduce((s, n) => s + n.loadMw, 0)
  const genMw = nodes.reduce((s, n) => s + n.genMw, 0)
  const flowAbs = lines.reduce((s, l) => s + Math.abs(l.flowMw), 0)
  const avgV =
    nodes.reduce((s, n) => s + n.voltageKv, 0) / Math.max(1, nodes.length)
  const peakA = Math.max(0, ...nodes.map((n) => n.currentA), ...lines.map((l) => l.currentA))
  const bats = nodes.filter((n) => n.soc != null)
  const storageSocPct =
    bats.length === 0
      ? 0
      : bats.reduce((s, n) => s + (n.soc ?? 0), 0) / bats.length
  const congestionLines = lines.filter((l) => l.loading >= 0.85 || l.congestion >= 0.5).length
  const alertsCritical = frame.alerts.filter((a) => a.severity === 'critical').length
  const emissionsIntensity =
    nodes.reduce((s, n) => s + n.emissions * n.genMw, 0) / Math.max(1, genMw)
  const freshnessSec = Math.max(...nodes.map((n) => n.freshnessSec), 0)

  return {
    loadGw: loadMw / 1000,
    genGw: genMw / 1000,
    netFlowGw: flowAbs / 2000,
    avgVoltageKv: avgV,
    peakCurrentKa: peakA / 1000,
    storageSocPct,
    congestionLines,
    alertsCritical,
    emissionsIntensity,
    freshnessSec,
  }
}

export function metricValue(sample: NodeSample, key: MetricKey): number {
  switch (key) {
    case 'powerMw':
      return sample.powerMw
    case 'loadMw':
      return sample.loadMw
    case 'genMw':
      return sample.genMw
    case 'voltageKv':
      return sample.voltageKv
    case 'currentA':
      return sample.currentA
    case 'energyMwh':
      return sample.energyMwh
    case 'ampHours':
      return sample.ampHours
    case 'powerDensity':
      return sample.powerDensity
    case 'energyDensity':
      return sample.energyDensity
    case 'congestion':
      return sample.congestion * 100
    case 'emissions':
      return sample.emissions
    case 'soc':
      return sample.soc ?? 0
    case 'flowMw':
      return Math.abs(sample.powerMw)
    default:
      return 0
  }
}

/** Color semantics: blue supply/low, green healthy, orange stress, red critical, purple storage */
export function valueToColor(
  value: number,
  metric: MetricKey,
  min: number,
  max: number
): string {
  const span = Math.max(1e-6, max - min)
  const t = Math.min(1, Math.max(0, (value - min) / span))

  if (metric === 'soc') {
    // purple scale
    return lerpColor('#4c1d95', '#c4b5fd', t)
  }
  if (metric === 'voltageKv') {
    // low = orange/red, nom = green, high = blue
    if (t < 0.35) return lerpColor('#9f1239', '#fbbf24', t / 0.35)
    if (t < 0.65) return lerpColor('#fbbf24', '#22c55e', (t - 0.35) / 0.3)
    return lerpColor('#22c55e', '#38bdf8', (t - 0.65) / 0.35)
  }
  if (metric === 'congestion' || metric === 'currentA' || metric === 'emissions') {
    if (t > 0.85) return '#e11d48'
    if (t > 0.6) return '#f97316'
    if (t > 0.35) return '#eab308'
    return '#22c55e'
  }
  if (metric === 'genMw') return lerpColor('#0ea5e9', '#38bdf8', t)
  if (metric === 'loadMw' || metric === 'powerDensity' || metric === 'energyDensity') {
    if (t > 0.85) return '#e11d48'
    if (t > 0.65) return '#f97316'
    if (t > 0.4) return '#eab308'
    return lerpColor('#86efac', '#22c55e', t)
  }
  // default power / energy
  if (t > 0.85) return '#e11d48'
  if (t > 0.65) return '#f97316'
  if (t > 0.4) return '#38bdf8'
  return '#22c55e'
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a)
  const pb = hexToRgb(b)
  const r = Math.round(pa.r + (pb.r - pa.r) * t)
  const g = Math.round(pa.g + (pb.g - pa.g) * t)
  const bl = Math.round(pa.b + (pb.b - pa.b) * t)
  return `rgb(${r},${g},${bl})`
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function lineColor(loading: number, outage: boolean): string {
  if (outage) return '#e11d48'
  if (loading >= 0.95) return '#e11d48'
  if (loading >= 0.85) return '#f97316'
  if (loading >= 0.6) return '#eab308'
  return '#38bdf8'
}

export function filterNodes(
  topo: GridTopology,
  frame: GridFrame,
  f: GridFilters
): GridNode[] {
  const q = f.search.trim().toLowerCase()
  return topo.nodes.filter((n) => {
    if (f.operator !== 'all' && n.operator !== f.operator) return false
    if (f.region !== 'all' && n.region !== f.region) return false
    if (f.assetType !== 'all' && n.kind !== f.assetType) return false
    const s = frame.nodes[n.id]
    if (s && s.confidence < f.minConfidence) return false
    if (!q) return true
    return (
      n.name.toLowerCase().includes(q) ||
      n.stateAbbr.toLowerCase().includes(q) ||
      n.operator.toLowerCase().includes(q) ||
      n.region.toLowerCase().includes(q) ||
      n.kind.includes(q)
    )
  })
}

export function filterLines(
  topo: GridTopology,
  nodeIds: Set<string>
): GridLine[] {
  return topo.lines.filter((l) => nodeIds.has(l.fromId) || nodeIds.has(l.toId))
}

export function metricRange(
  frame: GridFrame,
  nodes: GridNode[],
  metric: MetricKey
): { min: number; max: number } {
  const vals = nodes.map((n) => metricValue(frame.nodes[n.id]!, metric)).filter((v) => !Number.isNaN(v))
  if (!vals.length) return { min: 0, max: 1 }
  return { min: Math.min(...vals), max: Math.max(...vals) }
}

export function formatMetric(value: number, metric: MetricKey): string {
  const u = METRIC_META[metric].unit
  if (metric === 'congestion' || metric === 'soc') return `${value.toFixed(0)}${u === '%' ? '%' : ''}`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k ${u}`
  if (Math.abs(value) >= 100) return `${value.toFixed(0)} ${u}`
  return `${value.toFixed(1)} ${u}`
}

/** Zoom-aware layer suggestions */
export function suggestLayers(zoom: number): LayerId[] {
  if (zoom < 0.9) return ['base', 'demand', 'flow', 'alerts']
  if (zoom < 1.4) return ['base', 'demand', 'generation', 'flow', 'density', 'alerts']
  return ['base', 'demand', 'generation', 'flow', 'voltage', 'current', 'storage', 'alerts']
}

export function explainDelta(prev: GridFrame | null, cur: GridFrame): string {
  if (!prev) return 'Waiting for previous interval…'
  const pLoad = Object.values(prev.nodes).reduce((s, n) => s + n.loadMw, 0)
  const cLoad = Object.values(cur.nodes).reduce((s, n) => s + n.loadMw, 0)
  const dLoad = cLoad - pLoad
  const pCong = Object.values(prev.lines).filter((l) => l.loading > 0.85).length
  const cCong = Object.values(cur.lines).filter((l) => l.loading > 0.85).length
  const dCong = cCong - pCong
  const parts = [
    `Load ${dLoad >= 0 ? '+' : ''}${(dLoad / 1000).toFixed(2)} GW since last tick`,
    dCong === 0
      ? 'constrained corridors unchanged'
      : `${dCong > 0 ? '+' : ''}${dCong} corridors over 85%`,
  ]
  return parts.join(' · ')
}

export function operatorActions(frame: GridFrame): string[] {
  const actions: string[] = []
  const crit = frame.alerts.filter((a) => a.severity === 'critical')
  if (crit.length) actions.push(`Dispatch crews / verify ${crit.length} critical alarm(s).`)
  const hotLines = Object.values(frame.lines).filter((l) => l.loading > 0.9)
  if (hotLines.length) actions.push(`Redispatch or curtail to unload ${hotLines.length} corridor(s).`)
  const lowSoc = Object.values(frame.nodes).filter((n) => n.soc != null && n.soc < 20)
  if (lowSoc.length) actions.push(`Preserve ${lowSoc.length} low-SOC battery asset(s) for peak.`)
  if (!actions.length) actions.push('No action required · continue monitoring density hotspots.')
  return actions.slice(0, 3)
}
