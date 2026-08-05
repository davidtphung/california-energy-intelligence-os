/**
 * Intelligent future balance map — demand, firm supply, deficit / surplus by state.
 */

import { useMemo, useState } from 'react'
import { projectUS, US_STATES } from '../../data/usStates'
import {
  BALANCE_YEARS,
  balanceColor,
  balancesForYear,
  intelligenceBlurb,
  nationalBalance,
  topDeficitStates,
  topSurplusStates,
  type BalanceYear,
  type StateBalance,
} from '../../data/energyBalanceFuture'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'
import { Download } from 'lucide-react'

const W = 1100
const H = 620

export function FutureBalanceMap() {
  const { theme, openStateDetail } = useApp()
  const dark = theme === 'dark'
  const [year, setYear] = useState<BalanceYear>(2035)
  const [selected, setSelected] = useState<string | null>('TX')
  const [hover, setHover] = useState<string | null>(null)
  const [view, setView] = useState<'deficit' | 'demand' | 'supply'>('deficit')

  const rows = useMemo(() => balancesForYear(year), [year])
  const nat = useMemo(() => nationalBalance(year), [year])
  const tips = useMemo(() => intelligenceBlurb(year), [year])
  const deficits = useMemo(() => topDeficitStates(year, 8), [year])
  const surplus = useMemo(() => topSurplusStates(year, 6), [year])

  const focus =
    rows.find((r) => r.abbr === (hover ?? selected)) ??
    rows.find((r) => r.abbr === selected) ??
    null

  const maxDemand = Math.max(...rows.map((r) => r.demandGw), 1)
  const maxAbs = Math.max(...rows.map((r) => Math.max(r.deficitGw, r.surplusGw)), 1)

  const radiusFor = (r: StateBalance) => {
    if (view === 'demand') return 5 + Math.sqrt(r.demandGw / maxDemand) * 28
    if (view === 'supply') return 5 + Math.sqrt(r.supplyGw / maxDemand) * 26
    // deficit view: size by |balance|
    const mag = Math.max(r.deficitGw, r.surplusGw, 0.3)
    return 5 + Math.sqrt(mag / maxAbs) * 30
  }

  const ordered = useMemo(
    () => [...rows].sort((a, b) => b.demandGw - a.demandGw),
    [rows]
  )

  return (
    <div className="fbal mapcentric">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Intelligent map · future balance</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            Projected demand, supply &amp; deficit
          </h2>
          <p className="mapcentric-lede">
            Peak demand vs firm supply through {BALANCE_YEARS[BALANCE_YEARS.length - 1]}. Red =
            shortfall · green/blue = surplus. Sample trajectories — not official IRPs.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Demand</span>
            <strong>
              {nat.demandGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Firm supply</span>
            <strong>
              {nat.firmGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Deficit</span>
            <strong style={{ color: nat.deficitGw > 30 ? 'var(--danger)' : undefined }}>
              {nat.deficitGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>States short</span>
            <strong>{nat.statesDeficit}</strong>
          </div>
        </div>
      </header>

      <div className="fbal-controls">
        <div className="gmap-mode">
          {(['deficit', 'demand', 'supply'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={view === v ? 'is-on' : ''}
              onClick={() => setView(v)}
            >
              {v === 'deficit' ? 'Deficit / surplus' : v === 'demand' ? 'Demand' : 'Supply'}
            </button>
          ))}
        </div>
        <label className="fbal-year">
          <span>Horizon {year}</span>
          <input
            type="range"
            min={0}
            max={BALANCE_YEARS.length - 1}
            value={BALANCE_YEARS.indexOf(year)}
            onChange={(e) => setYear(BALANCE_YEARS[Number(e.target.value)])}
          />
          <div className="fbal-year-ticks">
            {BALANCE_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                className={y === year ? 'is-on' : ''}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </label>
        <button
          type="button"
          className="gmap-icon-btn"
          title="Export CSV"
          onClick={() =>
            exportCsv(
              rows.map((r) => ({
                year: r.year,
                state: r.abbr,
                demand_gw: r.demandGw,
                supply_gw: r.supplyGw,
                firm_gw: r.firmGw,
                deficit_gw: r.deficitGw,
                surplus_gw: r.surplusGw,
                reserve_pct: r.reservePct,
                status: r.status,
              })),
              `us-energy-balance-${year}.csv`
            )
          }
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="fbal-summary">{nat.summary}</p>

      <div className={`mapcentric-stage${focus ? ' has-drawer' : ''}`}>
        <div className="mapcentric-map fbal-map">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="fbal-svg"
            role="img"
            aria-label={`US energy balance map for ${year}`}
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="28" fill="var(--mute)" fontSize="12" fontFamily="var(--font-mono)">
              {year} · {view === 'deficit' ? 'deficit (red) / surplus (green)' : view} · GW peak
            </text>

            {/* Soft land */}
            <path
              d="M 60 90 L 120 55 L 220 42 L 340 40 L 480 50 L 600 70 L 700 110 L 760 170 L 780 240 L 760 310 L 700 360 L 600 385 L 480 390 L 360 380 L 240 360 L 140 320 L 80 250 L 55 170 Z"
              fill="var(--fill)"
              stroke="var(--line-soft)"
              strokeWidth={1}
              opacity={0.7}
            />

            {ordered.map((r) => {
              const { x, y } = projectUS(r.lon, r.lat, W, H)
              const rad = radiusFor(r)
              const fill = balanceColor(r, dark)
              const on = r.abbr === selected || r.abbr === hover
              return (
                <g
                  key={r.abbr}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover(r.abbr)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(r.abbr)}
                >
                  {/* Demand ring vs firm core for dual encoding in deficit mode */}
                  {view === 'deficit' && (
                    <circle
                      r={rad + 3}
                      fill="none"
                      stroke={r.deficitGw > 0 ? (dark ? '#fb7185' : '#e11d48') : (dark ? '#38bdf8' : '#0284c7')}
                      strokeWidth={1.2}
                      strokeOpacity={0.35}
                    />
                  )}
                  <circle
                    r={rad}
                    fill={fill}
                    fillOpacity={on ? 0.95 : 0.78}
                    stroke={on ? 'var(--highlight)' : 'var(--bg)'}
                    strokeWidth={on ? 2 : 0.8}
                  />
                  {(on || rad > 14) && (
                    <text
                      y={4}
                      textAnchor="middle"
                      fill="var(--highlight)"
                      fontSize={10}
                      fontWeight={600}
                      fontFamily="var(--font-sans)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {r.abbr}
                    </text>
                  )}
                  <title>
                    {r.name} {year}: demand {r.demandGw.toFixed(1)} GW · firm {r.firmGw.toFixed(1)} GW
                    · {r.deficitGw > 0 ? `deficit ${r.deficitGw.toFixed(1)}` : `surplus ${r.surplusGw.toFixed(1)}`}{' '}
                    GW
                  </title>
                </g>
              )
            })}

            {/* Legend */}
            <g transform={`translate(24, ${H - 52})`}>
              <text fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                surplus
              </text>
              {['#22c55e', '#ca8a04', '#ea580c', '#e11d48'].map((c, i) => (
                <rect key={c} x={52 + i * 28} y={-10} width={28} height={8} fill={c} />
              ))}
              <text x={52 + 4 * 28 + 8} fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                critical deficit · size = {view}
              </text>
            </g>
          </svg>
        </div>

        {focus && (
          <aside className="mapcentric-drawer">
            <p className="kicker">From map · {year}</p>
            <h3 className="page-h2" style={{ fontSize: '1.15rem' }}>
              {focus.name}{' '}
              <span className="mono muted" style={{ fontSize: '0.85rem' }}>
                {focus.abbr}
              </span>
            </h3>
            <span className={`fbal-badge ${focus.status}`}>{focus.status}</span>

            <div className="fbal-meter" aria-hidden>
              <div className="fbal-meter-row">
                <span>Demand</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill demand"
                    style={{ width: `${Math.min(100, (focus.demandGw / Math.max(focus.supplyGw, focus.demandGw, 1)) * 100)}%` }}
                  />
                </div>
                <span className="mono">{focus.demandGw.toFixed(1)} GW</span>
              </div>
              <div className="fbal-meter-row">
                <span>Firm</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill firm"
                    style={{ width: `${Math.min(100, (focus.firmGw / Math.max(focus.supplyGw, focus.demandGw, 1)) * 100)}%` }}
                  />
                </div>
                <span className="mono">{focus.firmGw.toFixed(1)} GW</span>
              </div>
              <div className="fbal-meter-row">
                <span>Nameplate</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill supply"
                    style={{ width: '100%' }}
                  />
                </div>
                <span className="mono">{focus.supplyGw.toFixed(1)} GW</span>
              </div>
            </div>

            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Balance</th>
                  <td className="mono" style={{ color: focus.deficitGw > 0 ? 'var(--danger)' : 'var(--ok)' }}>
                    {focus.deficitGw > 0
                      ? `−${focus.deficitGw.toFixed(1)} GW short`
                      : `+${focus.surplusGw.toFixed(1)} GW surplus`}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Reserve</th>
                  <td className="mono">{focus.reservePct.toFixed(0)}%</td>
                </tr>
                <tr>
                  <th scope="row">Grid</th>
                  <td>{focus.grid}</td>
                </tr>
              </tbody>
            </table>

            <p className="kicker" style={{ marginTop: 12 }}>
              Drivers
            </p>
            <ul className="gmap-actions">
              {focus.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>

            <button
              type="button"
              className="gmap-compare-btn"
              style={{ marginTop: 12 }}
              onClick={() => openStateDetail(focus.abbr)}
            >
              Open {focus.abbr} energy page
            </button>
          </aside>
        )}
      </div>

      <div className="fbal-intel">
        <div>
          <p className="kicker">Intelligence</p>
          <ul className="gmap-actions">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="kicker">Largest deficits {year}</p>
          <ol className="ov-rank-list">
            {deficits.map((r, i) => (
              <li key={r.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => setSelected(r.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{r.abbr}</strong> {r.name}
                  </span>
                  <span className="mono" style={{ color: 'var(--danger)' }}>
                    −{r.deficitGw.toFixed(1)} GW
                  </span>
                </button>
              </li>
            ))}
            {deficits.length === 0 && (
              <li className="muted" style={{ fontSize: '0.8rem' }}>
                No state-level firm deficits in sample path.
              </li>
            )}
          </ol>
        </div>
        <div>
          <p className="kicker">Largest surplus {year}</p>
          <ol className="ov-rank-list">
            {surplus.map((r, i) => (
              <li key={r.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => setSelected(r.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{r.abbr}</strong>
                  </span>
                  <span className="mono" style={{ color: 'var(--ok)' }}>
                    +{r.surplusGw.toFixed(1)} GW
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="footer-line">
        Future balance · {US_STATES.length} jurisdictions · peak demand vs firm supply · sample path
        · pair with Scenario planner for IRP-style cases
      </p>
    </div>
  )
}
