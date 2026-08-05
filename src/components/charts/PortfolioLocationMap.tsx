import { useMemo, useState } from 'react'
import {
  allAssets,
  projectCA,
  TECH_MAP_COLOR,
  type EnergyPortfolio,
  type PortfolioAsset,
} from '../../data/portfolios'
import type { Technology } from '../../types'
import { TECH_LABELS } from '../../lib/utils'
import { cn } from '../../lib/utils'

/** Simplified California outline (viewBox 360×420) */
const CA_OUTLINE =
  'M 48 38 L 72 22 L 118 18 L 155 28 L 178 48 L 195 78 L 208 120 L 218 165 L 228 210 L 238 255 L 242 300 L 235 340 L 218 378 L 188 400 L 155 408 L 125 400 L 98 378 L 78 340 L 62 290 L 52 240 L 48 190 L 42 145 L 38 100 L 40 65 Z'

interface Props {
  portfolios: EnergyPortfolio[]
  selectedPortfolioId: string | 'all'
  selectedAssetId: string | null
  techFilter: Technology | 'all'
  onSelectAsset: (asset: PortfolioAsset & { portfolioId: string; portfolioShort: string }) => void
}

export function PortfolioLocationMap({
  portfolios,
  selectedPortfolioId,
  selectedAssetId,
  techFilter,
  onSelectAsset,
}: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const W = 360
  const H = 420

  const assets = useMemo(() => {
    let list = allAssets(portfolios)
    if (selectedPortfolioId !== 'all') {
      list = list.filter((a) => a.portfolioId === selectedPortfolioId)
    }
    if (techFilter !== 'all') {
      list = list.filter((a) => a.technology === techFilter)
    }
    return list
  }, [portfolios, selectedPortfolioId, techFilter])

  const maxCap = Math.max(...assets.map((a) => a.capacityMw), 1)
  const hover = assets.find((a) => a.id === hoverId) ?? assets.find((a) => a.id === selectedAssetId)

  return (
    <div className="pmap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="pmap-svg"
        role="img"
        aria-label="California map of energy portfolio asset locations"
      >
        <defs>
          <filter id="pmap-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean / field */}
        <rect width={W} height={H} fill="var(--bg-soft)" />

        {/* State fill */}
        <path
          d={CA_OUTLINE}
          fill="var(--fill)"
          stroke="var(--line)"
          strokeWidth={1.5}
        />

        {/* Grid ticks for lat/lon reference (no overlapping labels) */}
        {[34, 36, 38, 40].map((lat) => {
          const { y } = projectCA(-120, lat, W, H)
          return (
            <line
              key={lat}
              x1={20}
              x2={W - 20}
              y1={y}
              y2={y}
              stroke="var(--line-soft)"
              strokeWidth={0.6}
              strokeDasharray="2 6"
            />
          )
        })}

        {/* Assets: size by capacity, color by tech */}
        {assets.map((a) => {
          const { x, y } = projectCA(a.longitude, a.latitude, W, H)
          const r = 3.5 + (a.capacityMw / maxCap) * 10
          const active = a.id === selectedAssetId || a.id === hoverId
          const color = TECH_MAP_COLOR[a.technology]
          return (
            <g key={a.id}>
              <circle
                cx={x}
                cy={y}
                r={r + (active ? 2 : 0)}
                fill={color}
                fillOpacity={active ? 0.95 : 0.72}
                stroke={active ? 'var(--highlight)' : 'var(--bg)'}
                strokeWidth={active ? 1.5 : 0.8}
                className="pmap-dot"
                filter={active ? 'url(#pmap-soft)' : undefined}
                onMouseEnter={() => setHoverId(a.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelectAsset(a)}
                role="button"
                tabIndex={0}
                aria-label={`${a.name}, ${a.capacityMw} MW ${a.technology}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectAsset(a)
                  }
                }}
              />
              {/* Output ring: positive gen = solid arc hint via second circle */}
              {a.outputMw !== 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={r + 3}
                  fill="none"
                  stroke={a.outputMw < 0 ? 'var(--mute)' : color}
                  strokeWidth={1}
                  strokeOpacity={0.45}
                  strokeDasharray={a.outputMw < 0 ? '2 2' : undefined}
                  pointerEvents="none"
                />
              )}
            </g>
          )
        })}

        {/* Lon/lat corner labels - corners only, no collision with dots */}
        <text x={22} y={H - 14} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
          32.5°N
        </text>
        <text x={W - 48} y={22} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
          42°N
        </text>
        <text x={22} y={22} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
          124°W
        </text>
        <text x={W - 52} y={H - 14} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
          114°W
        </text>
      </svg>

      {hover && (
        <div className="pmap-tip" role="status">
          <span className="pmap-tip-tag">
            {hover.portfolioShort} · {hover.county}
          </span>
          <span className="pmap-tip-title">{hover.name}</span>
          <span className="pmap-tip-sub">
            {TECH_LABELS[hover.technology]} · {hover.capacityMw.toLocaleString()} MW cap ·{' '}
            {hover.outputMw >= 0 ? '+' : ''}
            {hover.outputMw.toLocaleString()} MW out · {hover.latitude.toFixed(2)}°N,{' '}
            {Math.abs(hover.longitude).toFixed(2)}°W · {hover.region}
          </span>
        </div>
      )}

      <div className="pmap-legend">
        {(Object.keys(TECH_MAP_COLOR) as Technology[]).map((t) => (
          <span key={t} className="pmap-leg-item">
            <i style={{ background: TECH_MAP_COLOR[t] }} />
            {TECH_LABELS[t]}
          </span>
        ))}
      </div>
      <p className="mono muted" style={{ marginTop: 6, fontSize: 11 }}>
        Dot size = nameplate MW · ring = sample output (dashed = charging / load)
      </p>
    </div>
  )
}

export function PortfolioKindBadge({ kind }: { kind: string }) {
  return <span className={cn('badge')}>{kind}</span>
}
