/**
 * US grid division: interconnects, ISO/RTO footprints, major utilities,
 * and interties. Approximate footprints for map UX — not legal service-area GIS.
 * Wire to NERC, EIA-861, FERC Form 714, ISO master files in production.
 */

export type InterconnectId = 'eastern' | 'western' | 'texas'
export type GridZoneId =
  | 'caiso'
  | 'ercot'
  | 'pjm'
  | 'miso'
  | 'spp'
  | 'nyiso'
  | 'isone'
  | 'serc'
  | 'wecc-nw'
  | 'wecc-sw'
  | 'wecc-rm'
  | 'se'

export interface GridZone {
  id: GridZoneId
  name: string
  short: string
  kind: 'iso-rto' | 'reliability' | 'subregion'
  interconnect: InterconnectId
  /** Approximate footprint centroid */
  lon: number
  lat: number
  /** Display radius for zone blob (map units via projection) */
  footprintR: number
  color: string
  states: string[]
  peakGw: number
  note: string
}

export interface UtilityCompany {
  id: string
  name: string
  short: string
  kind: 'iou' | 'muni' | 'coop' | 'federal' | 'merchant' | 'iso'
  /** Primary balancing / market affiliation */
  zoneId: GridZoneId
  /** May operate in multiple zones (overlap) */
  alsoZones?: GridZoneId[]
  lon: number
  lat: number
  states: string[]
  customersM?: number
  note: string
}

export interface GridIntertie {
  id: string
  name: string
  fromZone: GridZoneId
  toZone: GridZoneId
  /** Approximate transfer capability MW sample */
  transferMw: number
  kind: 'ac' | 'dc' | 'seam'
  note: string
}

export const INTERCONNECTS: {
  id: InterconnectId
  name: string
  short: string
  color: string
  note: string
}[] = [
  {
    id: 'eastern',
    name: 'Eastern Interconnection',
    short: 'Eastern',
    color: '#3b82f6',
    note: 'Largest; synchronized AC from Rockies to Atlantic (ex-Texas ERCOT island).',
  },
  {
    id: 'western',
    name: 'Western Interconnection',
    short: 'Western',
    color: '#22c55e',
    note: 'WECC; Rockies to Pacific; DC ties east and to Mexico.',
  },
  {
    id: 'texas',
    name: 'Texas Interconnection (ERCOT)',
    short: 'Texas',
    color: '#f59e0b',
    note: 'Mostly asynchronous island; limited DC ties to Eastern / Mexico.',
  },
]

export const GRID_ZONES: GridZone[] = [
  {
    id: 'caiso',
    name: 'California ISO',
    short: 'CAISO',
    kind: 'iso-rto',
    interconnect: 'western',
    lon: -119.8,
    lat: 37.0,
    footprintR: 48,
    color: '#0ea5e9',
    states: ['CA'],
    peakGw: 52,
    note: 'Most of CA; limited out-of-state BA edges. Imports via COI, PDCI, SW ties.',
  },
  {
    id: 'ercot',
    name: 'ERCOT',
    short: 'ERCOT',
    kind: 'iso-rto',
    interconnect: 'texas',
    lon: -99.0,
    lat: 31.2,
    footprintR: 55,
    color: '#f59e0b',
    states: ['TX'],
    peakGw: 85,
    note: 'Most of Texas; islanded AC grid with DC bridges only.',
  },
  {
    id: 'pjm',
    name: 'PJM Interconnection',
    short: 'PJM',
    kind: 'iso-rto',
    interconnect: 'eastern',
    lon: -80.0,
    lat: 39.5,
    footprintR: 58,
    color: '#8b5cf6',
    states: ['PA', 'NJ', 'MD', 'DE', 'DC', 'VA', 'WV', 'OH', 'IL', 'IN', 'KY', 'NC'],
    peakGw: 150,
    note: 'Largest US RTO by load; multi-state footprint with MISO seams in Midwest.',
  },
  {
    id: 'miso',
    name: 'Midcontinent ISO',
    short: 'MISO',
    kind: 'iso-rto',
    interconnect: 'eastern',
    lon: -91.5,
    lat: 40.5,
    footprintR: 72,
    color: '#06b6d4',
    states: ['MN', 'WI', 'IA', 'IL', 'IN', 'MI', 'MO', 'AR', 'LA', 'MS', 'ND', 'SD', 'MT'],
    peakGw: 130,
    note: 'North–south footprint; seams with PJM, SPP; MISO South industrial load.',
  },
  {
    id: 'spp',
    name: 'Southwest Power Pool',
    short: 'SPP',
    kind: 'iso-rto',
    interconnect: 'eastern',
    lon: -98.5,
    lat: 37.5,
    footprintR: 52,
    color: '#14b8a6',
    states: ['KS', 'OK', 'NE', 'SD', 'ND', 'MO', 'AR', 'LA', 'TX', 'NM', 'MT', 'WY'],
    peakGw: 55,
    note: 'Plains RTO; wind-rich; seams with MISO and WECC edges.',
  },
  {
    id: 'nyiso',
    name: 'New York ISO',
    short: 'NYISO',
    kind: 'iso-rto',
    interconnect: 'eastern',
    lon: -75.5,
    lat: 42.8,
    footprintR: 32,
    color: '#6366f1',
    states: ['NY'],
    peakGw: 32,
    note: 'NY state; ties to ISONE, PJM, Ontario, Quebec.',
  },
  {
    id: 'isone',
    name: 'ISO New England',
    short: 'ISO-NE',
    kind: 'iso-rto',
    interconnect: 'eastern',
    lon: -71.5,
    lat: 43.0,
    footprintR: 30,
    color: '#ec4899',
    states: ['MA', 'CT', 'RI', 'NH', 'VT', 'ME'],
    peakGw: 25,
    note: 'Six New England states; strong ties to NYISO and Canada.',
  },
  {
    id: 'serc',
    name: 'Southeast (non-ISO / SERC)',
    short: 'Southeast',
    kind: 'reliability',
    interconnect: 'eastern',
    lon: -84.0,
    lat: 33.5,
    footprintR: 55,
    color: '#64748b',
    states: ['FL', 'GA', 'AL', 'SC', 'NC', 'TN', 'MS'],
    peakGw: 120,
    note: 'Traditional utility BAs (Duke, Southern, TVA, FPL); limited RTO footprint.',
  },
  {
    id: 'wecc-nw',
    name: 'Northwest WECC',
    short: 'NW WECC',
    kind: 'subregion',
    interconnect: 'western',
    lon: -120.5,
    lat: 45.5,
    footprintR: 45,
    color: '#10b981',
    states: ['WA', 'OR', 'ID', 'MT'],
    peakGw: 35,
    note: 'BPA / hydro system; exports south to CA and east.',
  },
  {
    id: 'wecc-sw',
    name: 'Desert Southwest WECC',
    short: 'SW WECC',
    kind: 'subregion',
    interconnect: 'western',
    lon: -112.0,
    lat: 34.5,
    footprintR: 42,
    color: '#eab308',
    states: ['AZ', 'NV', 'NM', 'UT'],
    peakGw: 40,
    note: 'APS, SRP, NV Energy; Palo Verde hub; solar growth.',
  },
  {
    id: 'wecc-rm',
    name: 'Rocky Mountain WECC',
    short: 'RM WECC',
    kind: 'subregion',
    interconnect: 'western',
    lon: -106.5,
    lat: 40.5,
    footprintR: 38,
    color: '#84cc16',
    states: ['CO', 'WY', 'UT', 'MT'],
    peakGw: 20,
    note: 'Wind / coal transition; interties to Plains and Southwest.',
  },
]

export const UTILITIES: UtilityCompany[] = [
  // West
  { id: 'pge-ca', name: 'Pacific Gas and Electric', short: 'PG&E', kind: 'iou', zoneId: 'caiso', lon: -121.5, lat: 38.0, states: ['CA'], customersM: 5.5, note: 'Northern/central CA T&D; Diablo Canyon operator.' },
  { id: 'sce', name: 'Southern California Edison', short: 'SCE', kind: 'iou', zoneId: 'caiso', lon: -117.8, lat: 34.0, states: ['CA'], customersM: 5.0, note: 'SoCal T&D; large RA procurement.' },
  { id: 'sdge', name: 'San Diego Gas & Electric', short: 'SDG&E', kind: 'iou', zoneId: 'caiso', lon: -117.1, lat: 32.8, states: ['CA'], customersM: 1.5, note: 'San Diego County T&D.' },
  { id: 'ladwp', name: 'LADWP', short: 'LADWP', kind: 'muni', zoneId: 'caiso', lon: -118.4, lat: 34.05, states: ['CA'], customersM: 1.5, note: 'Largest US muni; own BA adjacent to CAISO.' },
  { id: 'bpa', name: 'Bonneville Power Administration', short: 'BPA', kind: 'federal', zoneId: 'wecc-nw', lon: -122.0, lat: 45.5, states: ['WA', 'OR', 'ID', 'MT'], note: 'Federal marketing of Columbia hydro; NW backbone.' },
  { id: 'pse', name: 'Puget Sound Energy', short: 'PSE', kind: 'iou', zoneId: 'wecc-nw', lon: -122.2, lat: 47.5, states: ['WA'], customersM: 1.2, note: 'Western WA IOU.' },
  { id: 'pacifiCorp', name: 'PacifiCorp', short: 'PacifiCorp', kind: 'iou', zoneId: 'wecc-rm', alsoZones: ['wecc-nw', 'wecc-sw'], lon: -111.9, lat: 40.8, states: ['OR', 'WA', 'ID', 'UT', 'WY', 'CA'], customersM: 2.0, note: 'Multi-state West IOU; overlaps NW + RM + SW WECC.' },
  { id: 'aps', name: 'Arizona Public Service', short: 'APS', kind: 'iou', zoneId: 'wecc-sw', lon: -112.1, lat: 33.5, states: ['AZ'], customersM: 1.3, note: 'Palo Verde co-owner; AZ IOU.' },
  { id: 'srp', name: 'Salt River Project', short: 'SRP', kind: 'muni', zoneId: 'wecc-sw', lon: -111.9, lat: 33.4, states: ['AZ'], customersM: 1.1, note: 'Phoenix-area public power.' },
  { id: 'nvenergy', name: 'NV Energy', short: 'NV Energy', kind: 'iou', zoneId: 'wecc-sw', lon: -115.1, lat: 36.2, states: ['NV'], customersM: 1.3, note: 'Nevada IOU; desert solar + gas.' },
  { id: 'xcel-co', name: 'Xcel Energy (PSCo)', short: 'Xcel CO', kind: 'iou', zoneId: 'wecc-rm', lon: -104.9, lat: 39.7, states: ['CO'], customersM: 1.5, note: 'Colorado Front Range.' },

  // Texas
  { id: 'oncor', name: 'Oncor', short: 'Oncor', kind: 'iou', zoneId: 'ercot', lon: -96.8, lat: 32.8, states: ['TX'], customersM: 3.8, note: 'Largest ERCOT T&D utility (wires).' },
  { id: 'centerpoint', name: 'CenterPoint Energy', short: 'CenterPoint', kind: 'iou', zoneId: 'ercot', lon: -95.4, lat: 29.8, states: ['TX'], customersM: 2.5, note: 'Houston-area T&D.' },
  { id: 'aep-texas', name: 'AEP Texas', short: 'AEP TX', kind: 'iou', zoneId: 'ercot', lon: -97.5, lat: 28.0, states: ['TX'], note: 'South / West Texas wires.' },
  { id: 'luminant', name: 'Vistra / Luminant', short: 'Vistra', kind: 'merchant', zoneId: 'ercot', lon: -96.5, lat: 32.5, states: ['TX'], note: 'Large ERCOT generator; multi-state merchant elsewhere.' },

  // PJM
  { id: 'exelon', name: 'Exelon / Constellation utilities', short: 'Exelon', kind: 'iou', zoneId: 'pjm', alsoZones: ['nyiso', 'isone'], lon: -76.6, lat: 39.3, states: ['IL', 'PA', 'MD', 'NJ', 'DC'], customersM: 10, note: 'Utility family + nuclear fleet; multi-RTO footprint overlap.' },
  { id: 'aep', name: 'American Electric Power', short: 'AEP', kind: 'iou', zoneId: 'pjm', alsoZones: ['spp', 'ercot'], lon: -83.0, lat: 39.0, states: ['OH', 'WV', 'VA', 'OK', 'TX', 'AR'], customersM: 5.5, note: 'Multi-state; PJM core + SPP/ERCOT edges — classic overlap utility.' },
  { id: 'firstenergy', name: 'FirstEnergy', short: 'FirstEnergy', kind: 'iou', zoneId: 'pjm', lon: -81.5, lat: 41.0, states: ['OH', 'PA', 'WV', 'MD', 'NJ'], customersM: 6, note: 'Ohio / Mid-Atlantic PJM utilities.' },
  { id: 'dominion', name: 'Dominion Energy', short: 'Dominion', kind: 'iou', zoneId: 'pjm', alsoZones: ['serc'], lon: -77.5, lat: 37.5, states: ['VA', 'NC', 'SC'], customersM: 3.5, note: 'VA data-center load; Carolina regulated ops (SERC).' },
  { id: 'pseg', name: 'PSEG', short: 'PSEG', kind: 'iou', zoneId: 'pjm', lon: -74.2, lat: 40.7, states: ['NJ'], customersM: 2.3, note: 'New Jersey IOU / nuclear.' },
  { id: 'duquesne', name: 'Duquesne Light', short: 'Duquesne', kind: 'iou', zoneId: 'pjm', lon: -80.0, lat: 40.4, states: ['PA'], customersM: 0.6, note: 'Pittsburgh-area.' },

  // MISO / SPP
  { id: 'xcel-north', name: 'Xcel Energy (NSP)', short: 'Xcel North', kind: 'iou', zoneId: 'miso', lon: -93.3, lat: 45.0, states: ['MN', 'WI', 'ND', 'SD'], customersM: 2.0, note: 'Upper Midwest MISO.' },
  { id: 'entergy', name: 'Entergy', short: 'Entergy', kind: 'iou', zoneId: 'miso', alsoZones: ['serc'], lon: -91.2, lat: 32.0, states: ['LA', 'AR', 'MS', 'TX'], customersM: 3.0, note: 'MISO South industrial; multi-state.' },
  { id: 'ameren', name: 'Ameren', short: 'Ameren', kind: 'iou', zoneId: 'miso', alsoZones: ['spp'], lon: -90.2, lat: 38.6, states: ['MO', 'IL'], customersM: 2.4, note: 'Missouri / Illinois; MISO with SPP edge.' },
  { id: 'nextera', name: 'NextEra / FPL', short: 'NextEra', kind: 'iou', zoneId: 'serc', alsoZones: ['ercot', 'spp'], lon: -80.2, lat: 26.7, states: ['FL'], customersM: 5.8, note: 'FPL Florida; generation/merchant nationwide (overlap).' },
  { id: 'duke', name: 'Duke Energy', short: 'Duke', kind: 'iou', zoneId: 'serc', alsoZones: ['pjm', 'miso'], lon: -80.8, lat: 35.2, states: ['NC', 'SC', 'FL', 'IN', 'OH'], customersM: 8.2, note: 'Carolinas core; Midwest utilities create multi-zone overlap.' },
  { id: 'southern', name: 'Southern Company', short: 'Southern', kind: 'iou', zoneId: 'serc', lon: -84.4, lat: 33.7, states: ['GA', 'AL', 'MS'], customersM: 4.4, note: 'Georgia Power, Alabama Power, etc.; SERC BAs.' },
  { id: 'tva', name: 'Tennessee Valley Authority', short: 'TVA', kind: 'federal', zoneId: 'serc', lon: -86.5, lat: 35.8, states: ['TN', 'AL', 'MS', 'KY', 'GA', 'NC', 'VA'], note: 'Federal power; multi-state Southeast footprint.' },
  { id: 'oge', name: 'OGE Energy / OG&E', short: 'OG&E', kind: 'iou', zoneId: 'spp', lon: -97.5, lat: 35.5, states: ['OK', 'AR'], customersM: 0.9, note: 'Oklahoma SPP.' },
  { id: 'evergy', name: 'Evergy', short: 'Evergy', kind: 'iou', zoneId: 'spp', lon: -94.6, lat: 39.1, states: ['KS', 'MO'], customersM: 1.6, note: 'Kansas / Missouri SPP.' },

  // Northeast
  { id: 'national-grid', name: 'National Grid (US)', short: 'Nat Grid', kind: 'iou', zoneId: 'isone', alsoZones: ['nyiso'], lon: -71.1, lat: 42.3, states: ['MA', 'NY', 'RI'], customersM: 3.4, note: 'New England + upstate NY — ISO-NE / NYISO overlap company.' },
  { id: 'eversource', name: 'Eversource', short: 'Eversource', kind: 'iou', zoneId: 'isone', lon: -72.7, lat: 41.8, states: ['CT', 'MA', 'NH'], customersM: 4.4, note: 'New England IOU.' },
  { id: 'coned', name: 'Con Edison', short: 'ConEd', kind: 'iou', zoneId: 'nyiso', lon: -73.98, lat: 40.75, states: ['NY'], customersM: 3.5, note: 'NYC / Westchester.' },
  { id: 'nypa', name: 'NY Power Authority', short: 'NYPA', kind: 'federal', zoneId: 'nyiso', lon: -73.8, lat: 42.9, states: ['NY'], note: 'State authority; hydro + transmission.' },

  // ISOs as operators (not retail utilities)
  { id: 'iso-caiso', name: 'CAISO (operator)', short: 'CAISO ops', kind: 'iso', zoneId: 'caiso', lon: -121.2, lat: 38.7, states: ['CA'], note: 'Grid operator — not an LSE.' },
  { id: 'iso-pjm', name: 'PJM (operator)', short: 'PJM ops', kind: 'iso', zoneId: 'pjm', lon: -75.6, lat: 40.2, states: ['PA'], note: 'RTO headquarters region.' },
  { id: 'iso-ercot', name: 'ERCOT (operator)', short: 'ERCOT ops', kind: 'iso', zoneId: 'ercot', lon: -97.7, lat: 30.3, states: ['TX'], note: 'Texas grid operator.' },
]

/** Major interties / seams between zones */
export const GRID_INTERTIES: GridIntertie[] = [
  { id: 'coi', name: 'COI / Malin (NW → CA)', fromZone: 'wecc-nw', toZone: 'caiso', transferMw: 4800, kind: 'ac', note: 'Primary Pacific AC import path into CAISO.' },
  { id: 'pdci', name: 'Pacific DC Intertie', fromZone: 'wecc-nw', toZone: 'caiso', transferMw: 3100, kind: 'dc', note: 'Celilo–Sylmar HVDC.' },
  { id: 'path46', name: 'SW ties (AZ/NV → CA)', fromZone: 'wecc-sw', toZone: 'caiso', transferMw: 3500, kind: 'ac', note: 'Desert Southwest → Southern CA.' },
  { id: 'ipp', name: 'Intermountain / IPP path', fromZone: 'wecc-rm', toZone: 'caiso', transferMw: 2400, kind: 'dc', note: 'Utah–SoCal historical coal path; conversion era.' },
  { id: 'ercot-e', name: 'ERCOT–Eastern DC ties', fromZone: 'ercot', toZone: 'spp', transferMw: 1200, kind: 'dc', note: 'Asynchronous bridges; limited vs island size.' },
  { id: 'ercot-m', name: 'ERCOT–Mexico ties', fromZone: 'ercot', toZone: 'ercot', transferMw: 400, kind: 'dc', note: 'Southern border (mapped as ERCOT self-edge for note).' },
  { id: 'pjm-miso', name: 'PJM–MISO seam', fromZone: 'pjm', toZone: 'miso', transferMw: 8000, kind: 'seam', note: 'Heavy Midwest market seam; congestion frequent.' },
  { id: 'miso-spp', name: 'MISO–SPP seam', fromZone: 'miso', toZone: 'spp', transferMw: 4000, kind: 'seam', note: 'Plains wind transfer interface.' },
  { id: 'pjm-ny', name: 'PJM–NYISO ties', fromZone: 'pjm', toZone: 'nyiso', transferMw: 2500, kind: 'ac', note: 'Mid-Atlantic ↔ New York.' },
  { id: 'ny-ne', name: 'NYISO–ISO-NE ties', fromZone: 'nyiso', toZone: 'isone', transferMw: 2000, kind: 'ac', note: 'New England imports often via NY.' },
  { id: 'pjm-se', name: 'PJM–Southeast interfaces', fromZone: 'pjm', toZone: 'serc', transferMw: 3500, kind: 'ac', note: 'Carolinas / Dominion edges.' },
  { id: 'miso-se', name: 'MISO South–Southeast', fromZone: 'miso', toZone: 'serc', transferMw: 2500, kind: 'ac', note: 'Entergy / Southern interfaces.' },
  { id: 'spp-wecc', name: 'SPP–WECC DC / seams', fromZone: 'spp', toZone: 'wecc-rm', transferMw: 1500, kind: 'dc', note: 'East–West asynchronous / limited ties.' },
  { id: 'nw-rm', name: 'NW–Rockies paths', fromZone: 'wecc-nw', toZone: 'wecc-rm', transferMw: 2000, kind: 'ac', note: 'Intra-WECC west–east.' },
  { id: 'sw-rm', name: 'SW–Rockies paths', fromZone: 'wecc-sw', toZone: 'wecc-rm', transferMw: 2200, kind: 'ac', note: 'Four Corners / desert paths.' },
  { id: 'se-internal', name: 'Southeast utility interfaces', fromZone: 'serc', toZone: 'serc', transferMw: 5000, kind: 'ac', note: 'Duke–Southern–TVA–FPL contract paths (schematic).' },
]

export function zoneById(id: GridZoneId): GridZone | undefined {
  return GRID_ZONES.find((z) => z.id === id)
}

export function utilitiesInZone(zoneId: GridZoneId): UtilityCompany[] {
  return UTILITIES.filter(
    (u) => u.zoneId === zoneId || u.alsoZones?.includes(zoneId)
  )
}

export function overlappingUtilities(): UtilityCompany[] {
  return UTILITIES.filter((u) => (u.alsoZones?.length ?? 0) > 0)
}

export function intertiesForZone(zoneId: GridZoneId): GridIntertie[] {
  return GRID_INTERTIES.filter(
    (t) => t.fromZone === zoneId || t.toZone === zoneId
  )
}

export function gridSummary() {
  return {
    interconnects: INTERCONNECTS.length,
    zones: GRID_ZONES.length,
    utilities: UTILITIES.length,
    interties: GRID_INTERTIES.length,
    overlaps: overlappingUtilities().length,
    transferGw: GRID_INTERTIES.reduce((s, t) => s + t.transferMw, 0) / 1000,
  }
}
