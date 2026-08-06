import { useMemo, useState } from 'react'
import {
  allAssets,
  projectCA,
  TECH_MAP_COLOR,
  type EnergyPortfolio,
  type PortfolioAsset,
} from '../../data/portfolios'
import { projectUS } from '../../data/usStates'
import type { Technology } from '../../types'
import { TECH_LABELS, cn } from '../../lib/utils'

interface Props {
  portfolios: EnergyPortfolio[]
  selectedPortfolioId: string | 'all'
  selectedAssetId: string | null
  techFilter: Technology | 'all'
  /** When a single state is filtered, use CA inset map for CA and US proj otherwise */
  stateFilter?: string | 'all'
  /** Fill parent map-centric stage */
  large?: boolean
  onSelectAsset: (
    asset: PortfolioAsset & {
      portfolioId: string
      portfolioShort: string
      stateName: string
      kind: import('../../types').PortfolioKind
    }
  ) => void
}

export function PortfolioLocationMap({
  portfolios,
  selectedPortfolioId,
  selectedAssetId,
  techFilter,
  stateFilter = 'all',
  large = true,
  onSelectAsset,
}: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null)

  const caOnly = stateFilter === 'CA'
  const W = caOnly ? (large ? 520 : 360) : large ? 960 : 720
  const H = caOnly ? (large ? 560 : 420) : large ? 580 : 460

  const assets = useMemo(() => {
    let list = allAssets(portfolios)
    if (selectedPortfolioId !== 'all') {
      list = list.filter((a) => a.portfolioId === selectedPortfolioId)
    }
    if (techFilter !== 'all') {
      list = list.filter((a) => a.technology === techFilter)
    }
    // Largest first so small markers stay clickable on top
    return [...list].sort((a, b) => b.capacityMw - a.capacityMw)
  }, [portfolios, selectedPortfolioId, techFilter])

  const maxCap = Math.max(...assets.map((a) => a.capacityMw), 1)
  const hover = assets.find((a) => a.id === hoverId) ?? assets.find((a) => a.id === selectedAssetId)

  const project = (lon: number, lat: number) =>
    caOnly ? projectCA(lon, lat, W, H) : projectUS(lon, lat, W, H)

  // Flow links: selected portfolio assets → show soft connection network
  const flowLinks = useMemo(() => {
    if (selectedPortfolioId === 'all' && !selectedAssetId) return [] as { x1: number; y1: number; x2: number; y2: number; color: string }[]
    const focus = assets.filter((a) =>
      selectedAssetId
        ? a.id === selectedAssetId || a.portfolioId === assets.find((x) => x.id === selectedAssetId)?.portfolioId
        : a.portfolioId === selectedPortfolioId
    )
    if (focus.length < 2) return []
    const anchor = focus.slice().sort((a, b) => b.capacityMw - a.capacityMw)[0]
    const ap = project(anchor.longitude, anchor.latitude)
    return focus
      .filter((a) => a.id !== anchor.id)
      .slice(0, 24)
      .map((a) => {
        const bp = project(a.longitude, a.latitude)
        return {
          x1: ap.x,
          y1: ap.y,
          x2: bp.x,
          y2: bp.y,
          color: TECH_MAP_COLOR[a.technology],
        }
      })
  }, [assets, selectedPortfolioId, selectedAssetId, caOnly, W, H])

  return (
    <div className={`pmap${large ? ' pmap-large' : ''}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="pmap-svg"
        role="img"
        aria-label={
          caOnly
            ? 'California map of energy portfolio asset locations'
            : 'United States map of energy portfolio asset locations by state'
        }
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

        <rect width={W} height={H} fill="var(--bg-soft)" />

        {caOnly ? (
          <path
            d="M 48 38 L 72 22 L 118 18 L 155 28 L 178 48 L 195 78 L 208 120 L 218 165 L 228 210 L 238 255 L 242 300 L 235 340 L 218 378 L 188 400 L 155 408 L 125 400 L 98 378 L 78 340 L 62 290 L 52 240 L 48 190 L 42 145 L 38 100 L 40 65 Z"
            fill="var(--fill)"
            stroke="var(--line)"
            strokeWidth={1.5}
          />
        ) : (
          <>
            <path
              d="M 48 80 L 90 55 L 160 42 L 240 38 L 320 42 L 400 48 L 480 58 L 540 72 L 600 95 L 650 130 L 675 175 L 680 230 L 670 280 L 640 320 L 590 350 L 520 365 L 440 370 L 360 365 L 280 355 L 200 340 L 140 310 L 100 270 L 70 220 L 52 160 Z"
              fill="var(--fill)"
              stroke="var(--line)"
              strokeWidth={1.2}
            />
            <rect
              x={24}
              y={300}
              width={150}
              height={140}
              rx={4}
              fill="none"
              stroke="var(--line-soft)"
              strokeDasharray="3 3"
            />
            <text x={32} y={316} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
              AK
            </text>
            <rect
              x={168}
              y={360}
              width={120}
              height={80}
              rx={4}
              fill="none"
              stroke="var(--line-soft)"
              strokeDasharray="3 3"
            />
            <text x={176} y={376} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
              HI
            </text>
            <rect
              x={304}
              y={360}
              width={120}
              height={80}
              rx={4}
              fill="none"
              stroke="var(--line-soft)"
              strokeDasharray="3 3"
            />
            <text x={312} y={376} fill="var(--mute)" fontSize={10} fontFamily="var(--font-mono)">
              PR
            </text>
          </>
        )}

        {/* Data flow lines from selected portfolio hub */}
        {flowLinks.map((l, i) => (
          <line
            key={`flow-${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.color}
            strokeWidth={1.4}
            strokeOpacity={0.45}
            strokeDasharray="6 5"
            className="pmap-flow"
            pointerEvents="none"
          />
        ))}

        {assets.map((a) => {
          const { x, y } = project(a.longitude, a.latitude)
          const r = 3.5 + Math.sqrt(a.capacityMw / maxCap) * (caOnly ? 14 : large ? 16 : 14)
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
                className={`pmap-dot${active ? ' is-active' : ''}`}
                filter={active ? 'url(#pmap-soft)' : undefined}
                style={{
                  transition: 'r 0.25s cubic-bezier(0.34, 1.4, 0.64, 1), fill-opacity 0.15s ease',
                }}
                onMouseEnter={() => setHoverId(a.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelectAsset(a)}
                role="button"
                tabIndex={0}
                aria-label={`${a.name}, ${a.stateAbbr}, ${a.capacityMw} MW ${a.technology}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectAsset(a)
                  }
                }}
              />
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

        <text x={16} y={H - 12} fill="var(--mute)" fontSize={9} fontFamily="var(--font-mono)">
          {caOnly ? 'California detail' : 'USA · size = nameplate MW'}
        </text>
      </svg>

      {hover && (
        <div className="pmap-tip" role="status">
          <span className="pmap-tip-tag">
            {hover.stateAbbr} · {hover.portfolioShort} · {hover.county}
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
        {stateFilter !== 'all' ? ` · filter ${stateFilter}` : ' · all states'}
      </p>
    </div>
  )
}

export function PortfolioKindBadge({ kind }: { kind: string }) {
  return <span className={cn('badge')}>{kind}</span>
}
