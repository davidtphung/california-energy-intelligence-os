import { useMemo, useState } from 'react'
import {
  US_STATES,
  US_REGIONS,
  GRID_OPS,
  totals,
  regionTotals,
  gridTotals,
  nationalFuelMix,
  type USRegion,
} from '../../data/usStates'
import { tradeTotals, withTrade } from '../../data/energyTrade'
import { gasTotals, GAS_REF_YEAR } from '../../data/naturalGas'
import { fossilSummaryTable } from '../../data/fossilFuels'
import { useApp } from '../../context/AppContext'
import { USAMap, type USAMapMetric } from '../charts/USAMap'
import { ImportExportChart } from '../charts/ImportExportChart'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { LiveGridPanel } from './LiveGridPanel'

export function OverviewDashboard() {
  const { openStateDetail, setView } = useApp()
  const [metric, setMetric] = useState<USAMapMetric>('generationTwh')
  const [regionFocus, setRegionFocus] = useState<USRegion | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)

  const us = useMemo(() => totals(US_STATES), [])
  const tradeSum = useMemo(() => tradeTotals(US_STATES.map((s) => s.abbr)), [])
  const gas = useMemo(() => gasTotals(GAS_REF_YEAR), [])
  const fossil = useMemo(() => fossilSummaryTable(), [])

  const mapStates = useMemo(() => {
    if (regionFocus === 'all') return US_STATES
    return US_STATES.filter((s) => s.region === regionFocus)
  }, [regionFocus])

  const topCapacity = useMemo(
    () => [...US_STATES].sort((a, b) => b.capacityGw - a.capacityGw).slice(0, 8),
    []
  )
  const topClean = useMemo(
    () => [...US_STATES].sort((a, b) => b.cleanPct - a.cleanPct).slice(0, 8),
    []
  )
  const topWind = useMemo(
    () => [...US_STATES].sort((a, b) => b.windGw - a.windGw).slice(0, 6),
    []
  )
  const topSolar = useMemo(
    () => [...US_STATES].sort((a, b) => b.solarGw - a.solarGw).slice(0, 6),
    []
  )
  const topStorage = useMemo(
    () => [...US_STATES].sort((a, b) => b.storageGw - a.storageGw).slice(0, 6),
    []
  )
  const topGas = useMemo(
    () => [...US_STATES].sort((a, b) => b.gasGw - a.gasGw).slice(0, 6),
    []
  )
  const topCoal = useMemo(
    () => [...US_STATES].sort((a, b) => b.coalGw - a.coalGw).slice(0, 6),
    []
  )
  const topNuclear = useMemo(
    () => [...US_STATES].sort((a, b) => b.nuclearGw - a.nuclearGw).slice(0, 6),
    []
  )
  const nationalMix = useMemo(() => nationalFuelMix(US_STATES), [])

  const regionRows = useMemo(
    () =>
      US_REGIONS.map((r) => ({
        region: r,
        ...regionTotals(r),
      })).filter((r) => r.count > 0),
    []
  )

  const gridRows = useMemo(
    () =>
      GRID_OPS.map((g) => ({
        grid: g,
        ...gridTotals(g),
      }))
        .filter((g) => g.count > 0)
        .sort((a, b) => b.capacityGw - a.capacityGw),
    []
  )

  const tradeLeaders = useMemo(() => {
    const rows = withTrade(US_STATES)
    return {
      exporters: [...rows].sort((a, b) => b.netExportTwh - a.netExportTwh).slice(0, 6),
      importers: [...rows].sort((a, b) => a.netExportTwh - b.netExportTwh).slice(0, 6),
    }
  }, [])

  const onState = (abbr: string) => {
    setSelected(abbr)
    openStateDetail(abbr)
  }

  return (
    <div id="overview" className="fadein t1">
      <div className="intro">
        <strong>United States energy overview</strong>
        <p>
          All 50 states plus Puerto Rico: capacity, peak, clean share, grids, regions, and trade.
          Click any state for a dedicated profile page.
        </p>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Jurisdictions</span>
          <span className="metric-value">{us.count}</span>
          <span className="metric-hint">50 states + PR</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Nameplate</span>
          <span className="metric-value">
            {us.capacityGw.toFixed(0)}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">summed sample capacity</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Generation</span>
          <span className="metric-value">
            {us.generationTwh.toFixed(0)}
            <span className="metric-unit">TWh</span>
          </span>
          <span className="metric-hint">annual sample total</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Avg clean</span>
          <span className="metric-value">
            {us.cleanAvg.toFixed(0)}
            <span className="metric-unit">%</span>
          </span>
          <span className="metric-hint">
            trade net {tradeSum.netExportTwh >= 0 ? '+' : ''}
            {tradeSum.netExportTwh} TWh
          </span>
        </div>
      </div>

      {/* Map */}
      <section className="block fadein t2">
        <div className="block-head">
          <div>
            <p className="kicker">Map</p>
            <h2 className="page-h2">Capacity and output by state</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              Bubble <strong>area</strong> is nameplate capacity (GW). Bubble <strong>color</strong>{' '}
              is the selected output metric (default annual generation). AK, HI, and PR sit in
              insets. Click any state for its page.
            </p>
          </div>
          <div className="btn-row">
            <Select
              label="Color by"
              value={metric}
              onChange={(e) => setMetric(e.target.value as USAMapMetric)}
              options={[
                { value: 'generationTwh', label: 'Generation TWh' },
                { value: 'capacityGw', label: 'Total capacity GW' },
                { value: 'gasGw', label: 'Natural gas GW' },
                { value: 'coalGw', label: 'Coal GW' },
                { value: 'nuclearGw', label: 'Nuclear GW' },
                { value: 'hydroGw', label: 'Hydro GW' },
                { value: 'solarGw', label: 'Solar GW' },
                { value: 'windGw', label: 'Wind GW' },
                { value: 'peakGw', label: 'Peak load GW' },
                { value: 'cleanPct', label: 'Clean %' },
                { value: 'cf', label: 'Capacity factor' },
              ]}
            />
            <Select
              label="Region"
              value={regionFocus}
              onChange={(e) => setRegionFocus(e.target.value as USRegion | 'all')}
              options={[
                { value: 'all', label: 'All regions' },
                ...US_REGIONS.map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>
        </div>
        <USAMap
          states={mapStates.length ? mapStates : US_STATES}
          selected={selected}
          onSelect={onState}
          metric={metric}
        />
        <div className="state-abbr-grid" style={{ marginTop: '0.85rem' }}>
          {US_STATES.map((s) => (
            <button
              key={s.abbr}
              type="button"
              className={`state-abbr-btn${selected === s.abbr ? ' is-on' : ''}`}
              onClick={() => onState(s.abbr)}
              title={`${s.name} · open page`}
            >
              {s.abbr}
            </button>
          ))}
        </div>
      </section>

      <hr className="rule" />

      {/* Hydrocarbons & fossil fuels · full history tracker */}
      <section className="block fadein t3">
        <div className="block-head">
          <div>
            <p className="kicker">Hydrocarbons · fossil fuels</p>
            <h2 className="page-h2">Production, capacity, and exports</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              Crude oil (1859-), natural gas (1900-), coal (1800-), petroleum products (1920-). Gas
              dry production {gas.productionBcfd.toFixed(1)} Bcf/d · net gas exports{' '}
              {gas.netExportsBcfd.toFixed(1)} Bcf/d ({gas.year}).
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setView('fossil')
              window.history.replaceState(null, '', '#fossil')
            }}
          >
            Open fossil tracker
          </Button>
        </div>
        <div className="metric-strip" style={{ marginTop: '0.75rem' }}>
          {fossil.map((s) => (
            <button
              key={s.id}
              type="button"
              className="metric"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setView('fossil')
                window.history.replaceState(null, '', '#fossil')
              }}
            >
              <span className="metric-label">
                {s.short} · prod {s.latestYear}
              </span>
              <span className="metric-value" style={{ fontSize: '1.05rem' }}>
                {s.production >= 100 ? s.production.toFixed(0) : s.production.toFixed(1)}
                <span className="metric-unit">{s.unitProd}</span>
              </span>
              <span className="metric-hint">
                exp {s.exports >= 100 ? s.exports.toFixed(0) : s.exports.toFixed(1)} · since{' '}
                {s.firstYear}
              </span>
            </button>
          ))}
        </div>
      </section>

      <hr className="rule" />

      {/* Full national fuel mix */}
      <section className="block fadein t3">
        <p className="kicker">Sources</p>
        <h2 className="page-h2">All energy sources · national capacity</h2>
        <p className="sub">
          Nameplate sample across jurisdictions: coal, gas, nuclear, hydro, wind, solar, and storage
          (not clean-only). Total mapped stack {nationalMix.totalGw.toFixed(0)} GW.
        </p>
        <div className="state-stack-bar" style={{ height: 14, marginBottom: 10 }} aria-hidden>
          {nationalMix.rows.map((r) => (
            <div
              key={r.key}
              className="state-stack-seg"
              style={{ width: `${r.pct}%`, background: r.color }}
              title={`${r.key}: ${r.gw.toFixed(0)} GW (${r.pct.toFixed(1)}%)`}
            />
          ))}
        </div>
        <div className="state-stack-legend" style={{ marginBottom: '1rem' }}>
          {nationalMix.rows.map((r) => (
            <span key={r.key}>
              <i style={{ background: r.color }} />
              {r.key} {r.gw.toFixed(0)} GW
              <span className="muted"> ({r.pct.toFixed(0)}%)</span>
            </span>
          ))}
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th style={{ textAlign: 'right' }}>GW</th>
                <th style={{ textAlign: 'right' }}>Share</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {nationalMix.rows.map((r) => (
                <tr key={r.key}>
                  <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{r.key}</td>
                  <td className="num">{r.gw.toFixed(1)}</td>
                  <td className="num">{r.pct.toFixed(1)}%</td>
                  <td className="muted">{r.clean ? 'clean / non-emitting' : 'fossil'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="rule" />

      {/* Regions */}
      <section className="block fadein t3">
        <p className="kicker">Regions</p>
        <h2 className="page-h2">All US census-style energy regions</h2>
        <p className="sub">Click a region to filter the map, or open a state from the leaders below.</p>
        <div className="ov-region-grid">
          {regionRows.map((r) => (
            <button
              key={r.region}
              type="button"
              className={`ov-region-card${regionFocus === r.region ? ' is-on' : ''}`}
              onClick={() => setRegionFocus(r.region)}
            >
              <span className="ov-region-name">{r.region}</span>
              <span className="mono ov-region-stat">
                {r.count} · {r.capacityGw.toFixed(0)} GW · {r.cleanAvg.toFixed(0)}% clean
              </span>
            </button>
          ))}
        </div>
      </section>

      <hr className="rule" />

      {/* Grids */}
      <section className="block">
        <p className="kicker">Grids · ISOs</p>
        <h2 className="page-h2">Balancing footprints</h2>
        <p className="sub">Capacity rolled up by primary grid / ISO label on each state.</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grid / ISO</th>
                <th style={{ textAlign: 'right' }}>States</th>
                <th style={{ textAlign: 'right' }}>Cap GW</th>
                <th style={{ textAlign: 'right' }}>Gen TWh</th>
                <th style={{ textAlign: 'right' }}>Avg clean</th>
              </tr>
            </thead>
            <tbody>
              {gridRows.map((g) => (
                <tr key={g.grid}>
                  <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{g.grid}</td>
                  <td className="num">{g.count}</td>
                  <td className="num">{g.capacityGw.toFixed(0)}</td>
                  <td className="num">{g.generationTwh.toFixed(0)}</td>
                  <td className="num">{g.cleanAvg.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="rule" />

      {/* Leaders */}
      <div className="grid-2">
        <section className="block">
          <p className="kicker">Leaders</p>
          <h2 className="page-h2">Largest capacity</h2>
          <ol className="ov-rank-list">
            {topCapacity.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong> {s.name}
                  </span>
                  <span className="mono">{s.capacityGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="block">
          <p className="kicker">Leaders</p>
          <h2 className="page-h2">Cleanest share</h2>
          <ol className="ov-rank-list">
            {topClean.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong> {s.name}
                  </span>
                  <span className="mono">{s.cleanPct}%</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid-3">
        <section className="block">
          <p className="kicker">Coal</p>
          <h2 className="page-h2">Top fleets</h2>
          <ol className="ov-rank-list">
            {topCoal.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong>
                  </span>
                  <span className="mono">{s.coalGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="block">
          <p className="kicker">Natural gas</p>
          <h2 className="page-h2">Top fleets</h2>
          <ol className="ov-rank-list">
            {topGas.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong>
                  </span>
                  <span className="mono">{s.gasGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="block">
          <p className="kicker">Nuclear</p>
          <h2 className="page-h2">Top fleets</h2>
          <ol className="ov-rank-list">
            {topNuclear.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong>
                  </span>
                  <span className="mono">{s.nuclearGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid-3">
        <section className="block">
          <p className="kicker">Solar</p>
          <h2 className="page-h2">Top fleets</h2>
          <ol className="ov-rank-list">
            {topSolar.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong>
                  </span>
                  <span className="mono">{s.solarGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="block">
          <p className="kicker">Wind</p>
          <h2 className="page-h2">Top fleets</h2>
          <ol className="ov-rank-list">
            {topWind.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong>
                  </span>
                  <span className="mono">{s.windGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="block">
          <p className="kicker">Storage</p>
          <h2 className="page-h2">Top fleets</h2>
          <ol className="ov-rank-list">
            {topStorage.map((s, i) => (
              <li key={s.abbr}>
                <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                  <span className="mono muted">{i + 1}</span>
                  <span className="ov-rank-name">
                    <strong>{s.abbr}</strong>
                  </span>
                  <span className="mono">{s.storageGw} GW</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <hr className="rule" />

      {/* Trade */}
      <section className="block">
        <div className="block-head">
          <div>
            <p className="kicker">Trade</p>
            <h2 className="page-h2">Import and export energy</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              National sample: {tradeSum.importsTwh} TWh imports · {tradeSum.exportsTwh} TWh exports
              · net {tradeSum.netExportTwh >= 0 ? '+' : ''}
              {tradeSum.netExportTwh} TWh. Click a bar or state for its page.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setView('states')
              window.history.replaceState(null, '', '#states')
            }}
          >
            Full trade catalog
          </Button>
        </div>
        <ImportExportChart states={US_STATES} selectedAbbr={selected} onSelect={onState} />
        <div className="grid-2" style={{ marginTop: '1.25rem' }}>
          <div>
            <p className="kicker">Top net exporters</p>
            <ol className="ov-rank-list">
              {tradeLeaders.exporters.map((s, i) => (
                <li key={s.abbr}>
                  <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                    <span className="mono muted">{i + 1}</span>
                    <span className="ov-rank-name">
                      <strong>{s.abbr}</strong> {s.name}
                    </span>
                    <span className="mono">+{s.netExportTwh} TWh</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="kicker">Top net importers</p>
            <ol className="ov-rank-list">
              {tradeLeaders.importers.map((s, i) => (
                <li key={s.abbr}>
                  <button type="button" className="ov-rank-btn" onClick={() => onState(s.abbr)}>
                    <span className="mono muted">{i + 1}</span>
                    <span className="ov-rank-name">
                      <strong>{s.abbr}</strong> {s.name}
                    </span>
                    <span className="mono">{s.netExportTwh} TWh</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* All states table */}
      <section className="block">
        <p className="kicker">Directory</p>
        <h2 className="page-h2">Every state and Puerto Rico</h2>
        <p className="sub">Open any row for a dedicated state page with fleet, trade, and peers.</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Region</th>
                <th>Grid</th>
                <th style={{ textAlign: 'right' }}>Cap GW</th>
                <th style={{ textAlign: 'right' }}>Peak GW</th>
                <th style={{ textAlign: 'right' }}>TWh</th>
                <th style={{ textAlign: 'right' }}>Clean %</th>
                <th>Primary</th>
              </tr>
            </thead>
            <tbody>
              {[...US_STATES]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <tr
                    key={s.abbr}
                    onClick={() => onState(s.abbr)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>
                      {s.abbr}{' '}
                      <span style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{s.name}</span>
                    </td>
                    <td className="muted">{s.region}</td>
                    <td className="muted">{s.grid}</td>
                    <td className="num">{s.capacityGw}</td>
                    <td className="num">{s.peakGw}</td>
                    <td className="num">{s.generationTwh}</td>
                    <td className="num">{s.cleanPct}</td>
                    <td>{s.primary}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="rule" />

      {/* CA live spotlight */}
      <section className="block">
        <div className="block-head">
          <div>
            <p className="kicker">California · live</p>
            <h2 className="page-h2">CAISO today&apos;s grid</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              Home workspace with live ISO telemetry. Full California profile:{' '}
              <button type="button" className="linkish" onClick={() => onState('CA')}>
                open CA page
              </button>
              .
            </p>
          </div>
          <Badge variant="success">Live feed</Badge>
        </div>
        <LiveGridPanel />
      </section>

      <p className="footer-line">
        Overview · 50 states + PR · EIA-scale samples · click any state for a dedicated page ·{' '}
        <button
          type="button"
          className="linkish"
          onClick={() => {
            setView('states')
            window.history.replaceState(null, '', '#states')
          }}
        >
          USA catalog
        </button>
      </p>
    </div>
  )
}
