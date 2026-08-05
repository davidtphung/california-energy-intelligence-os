import { cn } from '../../lib/utils'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string | number; label: string }[]
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      )}
      <select
        id={selectId}
        className={cn(
          'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800',
          'transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
