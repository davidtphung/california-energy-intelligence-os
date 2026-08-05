import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CapacityByTech } from '../../types'
import { TECH_COLORS, TECH_LABELS } from '../../lib/utils'
import { useApp } from '../../context/AppContext'

interface Props {
  data: CapacityByTech[]
  height?: number
}

export function CapacityBarChart({ data, height = 280 }: Props) {
  const { setDrilldown, theme } = useApp()
  const chartData = data.map((d) => ({
    ...d,
    name: TECH_LABELS[d.technology],
    gw: Math.round((d.capacityMw / 1000) * 10) / 10,
  }))
  const tick = theme === 'dark' ? '#94a3b8' : '#64748b'
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          unit=" GW"
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#0f172a' : '#fff',
            border: `1px solid ${grid}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${value} GW`, 'Capacity']}
        />
        <Bar
          dataKey="gw"
          radius={[6, 6, 0, 0]}
          cursor="pointer"
          onClick={(_data, index) => {
            const tech = chartData[index]?.technology
            if (tech) setDrilldown(`capacity:${tech}`)
          }}
        >
          {chartData.map((d) => (
            <Cell key={d.technology} fill={TECH_COLORS[d.technology]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
