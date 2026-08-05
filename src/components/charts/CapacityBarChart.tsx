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
  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

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
            background: theme === 'dark' ? '#1c1a17' : '#e4e0d7',
            border: `1px solid ${grid}`,
            borderRadius: 2,
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
