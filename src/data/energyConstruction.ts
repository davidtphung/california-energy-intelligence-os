/**
 * Major US energy generation construction / pipeline projects.
 * Nameplate MW and COD years are public-domain / press-scale samples for map UX.
 * Wire to EIA-860m, queue reports, ISO interconnection in production.
 */

import type { Technology } from '../types'
import { TECH_COLORS, TECH_LABELS, TECH_ORDER } from '../lib/utils'

export type ConstructionStatus =
  | 'under-construction'
  | 'pre-construction'
  | 'permitted'
  | 'announced'
  | 'commissioning'

export interface EnergyConstructionProject {
  id: string
  name: string
  technology: Technology
  status: ConstructionStatus
  /** Expected or under-construction capacity MW */
  capacityMw: number
  stateAbbr: string
  stateName: string
  lat: number
  lon: number
  developer: string
  /** Target commercial operation year */
  codYear: number
  /** Year construction started or expected start */
  startYear: number
  region: string
  note?: string
}

export const CONSTRUCTION_STATUS_LABEL: Record<ConstructionStatus, string> = {
  'under-construction': 'Under construction',
  'pre-construction': 'Pre-construction',
  permitted: 'Permitted',
  announced: 'Announced',
  commissioning: 'Commissioning',
}

/** Flagship generation & storage projects currently building or in late pipeline */
export const ENERGY_CONSTRUCTION: EnergyConstructionProject[] = [
  // Nuclear
  {
    id: 'c-vogtle-3-4',
    name: 'Vogtle Units 3 & 4 (late COD / ops ramp)',
    technology: 'nuclear',
    status: 'commissioning',
    capacityMw: 2234,
    stateAbbr: 'GA',
    stateName: 'Georgia',
    lat: 33.143,
    lon: -81.762,
    developer: 'Southern Nuclear / Georgia Power',
    codYear: 2024,
    startYear: 2013,
    region: 'Southeast',
    note: 'First new US large reactors in decades; AP1000.',
  },
  {
    id: 'c-palisades-restart',
    name: 'Palisades restart',
    technology: 'nuclear',
    status: 'under-construction',
    capacityMw: 800,
    stateAbbr: 'MI',
    stateName: 'Michigan',
    lat: 42.323,
    lon: -86.315,
    developer: 'Holtec',
    codYear: 2025,
    startYear: 2024,
    region: 'Midwest',
    note: 'First US commercial restart path.',
  },
  {
    id: 'c-kairos-hermes',
    name: 'Kairos Hermes (demo)',
    technology: 'nuclear',
    status: 'under-construction',
    capacityMw: 35,
    stateAbbr: 'TN',
    stateName: 'Tennessee',
    lat: 35.93,
    lon: -84.31,
    developer: 'Kairos Power',
    codYear: 2027,
    startYear: 2024,
    region: 'Southeast',
    note: 'Fluoride salt-cooled high-temp demo.',
  },
  {
    id: 'c-x-energy-dow',
    name: 'Xe-100 / Dow Seadrift (planned)',
    technology: 'nuclear',
    status: 'announced',
    capacityMw: 320,
    stateAbbr: 'TX',
    stateName: 'Texas',
    lat: 28.41,
    lon: -96.71,
    developer: 'X-energy / Dow',
    codYear: 2030,
    startYear: 2027,
    region: 'Texas',
    note: 'Industrial heat + power SMR path.',
  },

  // Solar + hybrids
  {
    id: 'c-gemini',
    name: 'Gemini Solar + storage',
    technology: 'solar',
    status: 'commissioning',
    capacityMw: 690,
    stateAbbr: 'NV',
    stateName: 'Nevada',
    lat: 36.4,
    lon: -114.8,
    developer: 'Quinbrook / Arevon',
    codYear: 2024,
    startYear: 2021,
    region: 'Southwest',
  },
  {
    id: 'c-eleven-mile',
    name: 'Eleven Mile Solar Center',
    technology: 'solar',
    status: 'under-construction',
    capacityMw: 300,
    stateAbbr: 'AZ',
    stateName: 'Arizona',
    lat: 33.05,
    lon: -112.7,
    developer: 'AES',
    codYear: 2025,
    startYear: 2023,
    region: 'Southwest',
  },
  {
    id: 'c-victory-pass',
    name: 'Victory Pass / Arica Solar',
    technology: 'solar',
    status: 'under-construction',
    capacityMw: 450,
    stateAbbr: 'CA',
    stateName: 'California',
    lat: 33.7,
    lon: -115.4,
    developer: 'Intersect Power',
    codYear: 2025,
    startYear: 2023,
    region: 'Pacific',
  },
  {
    id: 'c-coastal-bend-solar',
    name: 'Coastal Bend solar cluster',
    technology: 'solar',
    status: 'under-construction',
    capacityMw: 500,
    stateAbbr: 'TX',
    stateName: 'Texas',
    lat: 28.0,
    lon: -97.5,
    developer: 'Multiple ERCOT',
    codYear: 2026,
    startYear: 2024,
    region: 'Texas',
  },
  {
    id: 'c-double-black-diamond',
    name: 'Double Black Diamond Solar',
    technology: 'solar',
    status: 'under-construction',
    capacityMw: 400,
    stateAbbr: 'IL',
    stateName: 'Illinois',
    lat: 38.7,
    lon: -89.1,
    developer: 'Swift Current / others',
    codYear: 2025,
    startYear: 2023,
    region: 'Midwest',
  },
  {
    id: 'c-sampson-solar-exp',
    name: 'Carolinas utility solar pipeline',
    technology: 'solar',
    status: 'under-construction',
    capacityMw: 600,
    stateAbbr: 'NC',
    stateName: 'North Carolina',
    lat: 35.2,
    lon: -78.5,
    developer: 'Duke Energy / IPPs',
    codYear: 2027,
    startYear: 2024,
    region: 'Southeast',
  },
  {
    id: 'c-florida-solar-build',
    name: 'FPL / Florida solar build tranche',
    technology: 'solar',
    status: 'under-construction',
    capacityMw: 1200,
    stateAbbr: 'FL',
    stateName: 'Florida',
    lat: 27.5,
    lon: -81.5,
    developer: 'FPL / NextEra',
    codYear: 2027,
    startYear: 2023,
    region: 'Southeast',
    note: 'Multi-site utility program sample.',
  },

  // Wind onshore + offshore
  {
    id: 'c-vineyard',
    name: 'Vineyard Wind 1',
    technology: 'wind',
    status: 'under-construction',
    capacityMw: 800,
    stateAbbr: 'MA',
    stateName: 'Massachusetts',
    lat: 41.05,
    lon: -70.5,
    developer: 'Avangrid / CIP',
    codYear: 2025,
    startYear: 2021,
    region: 'Northeast',
    note: 'First large US commercial offshore.',
  },
  {
    id: 'c-revolution',
    name: 'Revolution Wind',
    technology: 'wind',
    status: 'under-construction',
    capacityMw: 704,
    stateAbbr: 'RI',
    stateName: 'Rhode Island',
    lat: 41.2,
    lon: -71.4,
    developer: 'Ørsted / Eversource',
    codYear: 2026,
    startYear: 2023,
    region: 'Northeast',
  },
  {
    id: 'c-coastal-virginia',
    name: 'Coastal Virginia Offshore Wind',
    technology: 'wind',
    status: 'under-construction',
    capacityMw: 2600,
    stateAbbr: 'VA',
    stateName: 'Virginia',
    lat: 36.9,
    lon: -75.5,
    developer: 'Dominion Energy',
    codYear: 2026,
    startYear: 2023,
    region: 'Southeast',
    note: 'Largest US offshore under construction.',
  },
  {
    id: 'c-empire-wind',
    name: 'Empire Wind 1',
    technology: 'wind',
    status: 'pre-construction',
    capacityMw: 810,
    stateAbbr: 'NY',
    stateName: 'New York',
    lat: 40.4,
    lon: -73.5,
    developer: 'Equinor / bp',
    codYear: 2027,
    startYear: 2025,
    region: 'Northeast',
  },
  {
    id: 'c-traverse-exp',
    name: 'Oklahoma / SPP wind expansions',
    technology: 'wind',
    status: 'under-construction',
    capacityMw: 700,
    stateAbbr: 'OK',
    stateName: 'Oklahoma',
    lat: 36.3,
    lon: -98.5,
    developer: 'NextEra / others',
    codYear: 2026,
    startYear: 2024,
    region: 'South Central',
  },
  {
    id: 'c-texas-wind-build',
    name: 'West Texas wind build (sample)',
    technology: 'wind',
    status: 'under-construction',
    capacityMw: 900,
    stateAbbr: 'TX',
    stateName: 'Texas',
    lat: 32.2,
    lon: -101.0,
    developer: 'Multiple ERCOT',
    codYear: 2026,
    startYear: 2024,
    region: 'Texas',
  },
  {
    id: 'c-iowa-wind',
    name: 'Iowa wind repower / expansion',
    technology: 'wind',
    status: 'under-construction',
    capacityMw: 400,
    stateAbbr: 'IA',
    stateName: 'Iowa',
    lat: 42.5,
    lon: -94.0,
    developer: 'MidAmerican / IPPs',
    codYear: 2026,
    startYear: 2024,
    region: 'Midwest',
  },

  // Natural gas CCGT / peaker builds
  {
    id: 'c-guernsey',
    name: 'Guernsey Power Station',
    technology: 'natural_gas',
    status: 'commissioning',
    capacityMw: 1875,
    stateAbbr: 'OH',
    stateName: 'Ohio',
    lat: 40.05,
    lon: -81.4,
    developer: 'Caithness / Blackstone area',
    codYear: 2023,
    startYear: 2019,
    region: 'Midwest',
  },
  {
    id: 'c-crocket',
    name: 'ERCOT gas peakers / CCGTs (sample)',
    technology: 'natural_gas',
    status: 'under-construction',
    capacityMw: 1500,
    stateAbbr: 'TX',
    stateName: 'Texas',
    lat: 31.8,
    lon: -96.5,
    developer: 'Multiple ERCOT',
    codYear: 2026,
    startYear: 2024,
    region: 'Texas',
    note: 'Reliability builds for summer peak.',
  },
  {
    id: 'c-mysite-gas-va',
    name: 'Virginia gas / hybrid reliability (sample)',
    technology: 'natural_gas',
    status: 'permitted',
    capacityMw: 1000,
    stateAbbr: 'VA',
    stateName: 'Virginia',
    lat: 37.4,
    lon: -77.5,
    developer: 'Dominion / others',
    codYear: 2028,
    startYear: 2026,
    region: 'Southeast',
    note: 'Data center load support path.',
  },
  {
    id: 'c-florida-gas',
    name: 'Florida CCGT modernization',
    technology: 'natural_gas',
    status: 'under-construction',
    capacityMw: 1200,
    stateAbbr: 'FL',
    stateName: 'Florida',
    lat: 28.0,
    lon: -81.8,
    developer: 'FPL / Duke',
    codYear: 2027,
    startYear: 2024,
    region: 'Southeast',
  },

  // Battery storage (generation-adjacent)
  {
    id: 'c-edwards-bess-exp',
    name: 'Edwards / Kern storage expansions',
    technology: 'battery',
    status: 'under-construction',
    capacityMw: 800,
    stateAbbr: 'CA',
    stateName: 'California',
    lat: 34.92,
    lon: -117.95,
    developer: 'Terra-Gen / others',
    codYear: 2026,
    startYear: 2024,
    region: 'Pacific',
  },
  {
    id: 'c-ercot-bess',
    name: 'ERCOT battery build wave',
    technology: 'battery',
    status: 'under-construction',
    capacityMw: 2500,
    stateAbbr: 'TX',
    stateName: 'Texas',
    lat: 31.5,
    lon: -98.5,
    developer: 'Multiple ERCOT',
    codYear: 2026,
    startYear: 2023,
    region: 'Texas',
    note: 'Cluster sample across several counties.',
  },
  {
    id: 'c-arizona-bess',
    name: 'Arizona utility storage',
    technology: 'battery',
    status: 'under-construction',
    capacityMw: 600,
    stateAbbr: 'AZ',
    stateName: 'Arizona',
    lat: 33.3,
    lon: -112.1,
    developer: 'APS / SRP / IPPs',
    codYear: 2026,
    startYear: 2024,
    region: 'Southwest',
  },
  {
    id: 'c-florida-bess',
    name: 'Florida Manatee / storage program',
    technology: 'battery',
    status: 'under-construction',
    capacityMw: 500,
    stateAbbr: 'FL',
    stateName: 'Florida',
    lat: 27.5,
    lon: -82.4,
    developer: 'FPL',
    codYear: 2026,
    startYear: 2023,
    region: 'Southeast',
  },
  {
    id: 'c-pjm-bess',
    name: 'PJM storage interconnection sample',
    technology: 'battery',
    status: 'pre-construction',
    capacityMw: 400,
    stateAbbr: 'PA',
    stateName: 'Pennsylvania',
    lat: 40.3,
    lon: -76.5,
    developer: 'Multiple PJM',
    codYear: 2027,
    startYear: 2025,
    region: 'Mid-Atlantic',
  },

  // Geothermal
  {
    id: 'c-salton-lithium-geo',
    name: 'Salton Sea geothermal expansion',
    technology: 'geothermal',
    status: 'pre-construction',
    capacityMw: 200,
    stateAbbr: 'CA',
    stateName: 'California',
    lat: 33.25,
    lon: -115.55,
    developer: 'Controlled Thermal / others',
    codYear: 2028,
    startYear: 2026,
    region: 'Pacific',
    note: 'Lithium + power path.',
  },
  {
    id: 'c-nevada-geo',
    name: 'Nevada geothermal builds',
    technology: 'geothermal',
    status: 'under-construction',
    capacityMw: 100,
    stateAbbr: 'NV',
    stateName: 'Nevada',
    lat: 39.7,
    lon: -117.5,
    developer: 'Ormat / others',
    codYear: 2026,
    startYear: 2024,
    region: 'Southwest',
  },

  // Hydro / pumped storage
  {
    id: 'c-goldendale',
    name: 'Goldendale pumped storage (proposed)',
    technology: 'hydro',
    status: 'announced',
    capacityMw: 1200,
    stateAbbr: 'WA',
    stateName: 'Washington',
    lat: 45.82,
    lon: -120.82,
    developer: 'FFP / Rye Development area',
    codYear: 2031,
    startYear: 2028,
    region: 'Pacific',
  },
  {
    id: 'c-swan-lake',
    name: 'Swan Lake North pumped storage',
    technology: 'hydro',
    status: 'permitted',
    capacityMw: 393,
    stateAbbr: 'OR',
    stateName: 'Oregon',
    lat: 42.1,
    lon: -121.4,
    developer: 'Rye Development',
    codYear: 2029,
    startYear: 2026,
    region: 'Pacific',
  },

  // Biomass / other generation
  {
    id: 'c-hi-bioenergy',
    name: 'Hawaii renewable replacement projects',
    technology: 'biomass',
    status: 'pre-construction',
    capacityMw: 50,
    stateAbbr: 'HI',
    stateName: 'Hawaii',
    lat: 21.3,
    lon: -157.8,
    developer: 'HECO partners',
    codYear: 2028,
    startYear: 2026,
    region: 'Pacific',
  },
  {
    id: 'c-ak-renewables',
    name: 'Alaska railbelt renewables sample',
    technology: 'wind',
    status: 'announced',
    capacityMw: 80,
    stateAbbr: 'AK',
    stateName: 'Alaska',
    lat: 61.2,
    lon: -149.9,
    developer: 'Railbelt utilities',
    codYear: 2029,
    startYear: 2027,
    region: 'Alaska / Hawaii',
  },
]

export function constructionTotals(projects: EnergyConstructionProject[] = ENERGY_CONSTRUCTION) {
  const capacityMw = projects.reduce((s, p) => s + p.capacityMw, 0)
  const byTech = new Map<Technology, { technology: Technology; count: number; capacityMw: number }>()
  const byStatus = new Map<ConstructionStatus, { status: ConstructionStatus; count: number; capacityMw: number }>()
  const states = new Set<string>()
  for (const p of projects) {
    states.add(p.stateAbbr)
    const t = byTech.get(p.technology) ?? { technology: p.technology, count: 0, capacityMw: 0 }
    t.count += 1
    t.capacityMw += p.capacityMw
    byTech.set(p.technology, t)
    const st = byStatus.get(p.status) ?? { status: p.status, count: 0, capacityMw: 0 }
    st.count += 1
    st.capacityMw += p.capacityMw
    byStatus.set(p.status, st)
  }
  return {
    count: projects.length,
    capacityGw: capacityMw / 1000,
    states: states.size,
    byTech: TECH_ORDER.map((t) => byTech.get(t)).filter(Boolean) as {
      technology: Technology
      count: number
      capacityMw: number
    }[],
    byStatus: [...byStatus.values()].sort((a, b) => b.capacityMw - a.capacityMw),
  }
}

export function constructionColor(tech: Technology): string {
  return TECH_COLORS[tech]
}

export function statusStroke(status: ConstructionStatus): string {
  switch (status) {
    case 'under-construction':
      return '#22c55e'
    case 'commissioning':
      return '#38bdf8'
    case 'pre-construction':
      return '#fbbf24'
    case 'permitted':
      return '#a78bfa'
    case 'announced':
      return '#94a3b8'
  }
}

export { TECH_LABELS, TECH_ORDER }
