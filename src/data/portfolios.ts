/**
 * California energy portfolios and location-level outputs.
 * Capacity / generation figures are realistic CA-scale samples for mapping UX;
 * wire to CEC QFER, EIA-860, CAISO master file, and LSE IRPs in production.
 */

import type { CARegion, PortfolioKind, PortfolioSector, Technology } from '../types'

export interface PortfolioAsset {
  id: string
  name: string
  technology: Technology
  capacityMw: number
  /** Sample recent output MW (or average on-peak) */
  outputMw: number
  latitude: number
  longitude: number
  region: CARegion
  county: string
  status: 'operating' | 'construction' | 'retired-planned'
}

export interface EnergyPortfolio {
  id: string
  name: string
  short: string
  kind: PortfolioKind
  sector: PortfolioSector
  hq: string
  customers?: string
  loadSharePct?: number
  cleanTarget?: string
  notes: string
  website?: string
  assets: PortfolioAsset[]
}

/** Simple equirectangular project CA bbox → SVG */
export const CA_BBOX = {
  minLon: -124.5,
  maxLon: -114.1,
  minLat: 32.45,
  maxLat: 42.05,
}

export function projectCA(
  lon: number,
  lat: number,
  w = 360,
  h = 420,
  pad = 16
): { x: number; y: number } {
  const { minLon, maxLon, minLat, maxLat } = CA_BBOX
  const x = pad + ((lon - minLon) / (maxLon - minLon)) * (w - pad * 2)
  const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (h - pad * 2)
  return { x, y }
}

export const TECH_MAP_COLOR: Record<Technology, string> = {
  solar: '#b45309',
  wind: '#0369a1',
  hydro: '#0e7490',
  natural_gas: '#78716c',
  nuclear: '#7c3aed',
  geothermal: '#c2410c',
  biomass: '#65a30d',
  battery: '#15803d',
  other: '#a8a29e',
}

export const PORTFOLIOS: EnergyPortfolio[] = [
  {
    id: 'pge',
    name: 'Pacific Gas and Electric',
    short: 'PG&E',
    kind: 'IOU',
    sector: 'retail load',
    hq: 'Oakland',
    customers: '~5.5M electric',
    loadSharePct: 32,
    cleanTarget: 'SB 100 path · IRP',
    notes: 'Northern and central California T&D and retail; Diablo Canyon operator.',
    website: 'https://www.pge.com',
    assets: [
      { id: 'pge-diablo', name: 'Diablo Canyon', technology: 'nuclear', capacityMw: 2256, outputMw: 2100, latitude: 35.211, longitude: -120.856, region: 'Central Coast', county: 'San Luis Obispo', status: 'operating' },
      { id: 'pge-helms', name: 'Helms Pumped Storage', technology: 'hydro', capacityMw: 1212, outputMw: 400, latitude: 37.039, longitude: -119.101, region: 'Central Valley', county: 'Fresno', status: 'operating' },
      { id: 'pge-shasta', name: 'Shasta (USBR / PG&E share ops)', technology: 'hydro', capacityMw: 710, outputMw: 380, latitude: 40.718, longitude: -122.419, region: 'Northern CA', county: 'Shasta', status: 'operating' },
      { id: 'pge-gateway', name: 'Gateway Generating Station', technology: 'natural_gas', capacityMw: 530, outputMw: 220, latitude: 38.017, longitude: -121.763, region: 'Bay Area', county: 'Contra Costa', status: 'operating' },
      { id: 'pge-colusa', name: 'Colusa Generating Station', technology: 'natural_gas', capacityMw: 660, outputMw: 280, latitude: 39.245, longitude: -122.099, region: 'Northern CA', county: 'Colusa', status: 'operating' },
    ],
  },
  {
    id: 'sce',
    name: 'Southern California Edison',
    short: 'SCE',
    kind: 'IOU',
    sector: 'retail load',
    hq: 'Rosemead',
    customers: '~5M electric',
    loadSharePct: 28,
    cleanTarget: 'Pathway 2045',
    notes: 'SoCal T&D; large RA procurement and desert renewables interconnection.',
    website: 'https://www.sce.com',
    assets: [
      { id: 'sce-mountainview', name: 'Mountainview CCGT', technology: 'natural_gas', capacityMw: 1054, outputMw: 450, latitude: 34.002, longitude: -117.247, region: 'Southern CA', county: 'San Bernardino', status: 'operating' },
      { id: 'sce-bigcreek', name: 'Big Creek Hydro Complex', technology: 'hydro', capacityMw: 1000, outputMw: 520, latitude: 37.206, longitude: -119.24, region: 'Central Valley', county: 'Fresno', status: 'operating' },
      { id: 'sce-redondo', name: 'Redondo Beach (retiring stack)', technology: 'natural_gas', capacityMw: 1310, outputMw: 80, latitude: 33.85, longitude: -118.395, region: 'Southern CA', county: 'Los Angeles', status: 'retired-planned' },
    ],
  },
  {
    id: 'sdge',
    name: 'San Diego Gas & Electric',
    short: 'SDG&E',
    kind: 'IOU',
    sector: 'retail load',
    hq: 'San Diego',
    customers: '~1.5M electric',
    loadSharePct: 8,
    cleanTarget: 'IRP · CCA concurrent',
    notes: 'San Diego County and southern Orange County T&D.',
    website: 'https://www.sdge.com',
    assets: [
      { id: 'sdge-palomar', name: 'Palomar Energy Center', technology: 'natural_gas', capacityMw: 565, outputMw: 240, latitude: 33.137, longitude: -117.14, region: 'Southern CA', county: 'San Diego', status: 'operating' },
      { id: 'sdge-otay', name: 'Otay Mesa Energy Center', technology: 'natural_gas', capacityMw: 603, outputMw: 200, latitude: 32.573, longitude: -116.933, region: 'Southern CA', county: 'San Diego', status: 'operating' },
    ],
  },
  {
    id: 'ladwp',
    name: 'Los Angeles Department of Water and Power',
    short: 'LADWP',
    kind: 'Municipal',
    sector: 'retail load',
    hq: 'Los Angeles',
    customers: '~1.5M electric',
    loadSharePct: 9,
    cleanTarget: 'LA100 · 100% clean',
    notes: 'Largest muni in US; Intermountain coal exit; Scattergood redevelopment.',
    website: 'https://www.ladwp.com',
    assets: [
      { id: 'ladwp-scattergood', name: 'Scattergood Generating Station', technology: 'natural_gas', capacityMw: 830, outputMw: 300, latitude: 33.918, longitude: -118.427, region: 'Southern CA', county: 'Los Angeles', status: 'operating' },
      { id: 'ladwp-haynes', name: 'Haynes Generating Station', technology: 'natural_gas', capacityMw: 1570, outputMw: 500, latitude: 33.766, longitude: -118.097, region: 'Southern CA', county: 'Los Angeles', status: 'operating' },
      { id: 'ladwp-castaic', name: 'Castaic Pumped Storage', technology: 'hydro', capacityMw: 1247, outputMw: 350, latitude: 34.587, longitude: -118.657, region: 'Southern CA', county: 'Los Angeles', status: 'operating' },
      { id: 'ladwp-pine-tree', name: 'Pine Tree Wind', technology: 'wind', capacityMw: 135, outputMw: 45, latitude: 35.05, longitude: -118.23, region: 'Southern CA', county: 'Kern', status: 'operating' },
    ],
  },
  {
    id: 'smud',
    name: 'Sacramento Municipal Utility District',
    short: 'SMUD',
    kind: 'Municipal',
    sector: 'retail load',
    hq: 'Sacramento',
    customers: '~0.65M electric',
    loadSharePct: 3,
    cleanTarget: 'Zero carbon 2030',
    notes: 'Aggressive clean portfolio; Cosumnes gas + large solar/storage.',
    website: 'https://www.smud.org',
    assets: [
      { id: 'smud-cosumnes', name: 'Cosumnes Power Plant', technology: 'natural_gas', capacityMw: 500, outputMw: 180, latitude: 38.338, longitude: -121.125, region: 'Central Valley', county: 'Sacramento', status: 'operating' },
      { id: 'smud-rancho', name: 'Rancho Seco Solar II', technology: 'solar', capacityMw: 160, outputMw: 90, latitude: 38.345, longitude: -121.121, region: 'Central Valley', county: 'Sacramento', status: 'operating' },
    ],
  },
  {
    id: 'cpa',
    name: 'Clean Power Alliance',
    short: 'CPA',
    kind: 'CCA',
    sector: 'retail load',
    hq: 'Los Angeles County',
    customers: '~3M accounts',
    loadSharePct: 7,
    cleanTarget: '100% Green options',
    notes: 'Largest CCA by accounts; SCE territory procurement.',
    website: 'https://cleanpoweralliance.org',
    assets: [
      { id: 'cpa-res1', name: 'Antelope Valley Solar (contract)', technology: 'solar', capacityMw: 230, outputMw: 140, latitude: 34.72, longitude: -118.22, region: 'Desert / Inland Empire', county: 'Los Angeles', status: 'operating' },
      { id: 'cpa-bess1', name: 'SCE-area BESS (contract)', technology: 'battery', capacityMw: 100, outputMw: -40, latitude: 34.05, longitude: -117.55, region: 'Desert / Inland Empire', county: 'San Bernardino', status: 'operating' },
    ],
  },
  {
    id: 'mce',
    name: 'MCE Clean Energy',
    short: 'MCE',
    kind: 'CCA',
    sector: 'retail load',
    hq: 'San Rafael',
    customers: '~1.5M people',
    loadSharePct: 2.5,
    cleanTarget: '95%+ renewable options',
    notes: 'Marin, Napa, Contra Costa, Solano CCA.',
    website: 'https://www.mcecleanenergy.org',
    assets: [
      { id: 'mce-cooley', name: 'Cooley Landing Storage', technology: 'battery', capacityMw: 50, outputMw: -15, latitude: 37.48, longitude: -122.13, region: 'Bay Area', county: 'San Mateo', status: 'operating' },
      { id: 'mce-solar', name: 'Cottonwood Solar', technology: 'solar', capacityMw: 24, outputMw: 16, latitude: 38.25, longitude: -121.95, region: 'Bay Area', county: 'Solano', status: 'operating' },
    ],
  },
  {
    id: 'ebce',
    name: 'Ava Community Energy (EBCE)',
    short: 'Ava / EBCE',
    kind: 'CCA',
    sector: 'retail load',
    hq: 'Oakland',
    customers: '~2M people',
    loadSharePct: 3,
    cleanTarget: '100% clean by 2030 path',
    notes: 'Alameda / San Joaquin CCA; rebranded Ava.',
    website: 'https://avaenergy.org',
    assets: [
      { id: 'ebce-westhampton', name: 'RE Rosamond One (contract)', technology: 'solar', capacityMw: 160, outputMw: 100, latitude: 34.87, longitude: -118.2, region: 'Desert / Inland Empire', county: 'Kern', status: 'operating' },
    ],
  },
  {
    id: 'svce',
    name: 'Silicon Valley Clean Energy',
    short: 'SVCE',
    kind: 'CCA',
    sector: 'retail load',
    hq: 'Sunnyvale',
    loadSharePct: 1.2,
    cleanTarget: 'Carbon-free electricity',
    notes: 'South Bay CCA; deep decarbonization programs.',
    website: 'https://svcleanenergy.org',
    assets: [
      { id: 'svce-slr', name: 'Big Beau Solar+Storage (contract)', technology: 'solar', capacityMw: 128, outputMw: 70, latitude: 34.95, longitude: -118.3, region: 'Desert / Inland Empire', county: 'Kern', status: 'operating' },
      { id: 'svce-bess', name: 'Big Beau BESS', technology: 'battery', capacityMw: 40, outputMw: -20, latitude: 34.952, longitude: -118.302, region: 'Desert / Inland Empire', county: 'Kern', status: 'operating' },
    ],
  },
  {
    id: 'pce',
    name: 'Peninsula Clean Energy',
    short: 'PCE',
    kind: 'CCA',
    sector: 'retail load',
    hq: 'Redwood City',
    loadSharePct: 1,
    cleanTarget: '100% renewable',
    notes: 'San Mateo County CCA.',
    website: 'https://www.peninsulacleanenergy.com',
    assets: [
      { id: 'pce-wright', name: 'Wright Solar Park (contract)', technology: 'solar', capacityMw: 200, outputMw: 120, latitude: 37.05, longitude: -120.85, region: 'Central Valley', county: 'Merced', status: 'operating' },
    ],
  },
  {
    id: 'sdcp',
    name: 'San Diego Community Power',
    short: 'SDCP',
    kind: 'CCA',
    sector: 'retail load',
    hq: 'San Diego',
    loadSharePct: 2,
    cleanTarget: '100% renewable 2035',
    notes: 'San Diego metro CCA concurrent with SDG&E T&D.',
    website: 'https://sdcommunitypower.org',
    assets: [
      { id: 'sdcp-campo', name: 'Campo Heights Wind (contract)', technology: 'wind', capacityMw: 252, outputMw: 80, latitude: 32.65, longitude: -116.35, region: 'Southern CA', county: 'San Diego', status: 'operating' },
    ],
  },
  {
    id: 'calpine',
    name: 'Calpine Corporation',
    short: 'Calpine',
    kind: 'Generator',
    sector: 'wholesale gen',
    hq: 'Houston / CA fleet',
    notes: 'Largest geothermal (Geysers) and major gas fleet in CA.',
    website: 'https://www.calpine.com',
    assets: [
      { id: 'cal-geysers', name: 'The Geysers', technology: 'geothermal', capacityMw: 725, outputMw: 550, latitude: 38.79, longitude: -122.76, region: 'Northern CA', county: 'Sonoma / Lake', status: 'operating' },
      { id: 'cal-delta', name: 'Delta Energy Center', technology: 'natural_gas', capacityMw: 880, outputMw: 400, latitude: 38.02, longitude: -121.89, region: 'Bay Area', county: 'Contra Costa', status: 'operating' },
      { id: 'cal-metcalf', name: 'Metcalf Energy Center', technology: 'natural_gas', capacityMw: 600, outputMw: 250, latitude: 37.22, longitude: -121.75, region: 'Bay Area', county: 'Santa Clara', status: 'operating' },
    ],
  },
  {
    id: 'vistra',
    name: 'Vistra Corp',
    short: 'Vistra',
    kind: 'Generator',
    sector: 'storage',
    hq: 'Irving / CA fleet',
    notes: 'Moss Landing BESS and thermal assets.',
    website: 'https://www.vistracorp.com',
    assets: [
      { id: 'vis-moss', name: 'Moss Landing Energy Storage', technology: 'battery', capacityMw: 750, outputMw: -200, latitude: 36.805, longitude: -121.782, region: 'Central Coast', county: 'Monterey', status: 'operating' },
      { id: 'vis-moss-gas', name: 'Moss Landing Power Plant', technology: 'natural_gas', capacityMw: 2530, outputMw: 600, latitude: 36.804, longitude: -121.78, region: 'Central Coast', county: 'Monterey', status: 'operating' },
    ],
  },
  {
    id: 'aes',
    name: 'AES Corporation',
    short: 'AES',
    kind: 'Generator',
    sector: 'wholesale gen',
    hq: 'Arlington / CA fleet',
    notes: 'Alamitos, Huntington Beach modernization + storage.',
    website: 'https://www.aes.com',
    assets: [
      { id: 'aes-alamitos', name: 'Alamitos Energy Center', technology: 'natural_gas', capacityMw: 1950, outputMw: 700, latitude: 33.769, longitude: -118.101, region: 'Southern CA', county: 'Los Angeles', status: 'operating' },
      { id: 'aes-alamitos-bess', name: 'Alamitos BESS', technology: 'battery', capacityMw: 100, outputMw: -30, latitude: 33.77, longitude: -118.1, region: 'Southern CA', county: 'Los Angeles', status: 'operating' },
    ],
  },
  {
    id: 'nextera',
    name: 'NextEra Energy Resources',
    short: 'NextEra',
    kind: 'Generator',
    sector: 'renewables',
    hq: 'Juno Beach / CA fleet',
    notes: 'Large CA wind and solar portfolio.',
    website: 'https://www.nexteraenergyresources.com',
    assets: [
      { id: 'ne-alta', name: 'Alta Wind Energy Center (parts)', technology: 'wind', capacityMw: 1548, outputMw: 480, latitude: 35.02, longitude: -118.32, region: 'Southern CA', county: 'Kern', status: 'operating' },
      { id: 'ne-desert', name: 'Desert Sunlight (contract share)', technology: 'solar', capacityMw: 550, outputMw: 320, latitude: 33.82, longitude: -115.4, region: 'Desert / Inland Empire', county: 'Riverside', status: 'operating' },
    ],
  },
  {
    id: 'terragen',
    name: 'Terra-Gen',
    short: 'Terra-Gen',
    kind: 'Generator',
    sector: 'renewables',
    hq: 'San Diego',
    notes: 'Edwards & Sanborn, Alta area wind, desert hybrids.',
    website: 'https://www.terra-gen.com',
    assets: [
      { id: 'tg-edwards', name: 'Edwards & Sanborn Solar+Storage', technology: 'solar', capacityMw: 875, outputMw: 500, latitude: 34.9, longitude: -117.9, region: 'Desert / Inland Empire', county: 'Kern', status: 'operating' },
      { id: 'tg-edwards-bess', name: 'Edwards & Sanborn BESS', technology: 'battery', capacityMw: 3285, outputMw: -800, latitude: 34.905, longitude: -117.905, region: 'Desert / Inland Empire', county: 'Kern', status: 'operating' },
    ],
  },
  {
    id: 'nrg',
    name: 'NRG Energy',
    short: 'NRG',
    kind: 'Generator',
    sector: 'wholesale gen',
    hq: 'Houston / CA fleet',
    notes: 'Ivanpah solar thermal; Midway-Sunset and coastal gas.',
    website: 'https://www.nrg.com',
    assets: [
      { id: 'nrg-ivanpah', name: 'Ivanpah Solar Electric', technology: 'solar', capacityMw: 392, outputMw: 180, latitude: 35.57, longitude: -115.47, region: 'Desert / Inland Empire', county: 'San Bernardino', status: 'operating' },
      { id: 'nrg-encina', name: 'Carlsbad Energy Center', technology: 'natural_gas', capacityMw: 528, outputMw: 200, latitude: 33.14, longitude: -117.34, region: 'Southern CA', county: 'San Diego', status: 'operating' },
    ],
  },
  {
    id: 'usbr',
    name: 'US Bureau of Reclamation (CA hydro)',
    short: 'USBR',
    kind: 'Federal / state',
    sector: 'hydro system',
    hq: 'Sacramento / Folsom',
    notes: 'CVP hydro: Shasta, Folsom, New Melones, etc.',
    website: 'https://www.usbr.gov',
    assets: [
      { id: 'usbr-folsom', name: 'Folsom Dam Powerplant', technology: 'hydro', capacityMw: 199, outputMw: 90, latitude: 38.708, longitude: -121.157, region: 'Central Valley', county: 'Sacramento', status: 'operating' },
      { id: 'usbr-melones', name: 'New Melones', technology: 'hydro', capacityMw: 300, outputMw: 120, latitude: 37.948, longitude: -120.525, region: 'Central Valley', county: 'Calaveras / Tuolumne', status: 'operating' },
      { id: 'usbr-trinity', name: 'Trinity Dam', technology: 'hydro', capacityMw: 140, outputMw: 60, latitude: 40.801, longitude: -122.762, region: 'Northern CA', county: 'Trinity', status: 'operating' },
    ],
  },
  {
    id: 'dwr',
    name: 'CA Department of Water Resources',
    short: 'DWR / SWP',
    kind: 'Federal / state',
    sector: 'hydro system',
    hq: 'Sacramento',
    notes: 'State Water Project pumps (load) and Hyatt-Thermalito generation.',
    website: 'https://water.ca.gov',
    assets: [
      { id: 'dwr-hyatt', name: 'Hyatt Powerplant (Oroville)', technology: 'hydro', capacityMw: 645, outputMw: 280, latitude: 39.54, longitude: -121.485, region: 'Northern CA', county: 'Butte', status: 'operating' },
      { id: 'dwr-edmonston', name: 'Edmonston Pumping (load node)', technology: 'other', capacityMw: 0, outputMw: -800, latitude: 34.85, longitude: -118.82, region: 'Southern CA', county: 'Kern / LA', status: 'operating' },
    ],
  },
  {
    id: 'caiso-ba',
    name: 'CAISO balancing authority footprint',
    short: 'CAISO',
    kind: 'Balancing area',
    sector: 'wholesale gen',
    hq: 'Folsom',
    notes: 'Grid operator; not an LSE. Maps major intertie and system-critical nodes.',
    website: 'https://www.caiso.com',
    assets: [
      { id: 'caiso-malin', name: 'Malin / COI intertie', technology: 'other', capacityMw: 4800, outputMw: 3200, latitude: 42.0, longitude: -121.55, region: 'Northern CA', county: 'Siskiyou / OR border', status: 'operating' },
      { id: 'caiso-path15', name: 'Path 15 corridor', technology: 'other', capacityMw: 5400, outputMw: 3100, latitude: 36.7, longitude: -120.4, region: 'Central Valley', county: 'Fresno / Merced', status: 'operating' },
      { id: 'caiso-path26', name: 'Path 26 corridor', technology: 'other', capacityMw: 4000, outputMw: 2800, latitude: 35.0, longitude: -119.0, region: 'Central Valley', county: 'Kern', status: 'operating' },
      { id: 'caiso-sylmar', name: 'Sylmar Converter / PDCI', technology: 'other', capacityMw: 3100, outputMw: 1800, latitude: 34.31, longitude: -118.48, region: 'Southern CA', county: 'Los Angeles', status: 'operating' },
    ],
  },
  {
    id: 'mid',
    name: 'Modesto Irrigation District',
    short: 'MID',
    kind: 'Irrigation / water',
    sector: 'retail load',
    hq: 'Modesto',
    loadSharePct: 0.5,
    cleanTarget: 'RPS compliant',
    notes: 'Irrigation district electric utility, Central Valley.',
    website: 'https://www.mid.org',
    assets: [
      { id: 'mid-woodland', name: 'Woodland Generation', technology: 'natural_gas', capacityMw: 50, outputMw: 20, latitude: 37.66, longitude: -120.99, region: 'Central Valley', county: 'Stanislaus', status: 'operating' },
    ],
  },
  {
    id: 'iid',
    name: 'Imperial Irrigation District',
    short: 'IID',
    kind: 'Irrigation / water',
    sector: 'retail load',
    hq: 'Imperial',
    loadSharePct: 0.6,
    notes: 'Imperial Valley; geothermal and solar rich BA adjacent to CAISO.',
    website: 'https://www.iid.com',
    assets: [
      { id: 'iid-geo', name: 'Salton Sea geothermal cluster', technology: 'geothermal', capacityMw: 400, outputMw: 320, latitude: 33.2, longitude: -115.6, region: 'Desert / Inland Empire', county: 'Imperial', status: 'operating' },
      { id: 'iid-solar', name: 'Imperial Valley Solar', technology: 'solar', capacityMw: 200, outputMw: 130, latitude: 32.9, longitude: -115.5, region: 'Desert / Inland Empire', county: 'Imperial', status: 'operating' },
    ],
  },
]

export function allAssets(portfolios: EnergyPortfolio[] = PORTFOLIOS): (PortfolioAsset & { portfolioId: string; portfolioShort: string; kind: PortfolioKind })[] {
  return portfolios.flatMap((p) =>
    p.assets.map((a) => ({ ...a, portfolioId: p.id, portfolioShort: p.short, kind: p.kind }))
  )
}

export function portfolioTotals(p: EnergyPortfolio) {
  const capacityMw = p.assets.reduce((s, a) => s + a.capacityMw, 0)
  const outputMw = p.assets.reduce((s, a) => s + Math.max(0, a.outputMw), 0)
  const chargeMw = p.assets.reduce((s, a) => s + (a.outputMw < 0 ? -a.outputMw : 0), 0)
  const byTech: Partial<Record<Technology, number>> = {}
  for (const a of p.assets) {
    byTech[a.technology] = (byTech[a.technology] ?? 0) + a.capacityMw
  }
  return { capacityMw, outputMw, chargeMw, byTech }
}

export function regionRollup(assets: ReturnType<typeof allAssets>) {
  const map = new Map<
    string,
    { region: string; capacityMw: number; outputMw: number; count: number; cleanMw: number }
  >()
  const clean: Technology[] = ['solar', 'wind', 'hydro', 'nuclear', 'geothermal', 'biomass']
  for (const a of assets) {
    const r = map.get(a.region) ?? {
      region: a.region,
      capacityMw: 0,
      outputMw: 0,
      count: 0,
      cleanMw: 0,
    }
    r.capacityMw += a.capacityMw
    r.outputMw += Math.max(0, a.outputMw)
    r.count += 1
    if (clean.includes(a.technology)) r.cleanMw += a.capacityMw
    map.set(a.region, r)
  }
  return [...map.values()].sort((a, b) => b.capacityMw - a.capacityMw)
}

export const PORTFOLIO_KINDS: PortfolioKind[] = [
  'IOU',
  'CCA',
  'Municipal',
  'Irrigation / water',
  'Generator',
  'Federal / state',
  'Balancing area',
]
