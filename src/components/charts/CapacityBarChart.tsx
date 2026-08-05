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

const SHORT: Record<string, string> = {
  solar: 'Solar',
  wind: 'Wind',
  hydro: 'Hydro',
  natural_gas: 'Gas',
  coal: 'Coal',
  nuclear: 'Nuke',
  geothermal: 'Geo',
  biomass: 'Bio',
  battery: 'BESS',
  other: 'Other',
}

export function CapacityBarChart({ data, height = 280 }: Props) {
  const { setDrilldown, theme } = useApp()
  const chartData = data.map((d) => ({
    ...d,
    name: SHORT[d.technology] ?? TECH_LABELS[d.technology],
    full: TECH_LABELS[d.technology],
    gw: Math.round((d.capacityMw / 1000) * 10) / 10,
  }))
  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 12, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={28}
        />
        <YAxis
          tick={{ fill: tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          unit=" GW"
          width={44}
        />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#000000' : '#ffffff',
            border: `1px solid ${grid}`,
            borderRadius: 2,
            fontSize: 12,
          }}
          formatter={(value, _n, item) => {
            const full = (item?.payload as { full?: string } | undefined)?.full
            return [`${value} GW`, full ?? 'Capacity']
          }}
        />
        <Bar
          dataKey="gw"
          radius={[2, 2, 0, 0]}
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
