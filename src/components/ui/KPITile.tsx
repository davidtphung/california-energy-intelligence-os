import type { ReactNode } from 'react'

export function KPITile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  onClick,
}: {
  label: string
  value: string | number
  unit?: string
  delta?: number
  deltaLabel?: string
  icon?: ReactNode
  accent?: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button type="button" className="metric" onClick={onClick}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </span>
      {(delta != null || deltaLabel) && (
        <span className="metric-hint">
          {delta != null && (
            <span>
              {delta > 0 ? '+' : ''}
              {delta}%
            </span>
          )}
          {deltaLabel && ` ${deltaLabel}`}
        </span>
      )}
    </button>
  )
}
