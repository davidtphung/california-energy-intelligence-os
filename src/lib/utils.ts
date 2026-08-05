import clsx, { type ClassValue } from 'clsx'
import type { Technology } from '../types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const TECH_COLORS: Record<Technology, string> = {
  solar: '#f59e0b',
  wind: '#38bdf8',
  hydro: '#0ea5e9',
  natural_gas: '#94a3b8',
  nuclear: '#a78bfa',
  geothermal: '#f97316',
  biomass: '#84cc16',
  battery: '#22c55e',
  other: '#64748b',
}

export const TECH_LABELS: Record<Technology, string> = {
  solar: 'Solar PV',
  wind: 'Wind',
  hydro: 'Hydro',
  natural_gas: 'Natural Gas',
  nuclear: 'Nuclear',
  geothermal: 'Geothermal',
  biomass: 'Biomass',
  battery: 'Battery Storage',
  other: 'Other',
}

export function formatNumber(n: number, digits = 1): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(digits)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(digits)}k`
  return n.toFixed(digits)
}

export function formatGw(mw: number, digits = 1): string {
  return `${(mw / 1000).toFixed(digits)} GW`
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJson(data: unknown, filename: string) {
  downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json')
}

export function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const lines = [
    keys.join(','),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const v = r[k]
          const s = v == null ? '' : String(v)
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(',')
    ),
  ]
  downloadBlob(lines.join('\n'), filename, 'text/csv')
}

export function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}
