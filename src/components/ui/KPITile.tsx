import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface KPITileProps {
  label: string
  value: string | number
  unit?: string
  delta?: number
  deltaLabel?: string
  icon?: ReactNode
  accent?: 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate'
  onClick?: () => void
  className?: string
}

export function KPITile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  onClick,
  className,
}: KPITileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('card stat-card stat-glow', className)}
    >
      <span className="section-label">{label}</span>
      <span className="stat-value mono">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </span>
      {(delta != null || deltaLabel) && (
        <span className="stat-delta">
          {delta != null && (
            <span style={{ color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : undefined }}>
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
