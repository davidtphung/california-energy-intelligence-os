/**
 * Paints where interconnects and ISO/RTO zones actually cover, as state outlines.
 */

import { GRID_ZONES, INTERCONNECTS, type GridZoneId, type InterconnectId } from '../../data/gridUtilities'
import {
  OUTLINE_STATES,
  primaryInterconnect,
  primaryZoneId,
  statePath,
} from '../../data/usStateOutlines'

export function RegionCoverageLayer({
  w,
  h,
  mode,
  interconnect,
  selectedZone,
  hoverZone,
  selectedState,
  hoverState,
  onHover,
  onPick,
}: {
  w: number
  h: number
  mode: 'interconnects' | 'zones' | 'other'
  interconnect: InterconnectId | 'all'
  selectedZone: GridZoneId | null
  hoverZone: GridZoneId | null
  selectedState?: string | null
  hoverState?: string | null
  onHover: (zone: GridZoneId | null, stateAbbr: string | null) => void
  onPick: (zone: GridZoneId | null, stateAbbr: string) => void
}) {
  const focusZone = hoverZone ?? selectedZone

  return (
    <g className="region-outlines" aria-hidden={false}>
      {OUTLINE_STATES.map((abbr) => {
        const d = statePath(abbr, w, h)
        if (!d) return null
        const zid = primaryZoneId(abbr)
        const z = zid ? GRID_ZONES.find((g) => g.id === zid) : undefined
        const icId = primaryInterconnect(abbr)
        const ic = INTERCONNECTS.find((x) => x.id === icId)
        const dimIc = interconnect !== 'all' && icId !== interconnect && icId !== 'island'
        const inFocusZone = focusZone != null && zid === focusZone
        const stateOn = abbr === selectedState || abbr === hoverState

        let fill = ic?.color ?? '#94a3b8'
        let fillOp = 0.1
        let stroke = ic?.color ?? '#64748b'
        let sw = 0.9

        if (mode === 'zones' && z) {
          fill = z.color
          fillOp = inFocusZone ? 0.34 : 0.16
          stroke = z.color
          sw = inFocusZone ? 2.1 : 1.05
        } else if (mode === 'interconnects') {
          fillOp = dimIc ? 0.03 : 0.2
          sw = dimIc ? 0.5 : 1.6
        } else {
          fillOp = dimIc ? 0.04 : 0.1
          sw = 0.85
        }

        if (stateOn) {
          fillOp = Math.min(0.45, fillOp + 0.14)
          sw += 0.8
        }

        return (
          <path
            key={abbr}
            d={d}
            fill={fill}
            fillOpacity={fillOp}
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHover(zid, abbr)}
            onMouseLeave={() => onHover(null, null)}
            onClick={(e) => {
              e.stopPropagation()
              onPick(zid, abbr)
            }}
          >
            <title>
              {abbr}
              {z ? ` · ${z.short}` : ''}
              {ic ? ` · ${ic.short}` : icId === 'island' ? ' · islanded' : ''}
            </title>
          </path>
        )
      })}

    </g>
  )
}
