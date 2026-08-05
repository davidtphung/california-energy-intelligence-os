/**
 * Map: utility companies + grid zones + interconnections / overlaps.
 */

import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { projectUS } from '../../data/usStates'
import {
  GRID_INTERTIES,
  GRID_ZONES,
  INTERCONNECTS,
  UTILITIES,
  gridSummary,
  intertiesForZone,
  overlappingUtilities,
  utilitiesInZone,
  zoneById,
  type GridZone,
  type GridZoneId,
  type InterconnectId,
} from '../../data/gridUtilities'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'

const W = 1100
const H = 640

type FocusMode = 'zones' | 'utilities' | 'interties' | 'overlaps'

export function UtilityGridMap() {
  const { theme, openStateDetail } = useApp()
  const [mode, setMode] = useState<FocusMode>('zones')
  const [interconnect, setInterconnect] = useState<InterconnectId | 'all'>('all')
  const [selectedZone, setSelectedZone] = useState<GridZoneId | null>('pjm')
  const [selectedUtil, setSelectedUtil] = useState<string | null>(null)
  const [selectedTie, setSelectedTie] = useState<string | null>(null)
  const [hoverZone, setHoverZone] = useState<GridZoneId | null>(null)
  const [hoverUtil, setHoverUtil] = useState<string | null>(null)

  const dark = theme === 'dark'
  const summary = useMemo(() => gridSummary(), [])
  const overlaps = useMemo(() => overlappingUtilities(), [])

  const zones = useMemo(() => {
    if (interconnect === 'all') return GRID_ZONES
    return GRID_ZONES.filter((z) => z.interconnect === interconnect)
  }, [interconnect])

  const utilities = useMemo(() => {
    let list = UTILITIES.filter((u) => u.kind !== 'iso')
    if (interconnect !== 'all') {
      list = list.filter((u) => {
        const z = zoneById(u.zoneId)
        return z?.interconnect === interconnect
      })
    }
    if (mode === 'overlaps') list = overlaps
    if (selectedZone && mode !== 'overlaps') {
      const inZ = utilitiesInZone(selectedZone)
      list = list.filter((u) => inZ.some((x) => x.id === u.id))
    }
    return list
  }, [interconnect, mode, selectedZone, overlaps])

  const interties = useMemo(() => {
    let list = GRID_INTERTIES.filter((t) => t.fromZone !== t.toZone)
    if (interconnect !== 'all') {
      list = list.filter((t) => {
        const a = zoneById(t.fromZone)
        const b = zoneById(t.toZone)
        return a?.interconnect === interconnect || b?.interconnect === interconnect
      })
    }
    if (selectedZone) list = intertiesForZone(selectedZone).filter((t) => t.fromZone !== t.toZone)
    return list
  }, [interconnect, selectedZone])

  const zone = selectedZone ? zoneById(selectedZone) : null
  const util = selectedUtil ? UTILITIES.find((u) => u.id === selectedUtil) : null
  const tie = selectedTie ? GRID_INTERTIES.find((t) => t.id === selectedTie) : null

  const ink = dark ? '#e8e4db' : '#2e2b23'
  const mute = dark ? '#8a8478' : '#7a7468'

  const zonePoint = (z: GridZone) => projectUS(z.lon, z.lat, W, H)

  return (
    <div className="ugrid mapcentric">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Grid structure · utilities</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            How the grid is divided &amp; connected
          </h2>
          <p className="mapcentric-lede">
            Three interconnections · ISO/RTO and regional footprints · utility companies · seams and
            interties. Overlaps show multi-zone operators. Schematic map — not legal service-area GIS.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Interconnects</span>
            <strong>{summary.interconnects}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Zones</span>
            <strong>{summary.zones}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Utilities</span>
            <strong>{summary.utilities}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Interties</span>
            <strong>
              {summary.transferGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
        </div>
      </header>

      <div className="fbal-controls">
        <div className="gmap-mode">
          {(
            [
              ['zones', 'Zones'],
              ['utilities', 'Utilities'],
              ['interties', 'Interties'],
              ['overlaps', 'Overlaps'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={mode === id ? 'is-on' : ''}
              onClick={() => {
                setMode(id)
                if (id === 'overlaps') setSelectedUtil(overlaps[0]?.id ?? null)
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="gmap-mode">
          <button
            type="button"
            className={interconnect === 'all' ? 'is-on' : ''}
            onClick={() => setInterconnect('all')}
          >
            All
          </button>
          {INTERCONNECTS.map((ic) => (
            <button
              key={ic.id}
              type="button"
              className={interconnect === ic.id ? 'is-on' : ''}
              onClick={() => setInterconnect(ic.id)}
              style={interconnect === ic.id ? { boxShadow: `inset 0 -2px 0 ${ic.color}` } : undefined}
            >
              {ic.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="gmap-icon-btn"
          title="Export CSV"
          onClick={() =>
            exportCsv(
              UTILITIES.map((u) => ({
                name: u.name,
                short: u.short,
                kind: u.kind,
                primary_zone: u.zoneId,
                also_zones: (u.alsoZones ?? []).join('|'),
                states: u.states.join('|'),
                customers_m: u.customersM ?? '',
              })),
              'us-utilities-grid-zones.csv'
            )
          }
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Interconnect legend strip */}
      <div className="ugrid-ic-strip">
        {INTERCONNECTS.map((ic) => (
          <button
            key={ic.id}
            type="button"
            className={`ugrid-ic-chip${interconnect === ic.id ? ' is-on' : ''}`}
            onClick={() => setInterconnect(interconnect === ic.id ? 'all' : ic.id)}
          >
            <i style={{ background: ic.color }} />
            <strong>{ic.short}</strong>
            <span>{ic.note}</span>
          </button>
        ))}
      </div>

      <div className="mapcentric-stage has-drawer">
        <div className="mapcentric-map">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="fbal-svg"
            role="img"
            aria-label="US grid zones, utilities, and interconnections map"
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="26" fill={mute} fontSize="11" fontFamily="var(--font-mono)">
              {mode === 'zones' && 'Zone blobs = market / reliability footprints'}
              {mode === 'utilities' && 'Squares = utilities · color = primary zone'}
              {mode === 'interties' && 'Lines = interties / seams · width ∝ transfer MW'}
              {mode === 'overlaps' && 'Highlighted utilities span multiple zones'}
            </text>

            {/* Soft continent */}
            <path
              d="M 60 90 L 120 55 L 220 42 L 340 40 L 480 50 L 600 70 L 700 110 L 760 170 L 780 240 L 760 310 L 700 360 L 600 385 L 480 390 L 360 380 L 240 360 L 140 320 L 80 250 L 55 170 Z"
              fill="var(--fill)"
              stroke="var(--line-soft)"
              strokeWidth={1}
              opacity={0.55}
            />

            {/* Interconnect soft wash behind zones */}
            {INTERCONNECTS.filter((ic) => interconnect === 'all' || interconnect === ic.id).map(
              (ic) => {
                const zs = GRID_ZONES.filter((z) => z.interconnect === ic.id)
                return zs.map((z) => {
                  const { x, y } = zonePoint(z)
                  return (
                    <circle
                      key={`ic-${ic.id}-${z.id}`}
                      cx={x}
                      cy={y}
                      r={z.footprintR * 1.35}
                      fill={ic.color}
                      fillOpacity={0.04}
                      style={{ pointerEvents: 'none' }}
                    />
                  )
                })
              }
            )}

            {/* Zone footprints */}
            {zones.map((z) => {
              const { x, y } = zonePoint(z)
              const on = z.id === selectedZone || z.id === hoverZone
              const dim =
                selectedZone &&
                selectedZone !== z.id &&
                mode !== 'interties' &&
                !interties.some(
                  (t) =>
                    (t.fromZone === selectedZone && t.toZone === z.id) ||
                    (t.toZone === selectedZone && t.fromZone === z.id)
                )
              return (
                <g
                  key={z.id}
                  style={{ cursor: 'pointer', opacity: dim ? 0.28 : 1 }}
                  onMouseEnter={() => setHoverZone(z.id)}
                  onMouseLeave={() => setHoverZone(null)}
                  onClick={() => {
                    setSelectedZone(z.id)
                    setSelectedUtil(null)
                    setSelectedTie(null)
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={z.footprintR * (on ? 1.08 : 1)}
                    fill={z.color}
                    fillOpacity={on ? 0.28 : 0.16}
                    stroke={z.color}
                    strokeWidth={on ? 2.2 : 1.2}
                    strokeOpacity={0.85}
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill={ink}
                    fontSize={11}
                    fontWeight={700}
                    fontFamily="var(--font-sans)"
                    style={{ pointerEvents: 'none' }}
                  >
                    {z.short}
                  </text>
                  <title>
                    {z.name} · {z.interconnect} · peak ~{z.peakGw} GW · {z.states.join(', ')}
                  </title>
                </g>
              )
            })}

            {/* Intertie lines */}
            {(mode === 'interties' || mode === 'zones' || selectedZone) &&
              interties.map((t) => {
                const a = zoneById(t.fromZone)
                const b = zoneById(t.toZone)
                if (!a || !b) return null
                if (
                  interconnect !== 'all' &&
                  a.interconnect !== interconnect &&
                  b.interconnect !== interconnect
                )
                  return null
                const pa = zonePoint(a)
                const pb = zonePoint(b)
                const on = t.id === selectedTie
                const sw = 1 + Math.min(8, t.transferMw / 1200)
                const dash =
                  t.kind === 'dc' ? '6 4' : t.kind === 'seam' ? '2 3' : undefined
                return (
                  <g key={t.id}>
                    <line
                      x1={pa.x}
                      y1={pa.y}
                      x2={pb.x}
                      y2={pb.y}
                      stroke={on ? ink : dark ? '#94a3b8' : '#64748b'}
                      strokeWidth={on ? sw + 1 : sw}
                      strokeOpacity={mode === 'interties' || on ? 0.75 : 0.35}
                      strokeDasharray={dash}
                      className={t.kind !== 'seam' ? 'pmap-flow' : undefined}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTie(t.id)
                        setSelectedUtil(null)
                      }}
                    >
                      <title>
                        {t.name}: {t.transferMw} MW · {t.kind}
                      </title>
                    </line>
                  </g>
                )
              })}

            {/* Utility markers */}
            {(mode === 'utilities' || mode === 'overlaps' || mode === 'zones') &&
              utilities.map((u) => {
                const z = zoneById(u.zoneId)
                const { x, y } = projectUS(u.lon, u.lat, W, H)
                const on = u.id === selectedUtil || u.id === hoverUtil
                const multi = (u.alsoZones?.length ?? 0) > 0
                const show = mode === 'utilities' || mode === 'overlaps' || multi || on
                if (mode === 'zones' && !multi && !on) return null
                if (!show && mode === 'zones') return null
                const s = 5 + Math.min(10, (u.customersM ?? 0.5) * 1.2)
                return (
                  <g
                    key={u.id}
                    transform={`translate(${x},${y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverUtil(u.id)}
                    onMouseLeave={() => setHoverUtil(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedUtil(u.id)
                      setSelectedZone(u.zoneId)
                      setSelectedTie(null)
                    }}
                  >
                    {multi && (
                      <circle
                        r={s + 5}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                        opacity={0.9}
                      />
                    )}
                    <rect
                      x={-s}
                      y={-s}
                      width={s * 2}
                      height={s * 2}
                      rx={2}
                      fill={z?.color ?? '#64748b'}
                      fillOpacity={on ? 0.95 : 0.8}
                      stroke={on ? ink : 'var(--bg)'}
                      strokeWidth={on ? 2 : 0.8}
                      transform="rotate(45)"
                    />
                    {(on || mode === 'overlaps') && (
                      <text
                        y={s + 11}
                        textAnchor="middle"
                        fill={ink}
                        fontSize={9}
                        fontFamily="var(--font-sans)"
                        style={{ pointerEvents: 'none' }}
                      >
                        {u.short}
                      </text>
                    )}
                    <title>
                      {u.name} · {u.zoneId}
                      {multi ? ` + ${u.alsoZones!.join(', ')}` : ''} · {u.states.join(', ')}
                    </title>
                  </g>
                )
              })}

            <g transform={`translate(24, ${H - 48})`}>
              <text fill={mute} fontSize="10" fontFamily="var(--font-mono)">
                blobs = zones · diamonds = utilities · lines = interties (solid AC · dashed DC · dotted
                seam) · orange ring = multi-zone overlap
              </text>
            </g>
          </svg>
        </div>

        <aside className="mapcentric-drawer">
          <p className="kicker">From map</p>
          {util ? (
            <>
              <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                {util.name}
              </h3>
              <p className="sub" style={{ maxWidth: 'none', fontSize: '0.82rem' }}>
                {util.note}
              </p>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Kind</th>
                    <td>{util.kind}</td>
                  </tr>
                  <tr>
                    <th scope="row">Primary zone</th>
                    <td>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setSelectedZone(util.zoneId)}
                      >
                        {zoneById(util.zoneId)?.short ?? util.zoneId}
                      </button>
                    </td>
                  </tr>
                  {util.alsoZones && util.alsoZones.length > 0 && (
                    <tr>
                      <th scope="row">Also operates</th>
                      <td>
                        {util.alsoZones.map((z) => zoneById(z)?.short ?? z).join(' · ')}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th scope="row">States</th>
                    <td>
                      {util.states.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="linkish"
                          style={{ marginRight: 6 }}
                          onClick={() => openStateDetail(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </td>
                  </tr>
                  {util.customersM != null && (
                    <tr>
                      <th scope="row">Customers</th>
                      <td className="mono">~{util.customersM}M</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {(util.alsoZones?.length ?? 0) > 0 && (
                <p className="fbal-badge tight" style={{ marginTop: 10 }}>
                  Multi-zone overlap
                </p>
              )}
            </>
          ) : tie ? (
            <>
              <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                {tie.name}
              </h3>
              <p className="sub" style={{ maxWidth: 'none', fontSize: '0.82rem' }}>
                {tie.note}
              </p>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">From</th>
                    <td>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setSelectedZone(tie.fromZone)}
                      >
                        {zoneById(tie.fromZone)?.name}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">To</th>
                    <td>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setSelectedZone(tie.toZone)}
                      >
                        {zoneById(tie.toZone)?.name}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Transfer</th>
                    <td className="mono" style={{ color: 'var(--highlight)' }}>
                      {tie.transferMw.toLocaleString()} MW
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Type</th>
                    <td>{tie.kind.toUpperCase()}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : zone ? (
            <>
              <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                {zone.name}
              </h3>
              <span
                className="fbal-badge"
                style={{ background: `${zone.color}22`, color: zone.color }}
              >
                {zone.kind} · {zone.interconnect}
              </span>
              <p className="sub" style={{ maxWidth: 'none', fontSize: '0.82rem', marginTop: 8 }}>
                {zone.note}
              </p>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Peak (sample)</th>
                    <td className="mono">{zone.peakGw} GW</td>
                  </tr>
                  <tr>
                    <th scope="row">States</th>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>
                      {zone.states.join(' ')}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Utilities mapped</th>
                    <td className="mono">{utilitiesInZone(zone.id).length}</td>
                  </tr>
                  <tr>
                    <th scope="row">Interties</th>
                    <td className="mono">
                      {intertiesForZone(zone.id).filter((t) => t.fromZone !== t.toZone).length}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="kicker" style={{ marginTop: 12 }}>
                Utilities in zone
              </p>
              <ul className="gmap-actions">
                {utilitiesInZone(zone.id)
                  .filter((u) => u.kind !== 'iso')
                  .slice(0, 8)
                  .map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setSelectedUtil(u.id)}
                      >
                        {u.short}
                        {(u.alsoZones?.length ?? 0) > 0 ? ' · multi-zone' : ''}
                      </button>
                    </li>
                  ))}
              </ul>
              <p className="kicker" style={{ marginTop: 12 }}>
                Connected via
              </p>
              <ul className="gmap-actions">
                {intertiesForZone(zone.id)
                  .filter((t) => t.fromZone !== t.toZone)
                  .map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setSelectedTie(t.id)}
                      >
                        {t.name} · {(t.transferMw / 1000).toFixed(1)} GW
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <p className="sub">Click a zone, utility, or intertie line.</p>
          )}
        </aside>
      </div>

      <div className="fbal-intel">
        <div>
          <p className="kicker">Zones</p>
          <ol className="ov-rank-list">
            {zones.map((z, i) => (
              <li key={z.id}>
                <button
                  type="button"
                  className="ov-rank-btn"
                  onClick={() => {
                    setSelectedZone(z.id)
                    setSelectedUtil(null)
                    setSelectedTie(null)
                  }}
                >
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <i
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: z.color,
                        marginRight: 6,
                      }}
                    />
                    <strong>{z.short}</strong>
                  </span>
                  <span className="mono">{z.peakGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="kicker">Multi-zone utilities (overlap)</p>
          <ol className="ov-rank-list">
            {overlaps.slice(0, 10).map((u, i) => (
              <li key={u.id}>
                <button
                  type="button"
                  className="ov-rank-btn"
                  onClick={() => {
                    setMode('overlaps')
                    setSelectedUtil(u.id)
                    setSelectedZone(u.zoneId)
                  }}
                >
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{u.short}</strong>
                  </span>
                  <span className="mono" style={{ fontSize: '0.7rem' }}>
                    {u.zoneId}
                    {u.alsoZones?.length ? `+${u.alsoZones.length}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="kicker">Largest interties</p>
          <ol className="ov-rank-list">
            {[...GRID_INTERTIES]
              .filter((t) => t.fromZone !== t.toZone)
              .sort((a, b) => b.transferMw - a.transferMw)
              .slice(0, 8)
              .map((t, i) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="ov-rank-btn"
                    onClick={() => {
                      setMode('interties')
                      setSelectedTie(t.id)
                      setSelectedZone(t.fromZone)
                    }}
                  >
                    <span className="mono muted">{i + 1}</span>
                    <span className="ov-rank-name">
                      <strong>{t.name.slice(0, 28)}</strong>
                    </span>
                    <span className="mono">{(t.transferMw / 1000).toFixed(1)} GW</span>
                  </button>
                </li>
              ))}
          </ol>
        </div>
      </div>

      <p className="footer-line">
        Grid division · Eastern · Western · Texas · ISO/RTO · utility overlap · interties ·
        schematic for education
      </p>
    </div>
  )
}
