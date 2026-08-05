import { useApp } from '../../context/AppContext'
import { cn } from '../../lib/utils'

interface RegionDatum {
  region: string
  capacityGw: number
  peakLoadGw: number
  cleanShare: number
}

interface Props {
  data: RegionDatum[]
}

/** Stylized California region map (SVG schematic) */
export function CAMap({ data }: Props) {
  const { setDrilldown, filters, setFilters } = useApp()
  const maxCap = Math.max(...data.map((d) => d.capacityGw), 1)

  const regions: {
    id: string
    label: string
    d: string
    cx: number
    cy: number
  }[] = [
    {
      id: 'Northern CA',
      label: 'N. CA',
      d: 'M80 20 L140 15 L155 80 L120 100 L70 90 L55 45 Z',
      cx: 105,
      cy: 55,
    },
    {
      id: 'Bay Area',
      label: 'Bay',
      d: 'M55 95 L95 100 L100 140 L70 150 L50 125 Z',
      cx: 72,
      cy: 120,
    },
    {
      id: 'Central Valley',
      label: 'Valley',
      d: 'M100 105 L145 95 L155 180 L120 200 L95 160 Z',
      cx: 125,
      cy: 145,
    },
    {
      id: 'Central Coast',
      label: 'Coast',
      d: 'M70 155 L95 165 L100 210 L75 230 L55 190 Z',
      cx: 78,
      cy: 190,
    },
    {
      id: 'Southern CA',
      label: 'SoCal',
      d: 'M100 205 L150 190 L165 250 L120 280 L90 250 Z',
      cx: 125,
      cy: 235,
    },
    {
      id: 'Desert / Inland Empire',
      label: 'Desert',
      d: 'M155 185 L200 175 L210 240 L170 255 L155 220 Z',
      cx: 180,
      cy: 210,
    },
  ]

  return (
    <div className="relative">
      <svg
        viewBox="0 0 240 300"
        className="mx-auto h-auto w-full max-w-[280px]"
        role="img"
        aria-label="California regional capacity map"
      >
        <defs>
          <linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(14 165 233)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect width="240" height="300" fill="url(#mapBg)" rx="12" />
        {regions.map((r) => {
          const datum = data.find((d) => d.region === r.id)
          const intensity = datum ? datum.capacityGw / maxCap : 0.2
          const selected = filters.region === r.id
          return (
            <g key={r.id}>
              <path
                d={r.d}
                fill={`rgba(14, 165, 233, ${0.15 + intensity * 0.55})`}
                stroke={selected ? '#0284c7' : 'rgb(148 163 184 / 0.5)'}
                strokeWidth={selected ? 2.5 : 1}
                className="cursor-pointer transition-all duration-200 hover:opacity-90"
                onClick={() => {
                  setFilters({
                    region: selected ? 'all' : (r.id as typeof filters.region),
                  })
                  setDrilldown(`region:${r.id}`)
                }}
                role="button"
                tabIndex={0}
                aria-label={`${r.id}: ${datum?.capacityGw ?? 0} GW capacity`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setFilters({
                      region: selected ? 'all' : (r.id as typeof filters.region),
                    })
                    setDrilldown(`region:${r.id}`)
                  }
                }}
              />
              <text
                x={r.cx}
                y={r.cy}
                textAnchor="middle"
                className="pointer-events-none"
                style={{ fontSize: 10, fontWeight: 600, fill: 'var(--text)' }}
              >
                {r.label}
              </text>
              {datum && (
                <text
                  x={r.cx}
                  y={r.cy + 12}
                  textAnchor="middle"
                  className="pointer-events-none"
                  style={{ fontSize: 9, fill: 'var(--muted)' }}
                >
                  {datum.capacityGw} GW
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="chip-row" style={{ marginTop: 8, justifyContent: 'center' }}>
        {data.map((d) => (
          <span
            key={d.region}
            className={cn('badge', filters.region === d.region && 'badge-info')}
          >
            {d.cleanShare}% clean
          </span>
        ))}
      </div>
    </div>
  )
}
