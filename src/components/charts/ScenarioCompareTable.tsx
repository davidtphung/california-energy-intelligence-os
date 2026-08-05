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
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Metric</th>
            {scenarios.map((s) => (
              <th key={s.id} style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={cn('chip', s.id === activeId && 'active')}
                  style={{ fontSize: 11 }}
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
            const best = m.better === 'higher' ? Math.max(...values) : Math.min(...values)
            return (
              <tr key={m.key}>
                <td>
                  {m.label}
                  <span className="muted" style={{ marginLeft: 4, fontSize: 11 }}>
                    ({m.unit})
                  </span>
                </td>
                {scenarios.map((s, i) => {
                  const v = values[i]
                  const isBest = v === best
                  return (
                    <td
                      key={s.id}
                      className="num"
                      style={{
                        color: isBest ? 'var(--success)' : undefined,
                        fontWeight: isBest ? 600 : undefined,
                      }}
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
