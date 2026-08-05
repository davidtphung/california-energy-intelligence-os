import { useMemo, useState } from 'react'
import {
  SOURCE_CONSISTENCY,
  bandVariant,
  sortedByConsistency,
} from '../../data/sourceConsistency'
import { ConsistencyChart, ConsistencyRadarLite } from '../charts/ConsistencyChart'
import { Badge } from '../ui/Badge'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'

export function ConsistencyPanel() {
  const { setDrilldown } = useApp()
  const [activeTech, setActiveTech] = useState<string>(SOURCE_CONSISTENCY[0].technology)

  const row = useMemo(
    () => SOURCE_CONSISTENCY.find((s) => s.technology === activeTech) ?? SOURCE_CONSISTENCY[0],
    [activeTech]
  )

  const ranked = sortedByConsistency(true)

  return (
    <div id="consistency" className="fadein t1">
      <div className="intro">
        <strong>Source consistency</strong>
        <p>
          How consistent or inconsistent each California energy source is - firmness, capacity
          factor bands, day/season swing, and forecast skill. Planning ranges, not a single day
          snapshot.
        </p>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Most consistent</span>
          <span className="metric-value" style={{ fontSize: '1.15rem' }}>
            {ranked[0].label}
          </span>
          <span className="metric-hint">{ranked[0].consistencyScore} / 100</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Least consistent</span>
          <span className="metric-value" style={{ fontSize: '1.15rem' }}>
            {ranked[ranked.length - 1].label}
          </span>
          <span className="metric-hint">
            inconsistency {ranked[ranked.length - 1].inconsistencyScore}
          </span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Selected</span>
          <span className="metric-value" style={{ fontSize: '1.15rem' }}>
            {row.label}
          </span>
          <span className="metric-hint">{row.band} consistency</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Typical CF</span>
          <span className="metric-value">
            {(row.capacityFactorTypical * 100).toFixed(0)}
            <span className="metric-unit">%</span>
          </span>
          <span className="metric-hint">
            band {(row.capacityFactorRange[0] * 100).toFixed(0)}-
            {(row.capacityFactorRange[1] * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <div className="block-head">
            <div>
              <p className="kicker">Ranked</p>
              <h2 className="page-h2">Consistency vs inconsistency</h2>
            </div>
            <Button
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() =>
                exportCsv(
                  SOURCE_CONSISTENCY.map((s) => ({
                    technology: s.technology,
                    consistency: s.consistencyScore,
                    inconsistency: s.inconsistencyScore,
                    band: s.band,
                    cf_typical: s.capacityFactorTypical,
                    cf_low: s.capacityFactorRange[0],
                    cf_high: s.capacityFactorRange[1],
                    diurnal_swing: s.diurnalSwing,
                    seasonal_swing: s.seasonalSwing,
                    forecast_error_pct: s.forecastErrorPct,
                    firm_credit: s.firmCredit,
                  })),
                  'ca-source-consistency.csv'
                )
              }
            >
              CSV
            </Button>
          </div>
          <ConsistencyChart
            active={activeTech}
            onSelect={(t) => {
              setActiveTech(t)
              setDrilldown(`consistency:${t}`)
            }}
          />
        </section>

        <section className="block">
          <p className="kicker">Profile</p>
          <h2 className="page-h2">{row.label}</h2>
          <p className="sub" style={{ marginBottom: '0.75rem' }}>
            {row.caNote}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <Badge variant={bandVariant(row.band)}>{row.band} consistency</Badge>
            <Badge>
              {row.consistencyScore} consistent
            </Badge>
            <Badge variant="warning">{row.inconsistencyScore} inconsistent</Badge>
          </div>

          <div className="cprof-grid">
            <ConsistencyRadarLite row={row} />
            <table className="list-table">
              <tbody>
                <tr>
                  <th scope="row">Consistency</th>
                  <td className="mono" style={{ color: 'var(--highlight)' }}>
                    {row.consistencyScore} / 100
                  </td>
                </tr>
                <tr>
                  <th scope="row">Inconsistency</th>
                  <td className="mono">{row.inconsistencyScore} / 100</td>
                </tr>
                <tr>
                  <th scope="row">Capacity factor</th>
                  <td className="mono">
                    {(row.capacityFactorTypical * 100).toFixed(0)}% typical (
                    {(row.capacityFactorRange[0] * 100).toFixed(0)}-
                    {(row.capacityFactorRange[1] * 100).toFixed(0)}%)
                  </td>
                </tr>
                <tr>
                  <th scope="row">Diurnal swing</th>
                  <td className="mono">{row.diurnalSwing} / 100</td>
                </tr>
                <tr>
                  <th scope="row">Seasonal swing</th>
                  <td className="mono">{row.seasonalSwing} / 100</td>
                </tr>
                <tr>
                  <th scope="row">Forecast error</th>
                  <td className="mono">~{row.forecastErrorPct}% of nameplate class</td>
                </tr>
                <tr>
                  <th scope="row">Firm credit (illustrative)</th>
                  <td className="mono">{(row.firmCredit * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <th scope="row">Variability scale</th>
                  <td>{row.timescale}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="btl-tri" style={{ marginTop: '1rem' }}>
            <div>
              <p className="kicker">What drives it</p>
              <ul className="idea-list">
                {row.drivers.map((d) => (
                  <li key={d} style={{ color: 'var(--ink-2)', fontSize: '0.88rem' }}>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker">Strengths</p>
              <ul className="idea-list">
                {row.strengths.map((d) => (
                  <li key={d} style={{ color: 'var(--ink-2)', fontSize: '0.88rem' }}>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker">Risks</p>
              <ul className="idea-list">
                {row.risks.map((d) => (
                  <li key={d} style={{ color: 'var(--ink-2)', fontSize: '0.88rem' }}>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Matrix</p>
        <h2 className="page-h2">All sources side by side</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Band</th>
                <th style={{ textAlign: 'right' }}>Consist.</th>
                <th style={{ textAlign: 'right' }}>Inconsist.</th>
                <th style={{ textAlign: 'right' }}>CF typ</th>
                <th style={{ textAlign: 'right' }}>Diurnal</th>
                <th style={{ textAlign: 'right' }}>Seasonal</th>
                <th style={{ textAlign: 'right' }}>Fcst err</th>
                <th style={{ textAlign: 'right' }}>Firm</th>
                <th>Timescale</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s) => (
                <tr
                  key={s.technology}
                  onClick={() => {
                    setActiveTech(s.technology)
                    setDrilldown(`consistency:${s.technology}`)
                  }}
                  style={{
                    cursor: 'pointer',
                    background: s.technology === activeTech ? 'var(--fill)' : undefined,
                  }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{s.label}</td>
                  <td>
                    <Badge variant={bandVariant(s.band)}>{s.band}</Badge>
                  </td>
                  <td className="num">{s.consistencyScore}</td>
                  <td className="num">{s.inconsistencyScore}</td>
                  <td className="num">{(s.capacityFactorTypical * 100).toFixed(0)}%</td>
                  <td className="num">{s.diurnalSwing}</td>
                  <td className="num">{s.seasonalSwing}</td>
                  <td className="num">~{s.forecastErrorPct}%</td>
                  <td className="num">{(s.firmCredit * 100).toFixed(0)}%</td>
                  <td className="muted">{s.timescale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line">
        Consistency scores are planning heuristics for CA portfolios (CF bands, RA-style firmness,
        forecast error). Pair with live CAISO fuel mix for today&apos;s realized output.
      </p>
    </div>
  )
}
