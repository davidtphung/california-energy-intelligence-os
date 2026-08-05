import type { ReactNode } from 'react'

/** Lightweight section wrapper — paper layout, not card chrome */
export function Card({
  children,
  title,
  subtitle,
  label,
  action,
  className,
}: {
  children: ReactNode
  title?: string
  subtitle?: string
  label?: string
  action?: ReactNode
  className?: string
  padding?: boolean
  tray?: boolean
  solid?: boolean
  interactive?: boolean
  onClick?: () => void
}) {
  return (
    <section className={`block ${className ?? ''}`}>
      {(label || title || action) && (
        <div className="block-head">
          <div>
            {label && <p className="kicker">{label}</p>}
            {title && <h2 className="page-h2">{title}</h2>}
            {subtitle && <p className="sub" style={{ marginBottom: 0 }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
