/**
 * Map and predict future firm-capacity deficits by state and scenario.
 */

import { useMemo, useState } from 'react'
import { projectUS, US_STATES } from '../../data/usStates'
import {
  BALANCE_YEARS,
  SCENARIO_META,
  balanceColor,
  balanceTimeline,
  balancesForYear,
  intelligenceBlurb,
  nationalBalance,
  predictDeficits,
  statesEnteringDeficit,
  topDeficitStates,
  type BalanceYear,
  type ForecastScenario,
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
  const [scenario, setScenario] = useState<ForecastScenario>('base')
  const [selected, setSelected] = useState<string | null>('TX')
  const [hover, setHover] = useState<string | null>(null)
  const [view, setView] = useState<'deficit' | 'demand' | 'supply' | 'onset'>('deficit')

  const rows = useMemo(() => balancesForYear(year, scenario), [year, scenario])
  const nat = useMemo(() => nationalBalance(year, scenario), [year, scenario])
  const timeline = useMemo(() => balanceTimeline(scenario), [scenario])
  const tips = useMemo(() => intelligenceBlurb(year, scenario), [year, scenario])
  const deficits = useMemo(() => topDeficitStates(year, 10, scenario), [year, scenario])
  const predictions = useMemo(() => predictDeficits(scenario), [scenario])
  const entering = useMemo(() => statesEnteringDeficit(year, scenario), [year, scenario])

  const focus =
    rows.find((r) => r.abbr === (hover ?? selected)) ??
    rows.find((r) => r.abbr === selected) ??
    null

  const focusPred = focus ? predictions.find((p) => p.abbr === focus.abbr) : null

  const maxDemand = Math.max(...rows.map((r) => r.demandGw), 1)
  const maxDeficit = Math.max(...rows.map((r) => r.deficitGw), 0.5)
  const maxAbs = Math.max(...rows.map((r) => Math.max(r.deficitGw, r.surplusGw)), 1)
  const maxTimelineDef = Math.max(...timeline.map((t) => t.deficitGw), 1)

  const radiusFor = (r: StateBalance) => {
    if (view === 'demand') return 5 + Math.sqrt(r.demandGw / maxDemand) * 28
    if (view === 'supply') return 5 + Math.sqrt(r.firmGw / maxDemand) * 26
    if (view === 'onset') {
      const p = predictions.find((x) => x.abbr === r.abbr)
      if (!p?.firstDeficitYear) return 6
      const idx = BALANCE_YEARS.indexOf(p.firstDeficitYear)
      return 8 + (BALANCE_YEARS.length - idx) * 4
    }
    const mag = Math.max(r.deficitGw, r.surplusGw * 0.35, 0.3)
    return 5 + Math.sqrt(mag / maxAbs) * 32
  }

  const ordered = useMemo(() => {
    if (view === 'deficit' || view === 'onset') {
      return [...rows].sort((a, b) => b.deficitGw - a.deficitGw)
    }
    return [...rows].sort((a, b) => b.demandGw - a.demandGw)
  }, [rows, view])

  const exportAll = () => {
    const flat: Record<string, unknown>[] = []
    for (const y of BALANCE_YEARS) {
      for (const r of balancesForYear(y, scenario)) {
        flat.push({
          scenario,
          year: r.year,
          state: r.abbr,
          demand_gw: r.demandGw,
          firm_gw: r.firmGw,
          supply_gw: r.supplyGw,
          deficit_gw: r.deficitGw,
          surplus_gw: r.surplusGw,
          reserve_pct: r.reservePct,
          deficit_delta_gw: r.deficitDeltaGw,
          status: r.status,
        })
      }
    }
    exportCsv(flat, `us-deficit-forecast-${scenario}.csv`)
  }

  return (
    <div className="fbal mapcentric">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Predict · map deficits</p>
          <h2 className="page-h2" style={{ marginBottom: 4 }}>
            Future firm-capacity deficits
          </h2>
          <p className="mapcentric-lede">
            Peak demand vs firm supply through {BALANCE_YEARS[BALANCE_YEARS.length - 1]}. Map shortfalls
            by year and stress case. Red = deficit · green = surplus. Sample path (not official IRP).
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Demand {year}</span>
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
            <span>Predicted deficit</span>
            <strong style={{ color: nat.deficitGw > 20 ? 'var(--danger)' : undefined }}>
              {nat.deficitGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>States short</span>
            <strong>
              {nat.statesDeficit}
              <em>/{US_STATES.length}</em>
            </strong>
          </div>
        </div>
      </header>

      {/* Scenario + map metric + year */}
      <div className="fbal-controls">
        <div className="gmap-mode" role="tablist" aria-label="Forecast scenario">
          {SCENARIO_META.map((s) => (
            <button
              key={s.id}
              type="button"
              className={scenario === s.id ? 'is-on' : ''}
              title={s.note}
              onClick={() => setScenario(s.id)}
            >
              {s.short}
            </button>
          ))}
        </div>
        <div className="gmap-mode">
          {(
            [
              ['deficit', 'Map deficit'],
              ['onset', 'First short year'],
              ['demand', 'Demand'],
              ['supply', 'Firm supply'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={view === id ? 'is-on' : ''}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="gmap-icon-btn" title="Export all years CSV" onClick={exportAll}>
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="fbal-summary">
        {SCENARIO_META.find((s) => s.id === scenario)?.note} {nat.summary}
      </p>

      {/* National deficit timeline */}
      <section className="fbal-timeline" aria-label="National deficit by year">
        <p className="kicker">National predicted deficit by year ({SCENARIO_META.find((s) => s.id === scenario)?.label})</p>
        <div className="fbal-timeline-bars">
          {timeline.map((t) => {
            const h = Math.max(4, (t.deficitGw / maxTimelineDef) * 72)
            const on = t.year === year
            return (
              <button
                key={t.year}
                type="button"
                className={`fbal-tl-col${on ? ' is-on' : ''}`}
                onClick={() => setYear(t.year as BalanceYear)}
                title={`${t.year}: ${t.deficitGw.toFixed(0)} GW deficit · ${t.statesDeficit} states short`}
              >
                <span className="fbal-tl-val mono">{t.deficitGw.toFixed(0)}</span>
                <span
                  className="fbal-tl-bar"
                  style={{
                    height: h,
                    background:
                      t.deficitGw > 80 ? 'var(--danger)' : t.deficitGw > 30 ? '#ea580c' : '#ca8a04',
                  }}
                />
                <span className="fbal-tl-year mono">{t.year}</span>
                <span className="fbal-tl-states muted">{t.statesDeficit} short</span>
              </button>
            )
          })}
        </div>
      </section>

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

      {entering.length > 0 && (
        <p className="fbal-entering">
          <strong>New deficits in {year}:</strong>{' '}
          {entering
            .slice(0, 12)
            .map((e) => e.abbr)
            .join(' · ')}
          {entering.length > 12 ? ` +${entering.length - 12}` : ''}
        </p>
      )}

      <div className={`mapcentric-stage${focus ? ' has-drawer' : ''}`}>
        <div className="mapcentric-map fbal-map">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="fbal-svg"
            role="img"
            aria-label={`US predicted deficit map for ${year}`}
          >
            <rect width={W} height={H} fill="var(--bg-soft)" />
            <text x="24" y="28" fill="var(--mute)" fontSize="12" fontFamily="var(--font-mono)">
              {year} · {scenario} ·{' '}
              {view === 'deficit'
                ? 'predicted deficit GW (red) / surplus (green)'
                : view === 'onset'
                  ? 'size = earlier first-deficit year'
                  : view}{' '}
              · firm peak
            </text>

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
              const pred = predictions.find((p) => p.abbr === r.abbr)
              const showDefLabel =
                view === 'deficit' && r.deficitGw >= 1 && (on || r.deficitGw >= maxDeficit * 0.35)
              return (
                <g
                  key={r.abbr}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover(r.abbr)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(r.abbr)}
                >
                  {view === 'deficit' && r.deficitGw > 0 && (
                    <circle
                      r={rad + 4}
                      fill="none"
                      stroke={dark ? '#fb7185' : '#e11d48'}
                      strokeWidth={1.4}
                      strokeOpacity={0.4 + Math.min(0.4, r.deficitGw / 20)}
                    />
                  )}
                  <circle
                    r={rad}
                    fill={fill}
                    fillOpacity={on ? 0.95 : 0.8}
                    stroke={on ? 'var(--highlight)' : 'var(--bg)'}
                    strokeWidth={on ? 2 : 0.8}
                  />
                  <text
                    y={4}
                    textAnchor="middle"
                    fill={on || rad > 12 ? 'var(--highlight)' : 'var(--mute)'}
                    fontSize={on || rad > 14 ? 10 : 8}
                    fontWeight={600}
                    fontFamily="var(--font-sans)"
                    style={{ pointerEvents: 'none' }}
                  >
                    {r.abbr}
                  </text>
                  {showDefLabel && (
                    <text
                      y={rad + 12}
                      textAnchor="middle"
                      fill={dark ? '#fda4af' : '#9f1239'}
                      fontSize={9}
                      fontFamily="var(--font-mono)"
                      style={{ pointerEvents: 'none' }}
                    >
                      −{r.deficitGw.toFixed(r.deficitGw >= 10 ? 0 : 1)}
                    </text>
                  )}
                  {view === 'onset' && pred?.firstDeficitYear && (
                    <text
                      y={rad + 12}
                      textAnchor="middle"
                      fill="var(--mute)"
                      fontSize={8}
                      fontFamily="var(--font-mono)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {pred.firstDeficitYear}
                    </text>
                  )}
                  <title>
                    {r.name} {year}: demand {r.demandGw.toFixed(1)} · firm {r.firmGw.toFixed(1)} ·{' '}
                    {r.deficitGw > 0
                      ? `deficit ${r.deficitGw.toFixed(1)} GW`
                      : `surplus ${r.surplusGw.toFixed(1)} GW`}
                    {pred?.firstDeficitYear ? ` · first short ${pred.firstDeficitYear}` : ''}
                  </title>
                </g>
              )
            })}

            <g transform={`translate(24, ${H - 52})`}>
              <text fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                surplus
              </text>
              {['#22c55e', '#ca8a04', '#ea580c', '#e11d48'].map((c, i) => (
                <rect key={c} x={52 + i * 28} y={-10} width={28} height={8} fill={c} />
              ))}
              <text x={52 + 4 * 28 + 8} fill="var(--mute)" fontSize="10" fontFamily="var(--font-mono)">
                critical deficit · size encodes {view}
              </text>
            </g>
          </svg>
        </div>

        {focus && (
          <aside className="mapcentric-drawer">
            <p className="kicker">
              Prediction · {year} · {scenario}
            </p>
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
                    style={{
                      width: `${Math.min(100, (focus.demandGw / Math.max(focus.firmGw, focus.demandGw, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="mono">{focus.demandGw.toFixed(1)} GW</span>
              </div>
              <div className="fbal-meter-row">
                <span>Firm</span>
                <div className="fbal-meter-track">
                  <div
                    className="fbal-meter-fill firm"
                    style={{
                      width: `${Math.min(100, (focus.firmGw / Math.max(focus.firmGw, focus.demandGw, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="mono">{focus.firmGw.toFixed(1)} GW</span>
              </div>
            </div>

            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Balance</th>
                  <td
                    className="mono"
                    style={{ color: focus.deficitGw > 0 ? 'var(--danger)' : 'var(--ok)' }}
                  >
                    {focus.deficitGw > 0
                      ? `-${focus.deficitGw.toFixed(1)} GW short`
                      : `+${focus.surplusGw.toFixed(1)} GW surplus`}
                  </td>
                </tr>
                <tr>
                  <th scope="row">vs prior horizon</th>
                  <td className="mono">
                    {focus.deficitDeltaGw > 0 ? '+' : ''}
                    {focus.deficitDeltaGw.toFixed(1)} GW deficit change
                  </td>
                </tr>
                <tr>
                  <th scope="row">Reserve</th>
                  <td className="mono">{focus.reservePct.toFixed(0)}%</td>
                </tr>
                <tr>
                  <th scope="row">First deficit year</th>
                  <td className="mono">
                    {focusPred?.firstDeficitYear ?? 'None through 2045'}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Peak deficit</th>
                  <td className="mono" style={{ color: 'var(--danger)' }}>
                    {focusPred && focusPred.peakDeficitGw > 0
                      ? `${focusPred.peakDeficitGw.toFixed(1)} GW in ${focusPred.peakDeficitYear}`
                      : 'None'}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Grid</th>
                  <td>{focus.grid}</td>
                </tr>
              </tbody>
            </table>

            {/* Mini trajectory */}
            {focusPred && (
              <>
                <p className="kicker" style={{ marginTop: 12 }}>
                  Deficit path
                </p>
                <div className="fbal-spark" aria-hidden>
                  {focusPred.trajectory.map((t) => {
                    const maxD = Math.max(...focusPred.trajectory.map((x) => x.deficitGw), 0.5)
                    const h = Math.max(2, (t.deficitGw / maxD) * 36)
                    return (
                      <button
                        key={t.year}
                        type="button"
                        className={`fbal-spark-col${t.year === year ? ' is-on' : ''}`}
                        onClick={() => setYear(t.year)}
                        title={`${t.year}: deficit ${t.deficitGw.toFixed(1)} GW`}
                      >
                        <span style={{ height: h }} />
                        <em>{String(t.year).slice(2)}</em>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <p className="kicker" style={{ marginTop: 12 }}>
              Drivers
            </p>
            <ul className="gmap-actions">
              {focus.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>

            <p className="kicker" style={{ marginTop: 12 }}>
              Recommended
            </p>
            <ul className="gmap-actions">
              {focus.actions.map((a) => (
                <li key={a}>{a}</li>
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
          <p className="kicker">Largest predicted deficits {year}</p>
          <ol className="ov-rank-list">
            {deficits.map((r, i) => (
              <li key={r.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => setSelected(r.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{r.abbr}</strong> {r.name}
                  </span>
                  <span className="mono" style={{ color: 'var(--danger)' }}>
                    -{r.deficitGw.toFixed(1)} GW
                    {r.deficitDeltaGw > 0.2 ? (
                      <span className="muted"> ↑{r.deficitDeltaGw.toFixed(1)}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
            {deficits.length === 0 && (
              <li className="muted" style={{ fontSize: '0.8rem' }}>
                No state-level firm deficits in this path at {year}.
              </li>
            )}
          </ol>
        </div>
        <div>
          <p className="kicker">Earliest first-deficit states</p>
          <ol className="ov-rank-list">
            {predictions
              .filter((p) => p.firstDeficitYear != null)
              .sort((a, b) => (a.firstDeficitYear! - b.firstDeficitYear!) || b.peakDeficitGw - a.peakDeficitGw)
              .slice(0, 10)
              .map((p, i) => (
                <li key={p.abbr}>
                  <button type="button" className="ov-rank-btn" onClick={() => setSelected(p.abbr)}>
                    <span className="mono muted">{i + 1}</span>
                    <span className="ov-rank-name">
                      <strong>{p.abbr}</strong>
                    </span>
                    <span className="mono">
                      {p.firstDeficitYear}
                      <span className="muted"> peak {p.peakDeficitGw.toFixed(1)}</span>
                    </span>
                  </button>
                </li>
              ))}
          </ol>
        </div>
      </div>

      <p className="footer-line">
        Future deficits · {US_STATES.length} jurisdictions · scenarios base / high-demand /
        delayed-build · peak demand vs firm supply sample path
      </p>
    </div>
  )
}
