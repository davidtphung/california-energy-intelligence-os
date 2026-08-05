/**
 * Synthetic US grid topology + time-varying electrical samples.
 * Production: replace with EMS / SCADA / ISO APIs + WebSocket feeds.
 */

import { US_STATES } from '../data/usStates'
import type {
  GridAlert,
  GridFrame,
  GridLine,
  GridMode,
  GridNode,
  GridTopology,
  LineSample,
  NodeSample,
} from './types'

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function noise(seed: number, t: number): number {
  const x = Math.sin(seed * 12.9898 + t * 0.00007) * 43758.5453
  return x - Math.floor(x)
}

function wave(t: number, periodMs: number, phase = 0): number {
  return 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / periodMs + phase)
}

/** Major hub nodes from state centroids + synthetic substations */
export function buildTopology(): GridTopology {
  const hubs: GridNode[] = US_STATES.filter((s) => s.capacityGw >= 3).map((s) => ({
    id: `hub-${s.abbr.toLowerCase()}`,
    name: `${s.name} hub`,
    kind: 'hub' as const,
    lon: s.lon,
    lat: s.lat,
    stateAbbr: s.abbr,
    region: s.region,
    operator: s.grid,
    voltageKvNom: s.capacityGw > 40 ? 500 : s.capacityGw > 15 ? 345 : 230,
    capacityMw: Math.round(s.capacityGw * 1000),
  }))

  // Named flagship nodes
  const extras: GridNode[] = [
    {
      id: 'sub-palo-verde',
      name: 'Palo Verde',
      kind: 'generator',
      lon: -112.865,
      lat: 33.389,
      stateAbbr: 'AZ',
      region: 'Southwest',
      operator: 'WECC (non-CAISO)',
      voltageKvNom: 500,
      capacityMw: 3937,
    },
    {
      id: 'sub-grand-coulee',
      name: 'Grand Coulee',
      kind: 'generator',
      lon: -118.982,
      lat: 47.956,
      stateAbbr: 'WA',
      region: 'Pacific',
      operator: 'WECC (non-CAISO)',
      voltageKvNom: 500,
      capacityMw: 6809,
    },
    {
      id: 'sub-moss-bess',
      name: 'Moss Landing BESS',
      kind: 'battery',
      lon: -121.782,
      lat: 36.805,
      stateAbbr: 'CA',
      region: 'Pacific',
      operator: 'CAISO',
      voltageKvNom: 230,
      capacityMw: 750,
      energyMwhCap: 3000,
    },
    {
      id: 'sub-edwards-bess',
      name: 'Edwards Storage',
      kind: 'battery',
      lon: -117.905,
      lat: 34.905,
      stateAbbr: 'CA',
      region: 'Pacific',
      operator: 'CAISO',
      voltageKvNom: 230,
      capacityMw: 3285,
      energyMwhCap: 8000,
    },
    {
      id: 'sub-houston',
      name: 'Houston load pocket',
      kind: 'load',
      lon: -95.37,
      lat: 29.76,
      stateAbbr: 'TX',
      region: 'Texas',
      operator: 'ERCOT',
      voltageKvNom: 345,
      capacityMw: 18000,
    },
    {
      id: 'sub-nyc',
      name: 'NYC load pocket',
      kind: 'load',
      lon: -73.99,
      lat: 40.75,
      stateAbbr: 'NY',
      region: 'Northeast',
      operator: 'NYISO',
      voltageKvNom: 345,
      capacityMw: 12000,
    },
    {
      id: 'sub-chicago',
      name: 'Chicago hub',
      kind: 'hub',
      lon: -87.63,
      lat: 41.88,
      stateAbbr: 'IL',
      region: 'Midwest',
      operator: 'PJM',
      voltageKvNom: 345,
      capacityMw: 15000,
    },
    {
      id: 'sub-atlanta',
      name: 'Atlanta hub',
      kind: 'hub',
      lon: -84.39,
      lat: 33.75,
      stateAbbr: 'GA',
      region: 'Southeast',
      operator: 'SERC / non-ISO',
      voltageKvNom: 500,
      capacityMw: 10000,
    },
  ]

  const nodes = [...hubs, ...extras]

  // Inter-regional corridors (nearest large hubs by simple adjacency)
  const major = hubs
    .filter((h) => h.capacityMw >= 20000)
    .sort((a, b) => b.capacityMw - a.capacityMw)
    .slice(0, 28)

  const lines: GridLine[] = []
  const addLine = (a: GridNode, b: GridNode, ratingMw: number, voltageKv: number) => {
    if (a.id === b.id) return
    const id = `ln-${a.id}-${b.id}`
    if (lines.some((l) => l.id === id || l.id === `ln-${b.id}-${a.id}`)) return
    lines.push({
      id,
      name: `${a.stateAbbr}–${b.stateAbbr} corridor`,
      fromId: a.id,
      toId: b.id,
      kind: 'intertie',
      voltageKv,
      ratingMw,
      operator: a.operator === b.operator ? a.operator : 'Multiple / other',
    })
  }

  // Connect each major hub to 2–3 nearest majors
  for (const a of major) {
    const others = major
      .filter((b) => b.id !== a.id)
      .map((b) => ({
        b,
        d: (a.lon - b.lon) ** 2 + (a.lat - b.lat) ** 2,
      }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 3)
    for (const { b } of others) {
      const rating = Math.round(Math.min(a.capacityMw, b.capacityMw) * 0.08)
      addLine(a, b, Math.max(800, Math.min(5000, rating)), Math.max(a.voltageKvNom, b.voltageKvNom))
    }
  }

  // Wire extras into state hubs
  for (const e of extras) {
    const hub = hubs.find((h) => h.stateAbbr === e.stateAbbr) ?? hubs[0]
    addLine(e, hub, Math.max(500, Math.round(e.capacityMw * 0.6)), e.voltageKvNom)
  }

  // Named long-haul paths
  const byAbbr = (abbr: string) => hubs.find((h) => h.stateAbbr === abbr)
  const pairs: [string, string, number][] = [
    ['CA', 'AZ', 3200],
    ['CA', 'OR', 4800],
    ['WA', 'OR', 4000],
    ['TX', 'OK', 2500],
    ['IL', 'IN', 3000],
    ['PA', 'NJ', 2800],
    ['NY', 'PA', 2200],
    ['FL', 'GA', 2600],
    ['CO', 'WY', 1500],
    ['AZ', 'NV', 2000],
  ]
  for (const [a, b, r] of pairs) {
    const na = byAbbr(a)
    const nb = byAbbr(b)
    if (na && nb) addLine(na, nb, r, 500)
  }

  return { nodes, lines }
}

let cachedTopo: GridTopology | null = null
export function getTopology(): GridTopology {
  if (!cachedTopo) cachedTopo = buildTopology()
  return cachedTopo
}

export function sampleFrame(t: number, mode: GridMode = 'live'): GridFrame {
  const { nodes, lines } = getTopology()
  const day = wave(t, 86_400_000, 0.2)
  const peak = 0.55 + 0.45 * day
  const forecastBias = mode === 'forecast' ? 1.04 : mode === 'historical' ? 0.97 : 1

  const nodeSamples: Record<string, NodeSample> = {}
  for (const n of nodes) {
    const seed = hash(n.id)
    const n1 = noise(seed, t)
    const n2 = noise(seed + 7, t + 3_600_000)
    const loadFactor =
      n.kind === 'load' ? 0.55 + 0.4 * peak : n.kind === 'hub' ? 0.35 + 0.35 * peak : 0.15 + 0.2 * peak
    const genFactor =
      n.kind === 'generator'
        ? 0.7 + 0.25 * n1
        : n.kind === 'battery'
          ? 0.1 + 0.5 * (n2 - 0.5)
          : n.kind === 'hub'
            ? 0.4 + 0.3 * n1 * peak
            : 0.05 + 0.1 * n1

    const loadMw = Math.max(0, n.capacityMw * loadFactor * forecastBias * (0.85 + 0.3 * n1))
    let genMw = Math.max(0, n.capacityMw * Math.max(0, genFactor) * forecastBias)
    if (n.kind === 'battery') {
      // discharge positive gen, charge as load
      const charge = n2 > 0.55
      if (charge) {
        genMw = 0
      }
    }
    const powerMw = genMw - loadMw
    const vNom = n.voltageKvNom
    const voltageKv = vNom * (0.97 + 0.05 * n1 - (loadMw / Math.max(1, n.capacityMw)) * 0.04)
    const currentA = Math.abs(powerMw) * 1000 / Math.max(1, voltageKv * Math.sqrt(3)) // rough 3φ
    const energyMwh = (loadMw + genMw) * 0.25 // 15-min proxy
    const ampHours = (currentA * 0.25)
    const powerDensity = Math.min(100, (loadMw + genMw) / Math.max(1, n.capacityMw) * 90 + n1 * 10)
    const energyDensity = powerDensity * (0.8 + 0.2 * day)
    const congestion = Math.min(1, Math.max(0, (loadMw + genMw) / Math.max(1, n.capacityMw) - 0.55) * 1.8)
    const emissions =
      n.kind === 'generator'
        ? 120 + n1 * 280
        : n.kind === 'battery'
          ? 40 + n1 * 30
          : 200 + n1 * 250
    const soc =
      n.kind === 'battery'
        ? Math.round(35 + 50 * wave(t, 14_400_000, seed / 1e9) + (n2 - 0.5) * 10)
        : undefined
    const outage = n1 > 0.992 && n.kind !== 'hub'
    const freshnessSec = mode === 'live' ? Math.round(2 + n1 * 18) : mode === 'forecast' ? 0 : 3600
    const confidence = mode === 'forecast' ? 0.65 + n1 * 0.2 : 0.88 + n1 * 0.1

    nodeSamples[n.id] = {
      nodeId: n.id,
      t,
      loadMw: +loadMw.toFixed(1),
      genMw: +genMw.toFixed(1),
      powerMw: +powerMw.toFixed(1),
      voltageKv: +voltageKv.toFixed(2),
      currentA: +currentA.toFixed(0),
      energyMwh: +energyMwh.toFixed(1),
      ampHours: +ampHours.toFixed(0),
      powerDensity: +powerDensity.toFixed(1),
      energyDensity: +energyDensity.toFixed(1),
      congestion: +congestion.toFixed(3),
      emissions: +emissions.toFixed(0),
      soc: soc != null ? Math.min(100, Math.max(0, soc)) : undefined,
      outage,
      freshnessSec,
      confidence: +confidence.toFixed(2),
    }
  }

  const lineSamples: Record<string, LineSample> = {}
  for (const ln of lines) {
    const seed = hash(ln.id)
    const n1 = noise(seed, t)
    const from = nodeSamples[ln.fromId]
    const to = nodeSamples[ln.toId]
    const imbalance = (from?.powerMw ?? 0) - (to?.powerMw ?? 0)
    const flowMw = Math.max(
      -ln.ratingMw * 0.95,
      Math.min(ln.ratingMw * 0.95, imbalance * 0.15 + (n1 - 0.5) * ln.ratingMw * 0.45 * peak)
    )
    const loading = Math.abs(flowMw) / ln.ratingMw
    const voltageKv = ln.voltageKv * (0.98 + 0.03 * n1 - loading * 0.02)
    const currentA = (Math.abs(flowMw) * 1000) / Math.max(1, voltageKv * Math.sqrt(3))
    const congestion = Math.min(1, Math.max(0, loading - 0.7) / 0.3)
    const outage = n1 > 0.995

    lineSamples[ln.id] = {
      lineId: ln.id,
      t,
      flowMw: +flowMw.toFixed(1),
      loading: +loading.toFixed(3),
      voltageKv: +voltageKv.toFixed(2),
      currentA: +currentA.toFixed(0),
      congestion: +congestion.toFixed(3),
      outage,
    }
  }

  const alerts: GridAlert[] = []
  for (const n of nodes) {
    const s = nodeSamples[n.id]
    if (s.outage) {
      alerts.push({
        id: `a-out-${n.id}-${t}`,
        t,
        severity: 'critical',
        title: `Outage · ${n.name}`,
        body: 'Node offline or telemetered zero. Verify SCADA and crew status.',
        nodeId: n.id,
      })
    } else if (s.congestion > 0.85) {
      alerts.push({
        id: `a-cng-${n.id}-${t}`,
        t,
        severity: 'warn',
        title: `Congestion · ${n.name}`,
        body: `Local constraint index ${(s.congestion * 100).toFixed(0)}%. Consider redispatch.`,
        nodeId: n.id,
        metric: 'congestion',
      })
    } else if (s.voltageKv < n.voltageKvNom * 0.95) {
      alerts.push({
        id: `a-v-${n.id}-${t}`,
        t,
        severity: 'warn',
        title: `Low voltage · ${n.name}`,
        body: `${s.voltageKv.toFixed(1)} kV vs ${n.voltageKvNom} kV nominal.`,
        nodeId: n.id,
        metric: 'voltageKv',
      })
    }
  }
  for (const ln of lines) {
    const s = lineSamples[ln.id]
    if (s.loading > 0.9 && !s.outage) {
      alerts.push({
        id: `a-ln-${ln.id}-${t}`,
        t,
        severity: s.loading > 0.97 ? 'critical' : 'warn',
        title: `Line loading · ${ln.name}`,
        body: `${(s.loading * 100).toFixed(0)}% of ${ln.ratingMw} MW rating · ${Math.abs(s.flowMw).toFixed(0)} MW flow.`,
        lineId: ln.id,
        metric: 'flowMw',
      })
    }
  }

  // Cap alerts for UI
  alerts.sort((a, b) => {
    const rank = { critical: 0, warn: 1, info: 2 }
    return rank[a.severity] - rank[b.severity]
  })
  const topAlerts = alerts.slice(0, 12)

  const totalLoad = Object.values(nodeSamples).reduce((s, x) => s + x.loadMw, 0)
  const totalGen = Object.values(nodeSamples).reduce((s, x) => s + x.genMw, 0)
  const hot = Object.values(lineSamples).filter((l) => l.loading > 0.85).length
  const crit = topAlerts.filter((a) => a.severity === 'critical').length

  const summary =
    mode === 'forecast'
      ? `Forecast: system load ~${(totalLoad / 1000).toFixed(0)} GW, gen ~${(totalGen / 1000).toFixed(0)} GW. ${hot} corridors above 85% loading expected.`
      : crit > 0
        ? `Live: ${(totalLoad / 1000).toFixed(0)} GW load · ${crit} critical alert${crit === 1 ? '' : 's'} · ${hot} constrained corridor${hot === 1 ? '' : 's'}. Prioritize outages and overload paths.`
        : hot > 0
          ? `Live: balanced at ${(totalLoad / 1000).toFixed(0)} GW load. ${hot} corridors near limit — watch redispatch and storage discharge.`
          : `Live: healthy. Load ${(totalLoad / 1000).toFixed(0)} GW · gen ${(totalGen / 1000).toFixed(0)} GW · no critical alerts. Density highest in coastal and ERCOT load pockets.`

  return {
    t,
    mode,
    nodes: nodeSamples,
    lines: lineSamples,
    alerts: topAlerts,
    summary,
  }
}

/** Historical timeline: one frame per step over lookback */
export function buildTimeline(now: number, hours = 24, stepMin = 15): GridFrame[] {
  const step = stepMin * 60_000
  const frames: GridFrame[] = []
  const start = now - hours * 3_600_000
  for (let t = start; t <= now; t += step) {
    frames.push(sampleFrame(t, 'historical'))
  }
  return frames
}

export function operatorsList(topo: GridTopology = getTopology()): string[] {
  return [...new Set(topo.nodes.map((n) => n.operator))].sort()
}

export function regionsList(topo: GridTopology = getTopology()): string[] {
  return [...new Set(topo.nodes.map((n) => n.region))].sort()
}
