import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

const variants = {
  default: '',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  violet: 'badge-info',
}

interface BadgeProps {
  children: ReactNode
  variant?: keyof typeof variants
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return <span className={cn('badge', variants[variant], className)}>{children}</span>
}
