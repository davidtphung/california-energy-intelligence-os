import type { Scenario } from '../../types'
import { cn } from '../../lib/utils'

interface Props {
  scenarios: Scenario[]
  year: 2030 | 2035 | 2045
  activeId: string
  onSelect: (id: string) => void
}

const metrics: {
  key: keyof Scenario['outputs'][0]
  label: string
  unit: string
  better: 'higher' | 'lower'
}[] = [
  { key: 'peakLoadGw', label: 'Peak Load', unit: 'GW', better: 'lower' },
  { key: 'capacityNeedGw', label: 'Capacity Need', unit: 'GW', better: 'lower' },
  { key: 'cleanEnergySharePct', label: 'Clean Share', unit: '%', better: 'higher' },
  { key: 'emissionsMt', label: 'Emissions', unit: 'Mt', better: 'lower' },
  { key: 'reserveMarginPct', label: 'Reserve Margin', unit: '%', better: 'higher' },
  { key: 'systemCostBillion', label: 'System Cost', unit: '$B', better: 'lower' },
  { key: 'storageGw', label: 'Storage', unit: 'GW', better: 'higher' },
]

export function ScenarioCompareTable({ scenarios, year, activeId, onSelect }: Props) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Metric
            </th>
            {scenarios.map((s) => (
              <th key={s.id} className="px-3 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    'rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
                    s.id === activeId
                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  )}
                >
                  {s.name}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const values = scenarios.map((s) => {
              const out = s.outputs.find((o) => o.year === year)!
              return out[m.key] as number
            })
            const best =
              m.better === 'higher' ? Math.max(...values) : Math.min(...values)
            return (
              <tr
                key={m.key}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {m.label}
                  <span className="ml-1 text-xs text-slate-400">({m.unit})</span>
                </td>
                {scenarios.map((s, i) => {
                  const v = values[i]
                  const isBest = v === best
                  return (
                    <td
                      key={s.id}
                      className={cn(
                        'px-3 py-2.5 text-right font-mono tabular-nums',
                        isBest
                          ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-100'
                      )}
                    >
                      {v.toFixed(1)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
