import { cn } from '../../lib/utils'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  className?: string
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit,
  onChange,
  className,
}: SliderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 dark:bg-slate-700"
        aria-label={label}
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}
