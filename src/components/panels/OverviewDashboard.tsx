import { useMemo, useState } from 'react'
import {
  US_STATES,
  US_REGIONS,
  GRID_OPS,
  totals,
  regionTotals,
  gridTotals,
  type USRegion,
} from '../../data/usStates'
import { tradeTotals, withTrade } from '../../data/energyTrade'
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
                { value: 'cf', label: 'Capacity factor' },
                { value: 'peakGw', label: 'Peak load GW' },
                { value: 'cleanPct', label: 'Clean %' },
                { value: 'solarGw', label: 'Solar GW' },
                { value: 'windGw', label: 'Wind GW' },
                { value: 'capacityGw', label: 'Capacity (color too)' },
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
