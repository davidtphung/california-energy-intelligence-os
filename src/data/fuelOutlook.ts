/**
 * Fuels / gas outlook for the map-first Fuels lens.
 * STEO / TIE figures are educational samples from published EIA notes
 * (Today in Energy id=67944, August 2026 STEO). Not a live EIA pull.
 * Chronometer 2030 arithmetic is the Got Gas digest, for comparison only.
 */

import { US_STATES } from './usStates'
import {
  GAS_STATE_PRODUCTION,
  LNG_TERMINALS,
  type GasStateProduction,
  type LngTerminal,
} from './naturalGas'
import { GOT_GAS_DIGEST, THESIS_HUBS, type ThesisHub } from './gasThesisPapers'

export type FuelMapMode = 'production' | 'lng' | 'hubs' | 'compare'

export interface SteoLedger {
  source: string
  url: string
  marketed2025Bcfd: number
  marketed2026Bcfd: number
  h1_2026Bcfd: number
  lng3q26Bcfd: number
  henryHub3q26: number
  storageEndOctBcf: number
  growthBasins: string
  note: string
}

export interface ChronometerCompare {
  productionNowBcfd: number
  productionMaxBcfd: number
  lngNowBcfd: number
  lng2030Bcfd: number
  powerBurnAddBcfd: number
  deficit2030Bcfd: number
  storageDays2010: number
  storageDays2025: number
  storageDays2030: number
}

export interface FuelStateRow extends GasStateProduction {
  lon: number
  lat: number
}

export interface LngSite extends LngTerminal {
  lon: number
  lat: number
}

/** EIA TIE 67944 / August 2026 STEO sample ledger */
export const STEO_LEDGER: SteoLedger = {
  source: 'EIA Today in Energy 67944 · August 2026 STEO',
  url: 'https://www.eia.gov/todayinenergy/detail.php?id=67944',
  marketed2025Bcfd: 118.5,
  marketed2026Bcfd: 122.5,
  h1_2026Bcfd: 121.3,
  lng3q26Bcfd: 16.5,
  henryHub3q26: 2.87,
  storageEndOctBcf: 3985,
  growthBasins: 'Permian associated gas and Haynesville dry gas',
  note: 'Official near-term supply is still making records. That sits next to the Got Gas 2030 shortage path, not instead of it.',
}

export const CHRONOMETER_COMPARE: ChronometerCompare = {
  productionNowBcfd: GOT_GAS_DIGEST.arithmetic.productionNowBcf,
  productionMaxBcfd: GOT_GAS_DIGEST.arithmetic.productionMaxBcf,
  lngNowBcfd: GOT_GAS_DIGEST.arithmetic.lngNowBcf,
  lng2030Bcfd: GOT_GAS_DIGEST.arithmetic.lng2030Bcf,
  powerBurnAddBcfd: GOT_GAS_DIGEST.arithmetic.powerBurnAddBcf,
  deficit2030Bcfd: GOT_GAS_DIGEST.arithmetic.deficit2030Bcf,
  storageDays2010: GOT_GAS_DIGEST.arithmetic.storageDays2010,
  storageDays2025: GOT_GAS_DIGEST.arithmetic.storageDays2025,
  storageDays2030: GOT_GAS_DIGEST.arithmetic.storageDays2030,
}

/** Approximate public-site coordinates for mapped LNG terminals */
const LNG_COORDS: Record<string, { lon: number; lat: number }> = {
  sabine: { lon: -93.87, lat: 29.73 },
  corpus: { lon: -97.27, lat: 27.88 },
  cameron: { lon: -93.33, lat: 29.79 },
  freeport: { lon: -95.31, lat: 28.94 },
  calcasieu: { lon: -93.32, lat: 29.77 },
  elba: { lon: -81.0, lat: 32.09 },
  cove: { lon: -76.39, lat: 38.4 },
  golden: { lon: -93.92, lat: 29.76 },
  plaquemines: { lon: -89.85, lat: 29.55 },
  'rio-grande': { lon: -97.32, lat: 26.03 },
  'port-arthur': { lon: -93.94, lat: 29.83 },
  cp2: { lon: -93.34, lat: 29.74 },
}

export const LNG_SITES: LngSite[] = LNG_TERMINALS.map((t) => {
  const c = LNG_COORDS[t.id]
  const fallback = US_STATES.find((s) => s.abbr === t.stateAbbr)
  return {
    ...t,
    lon: c?.lon ?? fallback?.lon ?? -95,
    lat: c?.lat ?? fallback?.lat ?? 29.5,
  }
})

export function fuelStateRows(): FuelStateRow[] {
  return GAS_STATE_PRODUCTION.filter((s) => s.abbr !== 'other')
    .map((s) => {
      const geo = US_STATES.find((u) => u.abbr === s.abbr)
      return {
        ...s,
        lon: geo?.lon ?? -98,
        lat: geo?.lat ?? 39,
      }
    })
    .sort((a, b) => b.productionBcf - a.productionBcf)
}

export function fuelStateTotalBcf(rows = fuelStateRows()): number {
  return rows.reduce((s, r) => s + r.productionBcf, 0)
}

export function lngByStatus() {
  const operating = LNG_SITES.filter((t) => t.status === 'operating')
  const construction = LNG_SITES.filter((t) => t.status === 'under-construction')
  const proposed = LNG_SITES.filter((t) => t.status === 'proposed')
  const sum = (list: LngSite[]) => list.reduce((s, t) => s + t.capacityBcfd, 0)
  return {
    operating,
    construction,
    proposed,
    operatingBcfd: sum(operating),
    constructionBcfd: sum(construction),
    proposedBcfd: sum(proposed),
  }
}

export function thesisHubs(): ThesisHub[] {
  return THESIS_HUBS
}

export function steoVsChronometerChart() {
  return [
    {
      label: '2025 rec.',
      steo: STEO_LEDGER.marketed2025Bcfd,
      thesis: CHRONOMETER_COMPARE.productionNowBcfd,
    },
    {
      label: '1H26',
      steo: STEO_LEDGER.h1_2026Bcfd,
      thesis: CHRONOMETER_COMPARE.productionNowBcfd,
    },
    {
      label: '2026 STEO',
      steo: STEO_LEDGER.marketed2026Bcfd,
      thesis: CHRONOMETER_COMPARE.productionNowBcfd,
    },
    {
      label: '2030 max',
      steo: null as number | null,
      thesis: CHRONOMETER_COMPARE.productionMaxBcfd,
    },
  ]
}

export function lngPathChart() {
  return [
    { label: 'Now (thesis)', bcfd: CHRONOMETER_COMPARE.lngNowBcfd },
    { label: '3Q26 STEO', bcfd: STEO_LEDGER.lng3q26Bcfd },
    { label: '2030 thesis', bcfd: CHRONOMETER_COMPARE.lng2030Bcfd },
  ]
}

export function lngStatusColor(status: LngTerminal['status'], dark: boolean): string {
  if (status === 'operating') return dark ? '#38bdf8' : '#0369a1'
  if (status === 'under-construction') return dark ? '#fbbf24' : '#b45309'
  return dark ? '#a3e635' : '#65a30d'
}

export function productionColor(dark: boolean): string {
  return dark ? '#86efac' : '#15803d'
}
