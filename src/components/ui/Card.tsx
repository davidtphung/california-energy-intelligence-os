import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
  padding?: boolean
  onClick?: () => void
  interactive?: boolean
}

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
  padding = true,
  onClick,
  interactive,
}: CardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white card-shadow dark:border-slate-800 dark:bg-slate-900/90',
        interactive &&
          'cursor-pointer transition-all duration-200 hover:border-sky-400/60 hover:shadow-lg hover:shadow-sky-500/5 dark:hover:border-sky-500/40',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(padding && 'p-4 sm:p-5')}>{children}</div>
    </section>
  )
}
