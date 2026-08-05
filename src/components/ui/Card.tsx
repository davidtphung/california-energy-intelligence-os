import type { ReactNode, CSSProperties } from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  label?: string
  action?: ReactNode
  padding?: boolean
  onClick?: () => void
  interactive?: boolean
  tray?: boolean
  solid?: boolean
  style?: CSSProperties
}

export function Card({
  children,
  className,
  title,
  subtitle,
  label,
  action,
  onClick,
  interactive,
  tray,
  solid,
  style,
}: CardProps) {
  const head =
    label || title || action ? (
      <header className="panel-head">
        <div className="min-w-0">
          {label && <p className="section-label">{label}</p>}
          {title && <h2 className="page-h2">{title}</h2>}
          {subtitle && <p className="status-line">{subtitle}</p>}
        </div>
        {action && <div className="btn-row">{action}</div>}
      </header>
    ) : null

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(
          tray ? 'tray panel' : solid ? 'card-solid block' : 'card panel',
          interactive && 'stat-glow',
          'stat-card',
          className
        )}
        style={{ textAlign: 'left', ...style }}
        onClick={onClick}
      >
        {head}
        {children}
      </button>
    )
  }

  return (
    <section
      className={cn(
        tray ? 'tray panel' : solid ? 'card-solid block' : 'card panel',
        interactive && 'stat-glow',
        className
      )}
      style={style}
    >
      {head}
      {children}
    </section>
  )
}
