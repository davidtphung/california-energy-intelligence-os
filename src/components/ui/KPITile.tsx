import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

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

const accents = {
  sky: 'from-sky-500/15 to-transparent text-sky-600 dark:text-sky-400',
  emerald: 'from-emerald-500/15 to-transparent text-emerald-600 dark:text-emerald-400',
  amber: 'from-amber-500/15 to-transparent text-amber-600 dark:text-amber-400',
  violet: 'from-violet-500/15 to-transparent text-violet-600 dark:text-violet-400',
  rose: 'from-rose-500/15 to-transparent text-rose-600 dark:text-rose-400',
  slate: 'from-slate-500/15 to-transparent text-slate-600 dark:text-slate-300',
}

export function KPITile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon,
  accent = 'sky',
  onClick,
  className,
}: KPITileProps) {
  const TrendIcon =
    delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 text-left card-shadow transition-all duration-200',
        'hover:border-sky-400/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
        'dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-sky-500/40',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
          accents[accent]
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>
            )}
          </p>
          {(delta != null || deltaLabel) && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {TrendIcon && delta != null && (
                <TrendIcon
                  className={cn(
                    'h-3.5 w-3.5',
                    delta > 0 && 'text-emerald-500',
                    delta < 0 && 'text-rose-500'
                  )}
                  aria-hidden
                />
              )}
              {delta != null && (
                <span
                  className={cn(
                    delta > 0 && 'text-emerald-600 dark:text-emerald-400',
                    delta < 0 && 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {delta > 0 ? '+' : ''}
                  {delta}%
                </span>
              )}
              {deltaLabel && <span>{deltaLabel}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-slate-100 p-2 text-slate-600 transition-colors group-hover:bg-sky-100 group-hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-sky-950 dark:group-hover:text-sky-400">
            {icon}
          </div>
        )}
      </div>
    </button>
  )
}
