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
    <div className={cn('field', className)}>
      <div className="field-head">
        <label>{label}</label>
        <output className="mono">
          {value}
          {unit ? ` ${unit}` : ''}
        </output>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  )
}
