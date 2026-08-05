import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="field">
      {label && <span>{label}</span>}
      <input id={inputId} className={className} {...props} />
      {hint && <span className="mono muted">{hint}</span>}
    </label>
  )
}
