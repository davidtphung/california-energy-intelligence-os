/**
 * Map of energy generation construction projects (build pipeline).
 */

import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { projectUS } from '../../data/usStates'
import {
  CONSTRUCTION_STATUS_LABEL,
  ENERGY_CONSTRUCTION,
  constructionColor,
  constructionTotals,
  statusStroke,
  type ConstructionStatus,
  type EnergyConstructionProject,
  TECH_LABELS,
  TECH_ORDER,
} from '../../data/energyConstruction'
import type { Technology } from '../../types'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'

const W = 1100
const H = 620

const STATUSES: ConstructionStatus[] = [
  'under-construction',
  'commissioning',
  'pre-construction',
  'permitted',
  'announced',
]

export function ConstructionProjectsMap() {
  const { theme, openStateDetail } = useApp()
  const [tech, setTech] = useState<Technology | 'all'>('all')
  const [status, setStatus] = useState<ConstructionStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(
    ENERGY_CONSTRUCTION.find((p) => p.status === 'under-construction')?.id ?? null
  )
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = [...ENERGY_CONSTRUCTION]
    if (tech !== 'all') list = list.filter((p) => p.technology === tech)
    if (status !== 'all') list = list.filter((p) => p.status === status)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.developer.toLowerCase().includes(q) ||
          p.stateAbbr.toLowerCase().includes(q) ||
          p.stateName.toLowerCase().includes(q) ||
          TECH_LABELS[p.technology].toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => b.capacityMw - a.capacityMw)
  }, [tech, status, query])

  const totals = useMemo(() => constructionTotals(filtered), [filtered])
  const allTotals = useMemo(() => constructionTotals(), [])

  const selected =
    filtered.find((p) => p.id === selectedId) ??
    filtered[0] ??
    null

  const maxMw = Math.max(...filtered.map((p) => p.capacityMw), 1)
  const ink = theme === 'dark' ? '#e8e4db' : '#2e2b23'

  const radius = (p: EnergyConstructionProject) =>
    6 + Math.sqrt(p.capacityMw / maxMw) * 26

  return (
    <div className="cmap mapcentric">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Build pipeline · generation</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            Energy construction projects
          </h2>
          <p className="mapcentric-lede">
            Plants and storage being built to generate or firm power — nuclear, solar, wind, gas,
            geothermal, hydro, batteries. Dot size = MW; ring color = status.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Projects</span>
            <strong>{totals.count}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Capacity</span>
            <strong>
              {totals.capacityGw.toFixed(1)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>States</span>
            <strong>{totals.states}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Building</span>
            <strong>
              {(
                (totals.byStatus.find((s) => s.status === 'under-construction')?.capacityMw ?? 0) /
                1000
              ).toFixed(1)}
              <em>GW</em>
            </strong>
          </div>
        </div>
      </header>

      <div className="state-chip-row" style={{ marginBottom: '0.5rem' }}>
        <button
          type="button"
          className={`state-chip${tech === 'all' ? ' is-on' : ''}`}
          onClick={() => setTech('all')}
        >
          All tech
        </button>
        {TECH_ORDER.filter((t) => allTotals.byTech.some((x) => x.technology === t)).map((t) => (
          <button
            key={t}
            type="button"
            className={`state-chip${tech === t ? ' is-on' : ''}`}
            onClick={() => setTech(t)}
          >
            <i
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 2,
                background: constructionColor(t),
                marginRight: 6,
                verticalAlign: 'middle',
              }}
            />
            {TECH_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="fbal-controls">
        <div className="gmap-mode">
          <button
            type="button"
            className={status === 'all' ? 'is-on' : ''}
            onClick={() => setStatus('all')}
          >
            All status
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={status === s ? 'is-on' : ''}
              onClick={() => setStatus(s)}
            >
              {CONSTRUCTION_STATUS_LABEL[s].split(' ')[0]}
            </button>
          ))}
        </div>
        <input
          className="gmap-select"
          style={{ minWidth: '12rem', flex: 1 }}
          placeholder="Search project, developer, state…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search construction projects"
        />
        <button
          type="button"
          className="gmap-icon-btn"
          title="Export CSV"
          onClick={() =>
            exportCsv(
              filtered.map((p) => ({
                name: p.name,
                technology: p.technology,
                status: p.status,
                capacity_mw: p.capacityMw,
                state: p.stateAbbr,
                developer: p.developer,
                cod_year: p.codYear,
                start_year: p.startYear,
                lat: p.lat,
                lon: p.lon,
              })),
              'us-energy-construction.csv'
            )
          }
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tech capacity flow under filters */}
      {totals.byTech.length > 0 && (
        <div className="mapcentric-under" style={{ border: '1px solid var(--line)', borderRadius: 4, padding: '0.5rem 0.75rem', marginBottom: '0.65rem' }}>
          <p className="kicker">Pipeline by technology</p>
          <div className="mapcentric-flowbar" aria-hidden>
            {totals.byTech.map((t) => (
              <div
                key={t.technology}
                style={{
                  width: `${(t.capacityMw / Math.max(1, totals.capacityGw * 1000)) * 100}%`,
                  background: constructionColor(t.technology),
                }}
                title={`${TECH_LABELS[t.technology]}: ${(t.capacityMw / 1000).toFixed(1)} GW`}
              />
            ))}
          </div>
        </div>
      )}

      <div className={`mapcentric-stage${selected ? ' has-drawer' : ''}`}>
        <div className="mapcentric-map">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="fbal-svg"
            role="img"
            aria-label="US energy generation construction projects map"
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="28" fill="var(--mute)" fontSize="12" fontFamily="var(--font-mono)">
              Construction · generation & storage · {filtered.length} projects ·{' '}
              {totals.capacityGw.toFixed(1)} GW
            </text>
            <path
              d="M 60 90 L 120 55 L 220 42 L 340 40 L 480 50 L 600 70 L 700 110 L 760 170 L 780 240 L 760 310 L 700 360 L 600 385 L 480 390 L 360 380 L 240 360 L 140 320 L 80 250 L 55 170 Z"
              fill="var(--fill)"
              stroke="var(--line-soft)"
              strokeWidth={1}
              opacity={0.7}
            />

            {/* Draw larger first */}
            {[...filtered]
              .sort((a, b) => b.capacityMw - a.capacityMw)
              .map((p) => {
                const { x, y } = projectUS(p.lon, p.lat, W, H)
                const r = radius(p)
                const on = p.id === selectedId || p.id === hoverId
                const fill = constructionColor(p.technology)
                const stroke = statusStroke(p.status)
                return (
                  <g
                    key={p.id}
                    transform={`translate(${x},${y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverId(p.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <circle
                      r={r + 3}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={on ? 2.5 : 1.8}
                      strokeOpacity={0.9}
                      strokeDasharray={
                        p.status === 'announced'
                          ? '3 3'
                          : p.status === 'permitted'
                            ? '5 3'
                            : undefined
                      }
                    />
                    <circle
                      r={r}
                      fill={fill}
                      fillOpacity={on ? 0.95 : 0.8}
                      stroke={on ? ink : 'var(--bg)'}
                      strokeWidth={on ? 2 : 0.8}
                    />
                    {(on || r > 16) && (
                      <text
                        y={r + 12}
                        textAnchor="middle"
                        fill={ink}
                        fontSize={9}
                        fontFamily="var(--font-sans)"
                        style={{ pointerEvents: 'none' }}
                      >
                        {p.stateAbbr}
                      </text>
                    )}
                    <title>
                      {p.name} · {TECH_LABELS[p.technology]} · {p.capacityMw} MW ·{' '}
                      {CONSTRUCTION_STATUS_LABEL[p.status]} · COD {p.codYear}
                    </title>
                  </g>
                )
              })}

            <g transform={`translate(24, ${H - 56})`}>
              <text fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                fill = tech · ring = status (green building · blue commissioning · yellow pre · purple
                permitted · gray announced)
              </text>
            </g>
          </svg>
        </div>

        {selected && (
          <aside className="mapcentric-drawer" aria-label="Construction project detail">
            <p className="kicker">From map</p>
            <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
              {selected.name}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <span
                className="fbal-badge"
                style={{
                  background: `${constructionColor(selected.technology)}22`,
                  color: constructionColor(selected.technology),
                }}
              >
                {TECH_LABELS[selected.technology]}
              </span>
              <span
                className="fbal-badge"
                style={{
                  border: `1px solid ${statusStroke(selected.status)}`,
                  color: statusStroke(selected.status),
                }}
              >
                {CONSTRUCTION_STATUS_LABEL[selected.status]}
              </span>
            </div>

            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Capacity</th>
                  <td className="mono" style={{ color: 'var(--highlight)' }}>
                    {selected.capacityMw.toLocaleString()} MW
                  </td>
                </tr>
                <tr>
                  <th scope="row">State</th>
                  <td>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => openStateDetail(selected.stateAbbr)}
                    >
                      {selected.stateAbbr} · {selected.stateName}
                    </button>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Developer</th>
                  <td>{selected.developer}</td>
                </tr>
                <tr>
                  <th scope="row">COD target</th>
                  <td className="mono">{selected.codYear}</td>
                </tr>
                <tr>
                  <th scope="row">Build start</th>
                  <td className="mono">{selected.startYear}</td>
                </tr>
                <tr>
                  <th scope="row">Region</th>
                  <td>{selected.region}</td>
                </tr>
                <tr>
                  <th scope="row">Coords</th>
                  <td className="mono">
                    {selected.lat.toFixed(2)}°N, {Math.abs(selected.lon).toFixed(2)}°W
                  </td>
                </tr>
              </tbody>
            </table>
            {selected.note && (
              <p className="sub" style={{ marginTop: 10, maxWidth: 'none', fontSize: '0.82rem' }}>
                {selected.note}
              </p>
            )}

            <p className="kicker" style={{ marginTop: 14 }}>
              Same technology nearby
            </p>
            <ul className="gmap-actions">
              {filtered
                .filter((p) => p.technology === selected.technology && p.id !== selected.id)
                .slice(0, 4)
                .map((p) => (
                  <li key={p.id}>
                    <button type="button" className="linkish" onClick={() => setSelectedId(p.id)}>
                      {p.name} · {(p.capacityMw / 1000).toFixed(2)} GW
                    </button>
                  </li>
                ))}
            </ul>
          </aside>
        )}
      </div>

      <div className="fbal-intel">
        <div>
          <p className="kicker">By technology</p>
          <ol className="ov-rank-list">
            {totals.byTech.map((t, i) => (
              <li key={t.technology}>
                <button type="button" className="ov-rank-btn" onClick={() => setTech(t.technology)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <i
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: constructionColor(t.technology),
                        marginRight: 6,
                      }}
                    />
                    <strong>{TECH_LABELS[t.technology]}</strong>
                  </span>
                  <span className="mono">
                    {(t.capacityMw / 1000).toFixed(1)} GW · {t.count}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="kicker">By status</p>
          <ol className="ov-rank-list">
            {totals.byStatus.map((s, i) => (
              <li key={s.status}>
                <button type="button" className="ov-rank-btn" onClick={() => setStatus(s.status)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{CONSTRUCTION_STATUS_LABEL[s.status]}</strong>
                  </span>
                  <span className="mono">
                    {(s.capacityMw / 1000).toFixed(1)} GW · {s.count}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="kicker">Largest projects</p>
          <ol className="ov-rank-list">
            {filtered.slice(0, 8).map((p, i) => (
              <li key={p.id}>
                <button type="button" className="ov-rank-btn" onClick={() => setSelectedId(p.id)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{p.stateAbbr}</strong> {p.name.slice(0, 28)}
                    {p.name.length > 28 ? '…' : ''}
                  </span>
                  <span className="mono">{(p.capacityMw / 1000).toFixed(2)} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="footer-line">
        Construction map · generation projects · sample pipeline · EIA-860m / ISO queue scale · not a
        live permit feed
      </p>
    </div>
  )
}
