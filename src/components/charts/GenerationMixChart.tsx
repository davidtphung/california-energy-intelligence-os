import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { TECH_COLORS } from '../../lib/utils'
import { useApp } from '../../context/AppContext'
import type { Technology } from '../../types'

interface HourlyPoint {
  hour: string
  solar: number
  wind: number
  hydro: number
  nuclear: number
  natural_gas: number
  geothermal: number
  battery: number
  load: number
  totalGen: number
}

const STACK: { key: Technology; name: string }[] = [
  { key: 'solar', name: 'Solar' },
  { key: 'wind', name: 'Wind' },
  { key: 'hydro', name: 'Hydro' },
  { key: 'nuclear', name: 'Nuclear' },
  { key: 'geothermal', name: 'Geothermal' },
  { key: 'natural_gas', name: 'Gas' },
  { key: 'battery', name: 'Battery' },
]

interface Props {
  data: HourlyPoint[]
  height?: number
  stacked?: boolean
}

export function GenerationMixChart({ data, height = 300, stacked = true }: Props) {
  const { setDrilldown, theme } = useApp()
  const tick = theme === 'dark' ? '#8a8478' : '#7a7468'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  if (stacked) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          onClick={() => setDrilldown('generation-mix')}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: tick, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
            minTickGap={18}
          />
          <YAxis
            tick={{ fill: tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit=" MW"
            width={52}
          />
          <Tooltip
            contentStyle={{
              background: theme === 'dark' ? '#1c1a17' : '#e4e0d7',
              border: `1px solid ${grid}`,
              borderRadius: 2,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {STACK.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stackId="1"
              stroke={TECH_COLORS[s.key]}
              fill={TECH_COLORS[s.key]}
              fillOpacity={0.75}
              strokeWidth={1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="hour" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} unit=" MW" width={56} />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#1c1a17' : '#e4e0d7',
            border: `1px solid ${grid}`,
            borderRadius: 2,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area
          type="monotone"
          dataKey="load"
          name="Load"
          stroke="#f43f5e"
          fill="#f43f5e"
          fillOpacity={0.1}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="totalGen"
          name="Generation"
          stroke="#0ea5e9"
          fill="#0ea5e9"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
