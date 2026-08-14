/**
 * Realistic US state lines from US Atlas 10m (Census / Natural Earth lineage).
 * Projected with projectUS (contiguous + AK / HI / PR insets).
 */

import { projectUS } from './usStates'
import { GRID_ZONES, type GridZoneId, type InterconnectId } from './gridUtilities'
import geoms from './usStateGeoms.json'

export type LonLat = [number, number]
/** polygons → rings → [lon, lat] */
export type StateGeom = LonLat[][][]

const GEOMS = geoms as unknown as Record<string, StateGeom>

/** Prefer the home market when a state sits on a seam */
const PRIMARY_ZONE: Partial<Record<string, GridZoneId>> = {
  CA: 'caiso',
  TX: 'ercot',
  NY: 'nyiso',
  WA: 'wecc-nw',
  OR: 'wecc-nw',
  ID: 'wecc-nw',
  AZ: 'wecc-sw',
  NV: 'wecc-sw',
  NM: 'wecc-sw',
  UT: 'wecc-sw',
  CO: 'wecc-rm',
  WY: 'wecc-rm',
  MT: 'wecc-nw',
  PA: 'pjm',
  NJ: 'pjm',
  MD: 'pjm',
  DE: 'pjm',
  DC: 'pjm',
  VA: 'pjm',
  WV: 'pjm',
  OH: 'pjm',
  IL: 'pjm',
  IN: 'miso',
  KY: 'pjm',
  NC: 'serc',
  MN: 'miso',
  WI: 'miso',
  IA: 'miso',
  MI: 'miso',
  AR: 'miso',
  LA: 'miso',
  MS: 'miso',
  MO: 'spp',
  KS: 'spp',
  OK: 'spp',
  NE: 'spp',
  ND: 'miso',
  SD: 'spp',
  FL: 'serc',
  GA: 'serc',
  AL: 'serc',
  SC: 'serc',
  TN: 'serc',
  MA: 'isone',
  CT: 'isone',
  RI: 'isone',
  NH: 'isone',
  VT: 'isone',
  ME: 'isone',
}

export function ringToPath(ring: LonLat[], w: number, h: number): string {
  if (ring.length < 3) return ''
  return (
    ring
      .map((pt, i) => {
        const { x, y } = projectUS(pt[0], pt[1], w, h)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ') + ' Z'
  )
}

export function statePath(abbr: string, w: number, h: number): string {
  const polys = GEOMS[abbr]
  if (!polys?.length) return ''
  const parts: string[] = []
  for (const poly of polys) {
    for (const ring of poly) {
      const d = ringToPath(ring as LonLat[], w, h)
      if (d) parts.push(d)
    }
  }
  return parts.join(' ')
}

export function primaryZoneId(abbr: string): GridZoneId | null {
  if (PRIMARY_ZONE[abbr]) return PRIMARY_ZONE[abbr]!
  const z = GRID_ZONES.find((g) => g.states.includes(abbr))
  return z?.id ?? null
}

export function primaryInterconnect(abbr: string): InterconnectId | 'island' {
  if (['HI', 'AK', 'PR', 'GU', 'VI', 'AS', 'MP'].includes(abbr)) return 'island'
  if (abbr === 'TX') return 'texas'
  const zid = primaryZoneId(abbr)
  const z = GRID_ZONES.find((g) => g.id === zid)
  return z?.interconnect ?? 'eastern'
}

export function statesForZone(zoneId: GridZoneId): string[] {
  return Object.keys(GEOMS).filter((a) => primaryZoneId(a) === zoneId)
}

export function statesForInterconnect(id: InterconnectId | 'island'): string[] {
  return Object.keys(GEOMS).filter((a) => primaryInterconnect(a) === id)
}

export const OUTLINE_STATES = Object.keys(GEOMS)
export const STATE_GEOMS = GEOMS
