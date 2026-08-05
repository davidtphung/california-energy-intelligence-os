import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../../context/AppContext'

interface Point {
  hour: string
  load: number
  totalGen: number
  solar: number
  wind: number
}

interface Props {
  data: Point[]
  height?: number
}

export function LoadGenerationChart({ data, height = 280 }: Props) {
  const { setDrilldown, theme } = useApp()
  const tick = theme === 'dark' ? '#94a3b8' : '#64748b'
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        onClick={() => setDrilldown('load-generation')}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey="hour" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          unit=" MW"
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#0f172a' : '#fff',
            border: `1px solid ${grid}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="load" name="Load" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
        <Line
          type="monotone"
          dataKey="totalGen"
          name="Total Gen"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={false}
        />
        <Line type="monotone" dataKey="solar" name="Solar" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="wind" name="Wind" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  )
}
