/**
 * Realistic US state lines for any map canvas.
 */

import { OUTLINE_STATES, statePath } from '../../data/usStateOutlines'

export function UsBasemap({
  w,
  h,
  fill = 'var(--fill)',
  fillOpacity = 0.55,
  stroke = 'var(--line)',
  strokeWidth = 0.7,
  dim = false,
}: {
  w: number
  h: number
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  dim?: boolean
}) {
  return (
    <g className="us-basemap" pointerEvents="none" aria-hidden>
      {OUTLINE_STATES.map((abbr) => {
        const d = statePath(abbr, w, h)
        if (!d) return null
        return (
          <path
            key={abbr}
            d={d}
            fill={fill}
            fillOpacity={dim ? fillOpacity * 0.55 : fillOpacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}
