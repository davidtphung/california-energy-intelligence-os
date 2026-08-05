import { cn } from '../../lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      )}
      <input
        id={inputId}
        className={cn(
          'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800',
          'transition-colors placeholder:text-slate-400',
          'focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      />
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}
