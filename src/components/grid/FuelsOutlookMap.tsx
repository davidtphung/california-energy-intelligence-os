/**
 * Fuels / gas map: state production, LNG terminals, thesis hubs,
 * and EIA STEO vs Got Gas comparison. Sample path, not NGM live.
 */

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { projectUS } from '../../data/usStates'
import {
  CHRONOMETER_COMPARE,
  LNG_SITES,
  STEO_LEDGER,
  fuelStateRows,
  fuelStateTotalBcf,
  lngByStatus,
  lngPathChart,
  lngStatusColor,
  productionColor,
  steoVsChronometerChart,
  thesisHubs,
  type FuelMapMode,
  type FuelStateRow,
  type LngSite,
} from '../../data/fuelOutlook'
import { hubColor, type ThesisHub } from '../../data/gasThesisPapers'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'
import { UsBasemap } from './UsBasemap'
import { FossilFuelsPanel } from '../panels/FossilFuelsPanel'

const W = 1100
const H = 620

type Section = 'map' | 'history'
type Focus =
  | { kind: 'state'; id: string }
  | { kind: 'lng'; id: string }
  | { kind: 'hub'; id: string }
  | null

function modeLabel(mode: FuelMapMode): string {
  if (mode === 'production') return 'State dry gas'
  if (mode === 'lng') return 'LNG terminals'
  if (mode === 'hubs') return 'Thesis hubs'
  return 'STEO vs thesis'
}

export function FuelsOutlookMap() {
  const { theme, openStateDetail, setView } = useApp()
  const dark = theme === 'dark'
  const [section, setSection] = useState<Section>('map')
  const [mode, setMode] = useState<FuelMapMode>('production')
  const [focus, setFocus] = useState<Focus>({ kind: 'state', id: 'TX' })
  const [hover, setHover] = useState<Focus>(null)

  const states = useMemo(() => fuelStateRows(), [])
  const lng = useMemo(() => lngByStatus(), [])
  const hubs = useMemo(() => thesisHubs(), [])
  const totalBcf = useMemo(() => fuelStateTotalBcf(states), [states])
  const prodColor = productionColor(dark)
  const compareChart = useMemo(() => steoVsChronometerChart(), [])
  const lngChart = useMemo(() => lngPathChart(), [])

  const active = hover ?? focus

  const selectedState: FuelStateRow | null =
    active?.kind === 'state' ? (states.find((s) => s.abbr === active.id) ?? null) : null
  const selectedLng: LngSite | null =
    active?.kind === 'lng' ? (LNG_SITES.find((t) => t.id === active.id) ?? null) : null
  const selectedHub: ThesisHub | null =
    active?.kind === 'hub' ? (hubs.find((h) => h.id === active.id) ?? null) : null

  const maxProd = Math.max(...states.map((s) => s.productionBcf), 1)
  const maxLng = Math.max(...LNG_SITES.map((t) => t.capacityBcfd), 1)

  const tipStyle = {
    background: dark ? '#0f172a' : '#fff',
    border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 8,
    fontSize: 12,
  }

  const exportAll = () => {
    exportCsv(
      [
        ...states.map((s) => ({
          kind: 'state_production',
          id: s.abbr,
          name: s.name,
          value: s.productionBcf,
          unit: 'Bcf/yr',
          share_pct: s.sharePct,
          yoy_pct: s.yoyPct,
          region: s.region,
          note: s.note,
        })),
        ...LNG_SITES.map((t) => ({
          kind: 'lng_terminal',
          id: t.id,
          name: t.name,
          value: t.capacityBcfd,
          unit: 'Bcf/d',
          share_pct: '',
          yoy_pct: '',
          region: `${t.stateAbbr} · ${t.coast}`,
          note: t.status,
        })),
        ...hubs.map((h) => ({
          kind: 'thesis_hub',
          id: h.id,
          name: h.label,
          value: h.weight,
          unit: 'weight',
          share_pct: '',
          yoy_pct: '',
          region: h.kind,
          note: h.note,
        })),
      ],
      'eis-fuels-outlook.csv'
    )
  }

  if (section === 'history') {
    return (
      <div className="fbal mapcentric fuels-outlook">
        <div className="gmap-mode" role="tablist" aria-label="Fuels section" style={{ marginBottom: '0.75rem' }}>
          <button type="button" onClick={() => setSection('map')}>
            Map
          </button>
          <button type="button" className="is-on">
            History
          </button>
        </div>
        <FossilFuelsPanel />
      </div>
    )
  }

  return (
    <div className="fbal mapcentric fuels-outlook">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Fuels · gas · STEO · LNG</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            U.S. fuels outlook
          </h2>
          <p className="mapcentric-lede">
            State dry-gas production, Gulf and Atlantic LNG nameplate, and the geography behind
            Got Gas. Official near-term ledger is EIA STEO / Today in Energy 67944. 2030 shortage
            arithmetic is the Chronometer digest. Sample path, not Natural Gas Monthly live.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>STEO 2026</span>
            <strong style={{ color: prodColor }}>
              {STEO_LEDGER.marketed2026Bcfd}
              <em>Bcf/d</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>LNG 3Q26</span>
            <strong style={{ color: dark ? '#38bdf8' : '#0369a1' }}>
              {STEO_LEDGER.lng3q26Bcfd}
              <em>Bcf/d</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>End-Oct stocks</span>
            <strong>
              {STEO_LEDGER.storageEndOctBcf.toLocaleString()}
              <em>Bcf</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Thesis 2030 gap</span>
            <strong style={{ color: 'var(--danger)' }}>
              {CHRONOMETER_COMPARE.deficit2030Bcfd}
              <em>Bcf/d</em>
            </strong>
          </div>
        </div>
      </header>

      <div className="fbal-controls">
        <div className="gmap-mode" role="tablist" aria-label="Fuels section">
          <button type="button" className="is-on" onClick={() => setSection('map')}>
            Map
          </button>
          <button type="button" onClick={() => setSection('history')}>
            History
          </button>
        </div>
        <div className="gmap-mode" role="tablist" aria-label="Fuels map layer">
          {(
            [
              ['production', 'Production'],
              ['lng', 'LNG'],
              ['hubs', 'Thesis hubs'],
              ['compare', 'STEO vs thesis'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={mode === id ? 'is-on' : ''}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="gmap-icon-btn" title="Export CSV" onClick={exportAll}>
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="fbal-summary">
        {STEO_LEDGER.note} Growth in the official brief is {STEO_LEDGER.growthBasins}.{' '}
        <a href={STEO_LEDGER.url} target="_blank" rel="noopener noreferrer">
          EIA TIE 67944
        </a>
        .
      </p>

      <section className="fbal-timeline demand-charts" aria-label="STEO versus thesis charts">
        <div className="demand-chart-grid">
          <div className="demand-chart-card">
            <p className="kicker">Marketed gas Bcf/d · STEO vs thesis now / 2030 max</p>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={compareChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={40} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="steo" name="EIA STEO" fill={prodColor} radius={[2, 2, 0, 0]} />
                  <Bar
                    dataKey="thesis"
                    name="Got Gas"
                    fill={dark ? '#f97316' : '#c2410c'}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="demand-chart-card">
            <p className="kicker">LNG Bcf/d · STEO 3Q26 between thesis now and 2030</p>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={lngChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--mute)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--mute)" width={36} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="bcfd" name="Bcf/d" fill={dark ? '#38bdf8' : '#0369a1'} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <div className={`mapcentric-stage${active ? ' has-drawer' : ''}`}>
        <div className="mapcentric-map fbal-map">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="fbal-svg"
            role="img"
            aria-label={`US fuels map ${modeLabel(mode)}`}
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="28" fill="var(--mute)" fontSize="12" fontFamily="var(--font-mono)">
              {modeLabel(mode)} · bubble size = magnitude
            </text>

            <UsBasemap w={W} h={H} />

            {(mode === 'production' || mode === 'compare') &&
              states.map((r) => {
                const { x, y } = projectUS(r.lon, r.lat, W, H)
                const rad = 6 + Math.sqrt(r.productionBcf / maxProd) * 28
                const on = active?.kind === 'state' && active.id === r.abbr
                return (
                  <g
                    key={r.abbr}
                    transform={`translate(${x},${y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHover({ kind: 'state', id: r.abbr })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setFocus({ kind: 'state', id: r.abbr })}
                  >
                    <circle
                      r={rad}
                      fill={prodColor}
                      fillOpacity={on ? 0.95 : 0.72}
                      stroke={on ? 'var(--highlight)' : 'var(--bg)'}
                      strokeWidth={on ? 2 : 0.8}
                    />
                    <text
                      y={4}
                      textAnchor="middle"
                      fill={on || rad > 14 ? 'var(--highlight)' : 'var(--mute)'}
                      fontSize={on || rad > 14 ? 10 : 8}
                      fontWeight={600}
                      fontFamily="var(--font-sans)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {r.abbr}
                    </text>
                    <title>
                      {r.name}: {r.productionBcf.toLocaleString()} Bcf/yr · {r.sharePct}% US
                    </title>
                  </g>
                )
              })}

            {(mode === 'lng' || mode === 'compare') &&
              LNG_SITES.map((t) => {
                const { x, y } = projectUS(t.lon, t.lat, W, H)
                const rad = 5 + Math.sqrt(t.capacityBcfd / maxLng) * 16
                const on = active?.kind === 'lng' && active.id === t.id
                return (
                  <g
                    key={t.id}
                    transform={`translate(${x},${y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHover({ kind: 'lng', id: t.id })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setFocus({ kind: 'lng', id: t.id })}
                  >
                    <rect
                      x={-rad}
                      y={-rad}
                      width={rad * 2}
                      height={rad * 2}
                      rx={2}
                      fill={lngStatusColor(t.status, dark)}
                      fillOpacity={on ? 0.95 : 0.82}
                      stroke={on ? 'var(--highlight)' : 'var(--bg)'}
                      strokeWidth={on ? 2 : 0.8}
                    />
                    <title>
                      {t.name} · {t.capacityBcfd} Bcf/d · {t.status}
                    </title>
                  </g>
                )
              })}

            {(mode === 'hubs' || mode === 'compare') &&
              hubs.map((h) => {
                const { x, y } = projectUS(h.lon, h.lat, W, H)
                const rad = 8 + (h.weight / 100) * 10
                const on = active?.kind === 'hub' && active.id === h.id
                return (
                  <g
                    key={h.id}
                    transform={`translate(${x},${y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHover({ kind: 'hub', id: h.id })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setFocus({ kind: 'hub', id: h.id })}
                  >
                    <circle
                      r={rad}
                      fill="none"
                      stroke={hubColor(h.kind)}
                      strokeWidth={on ? 2.4 : 1.6}
                    />
                    <circle r={3.2} fill={hubColor(h.kind)} />
                    <text
                      y={rad + 12}
                      textAnchor="middle"
                      fill="var(--mute)"
                      fontSize={9}
                      fontFamily="var(--font-sans)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {h.label}
                    </text>
                    <title>
                      {h.label} · {h.kind} · {h.note}
                    </title>
                  </g>
                )
              })}

            <g transform={`translate(24, ${H - 48})`}>
              <text fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                {mode === 'production' && 'green = dry gas Bcf/yr by state'}
                {mode === 'lng' &&
                  'squares = LNG nameplate · blue operating · amber under construction · lime proposed'}
                {mode === 'hubs' &&
                  'rings = thesis geography · basin / LNG / load / storage / power'}
                {mode === 'compare' &&
                  'circles = production · squares = LNG · rings = Got Gas hubs'}
              </text>
            </g>
          </svg>
        </div>

        {selectedState && (
          <aside className="mapcentric-drawer">
            <p className="kicker">
              Production · {selectedState.region}
            </p>
            <h3 className="page-h2" style={{ fontSize: '1.15rem' }}>
              {selectedState.name}{' '}
              <span className="mono muted" style={{ fontSize: '0.85rem' }}>
                {selectedState.abbr}
              </span>
            </h3>
            <p className="sub" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {selectedState.note}
            </p>
            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Dry gas sample</th>
                  <td className="mono">{selectedState.productionBcf.toLocaleString()} Bcf/yr</td>
                </tr>
                <tr>
                  <th scope="row">US share</th>
                  <td className="mono">{selectedState.sharePct}%</td>
                </tr>
                <tr>
                  <th scope="row">YoY</th>
                  <td className="mono">
                    {selectedState.yoyPct > 0 ? '+' : ''}
                    {selectedState.yoyPct}%
                  </td>
                </tr>
                <tr>
                  <th scope="row">Mapped total</th>
                  <td className="mono">{totalBcf.toLocaleString()} Bcf/yr</td>
                </tr>
              </tbody>
            </table>
            <div className="btn-row" style={{ marginTop: '0.85rem' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => openStateDetail(selectedState.abbr)}
              >
                Open {selectedState.abbr} catalog
              </button>
            </div>
          </aside>
        )}

        {selectedLng && (
          <aside className="mapcentric-drawer">
            <p className="kicker">
              LNG · {selectedLng.coast} · {selectedLng.stateAbbr}
            </p>
            <h3 className="page-h2" style={{ fontSize: '1.15rem' }}>
              {selectedLng.name}
            </h3>
            <p className="sub" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Nameplate sample. Status is operating, under construction, or proposed. STEO 3Q26
              LNG is {STEO_LEDGER.lng3q26Bcfd} Bcf/d nationally (Freeport maintenance in the brief).
            </p>
            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Capacity</th>
                  <td className="mono">{selectedLng.capacityBcfd} Bcf/d</td>
                </tr>
                <tr>
                  <th scope="row">Status</th>
                  <td>{selectedLng.status.replace('-', ' ')}</td>
                </tr>
                <tr>
                  <th scope="row">Operating book</th>
                  <td className="mono">{lng.operatingBcfd.toFixed(1)} Bcf/d</td>
                </tr>
                <tr>
                  <th scope="row">Under construction</th>
                  <td className="mono">{lng.constructionBcfd.toFixed(1)} Bcf/d</td>
                </tr>
              </tbody>
            </table>
            <div className="btn-row" style={{ marginTop: '0.85rem' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => openStateDetail(selectedLng.stateAbbr)}
              >
                Open {selectedLng.stateAbbr} catalog
              </button>
            </div>
          </aside>
        )}

        {selectedHub && (
          <aside className="mapcentric-drawer">
            <p className="kicker">Thesis hub · {selectedHub.kind}</p>
            <h3 className="page-h2" style={{ fontSize: '1.15rem' }}>
              {selectedHub.label}
            </h3>
            <p className="sub" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {selectedHub.note}
            </p>
            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Weight</th>
                  <td className="mono">{selectedHub.weight}</td>
                </tr>
                <tr>
                  <th scope="row">Thesis 2030 LNG</th>
                  <td className="mono">{CHRONOMETER_COMPARE.lng2030Bcfd} Bcf/d</td>
                </tr>
                <tr>
                  <th scope="row">Thesis deficit</th>
                  <td className="mono">{CHRONOMETER_COMPARE.deficit2030Bcfd} Bcf/d</td>
                </tr>
                <tr>
                  <th scope="row">Days-to-cover 2030</th>
                  <td className="mono">{CHRONOMETER_COMPARE.storageDays2030}</td>
                </tr>
              </tbody>
            </table>
            <div className="btn-row" style={{ marginTop: '0.85rem' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setView('thesis')
                  window.history.replaceState(null, '', '#thesis')
                }}
              >
                Open Thesis library
              </button>
            </div>
          </aside>
        )}
      </div>

      <section className="table-wrap" style={{ marginTop: '1rem' }} aria-label="Fuels table">
        {mode === 'lng' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Terminal</th>
                <th>State</th>
                <th>Coast</th>
                <th>Status</th>
                <th>Bcf/d</th>
              </tr>
            </thead>
            <tbody>
              {[...LNG_SITES]
                .sort((a, b) => b.capacityBcfd - a.capacityBcfd)
                .map((t) => (
                  <tr
                    key={t.id}
                    className={focus?.kind === 'lng' && focus.id === t.id ? 'is-on' : undefined}
                    onClick={() => setFocus({ kind: 'lng', id: t.id })}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{t.name}</td>
                    <td>{t.stateAbbr}</td>
                    <td>{t.coast}</td>
                    <td>{t.status.replace('-', ' ')}</td>
                    <td className="mono">{t.capacityBcfd.toFixed(1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : mode === 'hubs' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hub</th>
                <th>Kind</th>
                <th>Weight</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {[...hubs]
                .sort((a, b) => b.weight - a.weight)
                .map((h) => (
                  <tr
                    key={h.id}
                    className={focus?.kind === 'hub' && focus.id === h.id ? 'is-on' : undefined}
                    onClick={() => setFocus({ kind: 'hub', id: h.id })}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{h.label}</td>
                    <td>{h.kind}</td>
                    <td className="mono">{h.weight}</td>
                    <td>{h.note}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Bcf/yr</th>
                <th>Share</th>
                <th>YoY</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {states.map((s) => (
                <tr
                  key={s.abbr}
                  className={focus?.kind === 'state' && focus.id === s.abbr ? 'is-on' : undefined}
                  onClick={() => setFocus({ kind: 'state', id: s.abbr })}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    {s.name} <span className="mono muted">{s.abbr}</span>
                  </td>
                  <td className="mono">{s.productionBcf.toLocaleString()}</td>
                  <td className="mono">{s.sharePct}%</td>
                  <td className="mono">
                    {s.yoyPct > 0 ? '+' : ''}
                    {s.yoyPct}%
                  </td>
                  <td>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
