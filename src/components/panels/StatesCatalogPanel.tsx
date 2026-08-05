import { useMemo, useState } from 'react'
import {
  US_STATES,
  US_REGIONS,
  GRID_OPS,
  totals,
  type USRegion,
  type GridOperator,
  type USStateEnergy,
} from '../../data/usStates'
import { USAMap, type USAMapMetric } from '../charts/USAMap'
import { ImportExportChart, CaliforniaTradeDetail } from '../charts/ImportExportChart'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'
import { exportCsv } from '../../lib/utils'
import { useApp } from '../../context/AppContext'
import { tradeOf, withTrade, tradeTotals } from '../../data/energyTrade'

export function StatesCatalogPanel() {
  const { openStateDetail } = useApp()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<USRegion | 'all'>('all')
  const [grid, setGrid] = useState<GridOperator | 'all'>('all')
  const [metric, setMetric] = useState<USAMapMetric>('generationTwh')
  const [selected, setSelected] = useState<string | null>('CA')

  const filtered = useMemo(() => {
    let list = [...US_STATES]
    if (region !== 'all') list = list.filter((s) => s.region === region)
    if (grid !== 'all') list = list.filter((s) => s.grid === grid)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.abbr.toLowerCase().includes(q) ||
          s.primary.toLowerCase().includes(q) ||
          s.grid.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => b.capacityGw - a.capacityGw)
    return list
  }, [query, region, grid])

  const focus: USStateEnergy | null =
    filtered.find((s) => s.abbr === selected) ?? filtered[0] ?? null

  const t = totals(filtered)
  const other49 = useMemo(() => US_STATES.filter((s) => s.abbr !== 'CA'), [])
  const tradeRows = useMemo(() => withTrade(filtered), [filtered])
  const tradeSum = useMemo(
    () => tradeTotals(filtered.map((s) => s.abbr)),
    [filtered]
  )
  const focusTrade = focus ? tradeOf(focus.abbr) : null

  /** Select on map — data flows into drawer; full page is explicit */
  const selectState = (abbr: string) => setSelected(abbr)
  const openState = (abbr: string) => {
    setSelected(abbr)
    openStateDetail(abbr)
  }

  const fuelFlow = focus
    ? [
        { k: 'Gas', v: focus.gasGw, c: '#94a3b8' },
        { k: 'Coal', v: focus.coalGw, c: '#44403c' },
        { k: 'Nuclear', v: focus.nuclearGw, c: '#a78bfa' },
        { k: 'Hydro', v: focus.hydroGw, c: '#0ea5e9' },
        { k: 'Wind', v: focus.windGw, c: '#38bdf8' },
        { k: 'Solar', v: focus.solarGw, c: '#f59e0b' },
        { k: 'Storage', v: focus.storageGw, c: '#22c55e' },
      ].filter((x) => x.v > 0.05)
    : []
  const fuelSum = fuelFlow.reduce((s, x) => s + x.v, 0) || 1

  return (
    <div id="states" className="mapcentric fadein t1">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">USA · map first</p>
          <h1 className="page-h2" style={{ marginBottom: 4 }}>
            National energy map
          </h1>
          <p className="mapcentric-lede">
            Capacity and generation across jurisdictions. Click a bubble — metrics and fuel mix flow
            from the map into the side panel.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>States</span>
            <strong>{t.count}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Capacity</span>
            <strong>
              {t.capacityGw.toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Generation</span>
            <strong>
              {t.generationTwh.toFixed(0)}
              <em>TWh</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Clean avg</span>
            <strong>
              {t.cleanAvg.toFixed(0)}
              <em>%</em>
            </strong>
          </div>
        </div>
      </header>

      <div className="mapcentric-filters">
        <Input
          placeholder="Search state, fuel, grid…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search states"
          style={{ minWidth: '10rem' }}
        />
        <Select
          label="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value as USRegion | 'all')}
          options={[
            { value: 'all', label: 'All regions' },
            ...US_REGIONS.map((r) => ({ value: r, label: r })),
          ]}
        />
        <Select
          label="Grid"
          value={grid}
          onChange={(e) => setGrid(e.target.value as GridOperator | 'all')}
          options={[
            { value: 'all', label: 'All grids' },
            ...GRID_OPS.map((g) => ({ value: g, label: g })),
          ]}
        />
        <Select
          label="Color by"
          value={metric}
          onChange={(e) => setMetric(e.target.value as USAMapMetric)}
          options={[
            { value: 'generationTwh', label: 'Generation TWh' },
            { value: 'capacityGw', label: 'Capacity GW' },
            { value: 'gasGw', label: 'Gas GW' },
            { value: 'coalGw', label: 'Coal GW' },
            { value: 'nuclearGw', label: 'Nuclear GW' },
            { value: 'hydroGw', label: 'Hydro GW' },
            { value: 'solarGw', label: 'Solar GW' },
            { value: 'windGw', label: 'Wind GW' },
            { value: 'peakGw', label: 'Peak GW' },
            { value: 'cleanPct', label: 'Clean %' },
            { value: 'cf', label: 'Capacity factor' },
          ]}
        />
        <div className="btn-row" style={{ alignSelf: 'flex-end' }}>
          <Button
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() =>
              exportCsv(
                tradeRows.map((s) => ({
                  abbr: s.abbr,
                  name: s.name,
                  capacity_gw: s.capacityGw,
                  generation_twh: s.generationTwh,
                  net_export_twh: s.netExportTwh,
                })),
                'us-states-energy-trade.csv'
              )
            }
          >
            CSV
          </Button>
        </div>
      </div>

      {/* Map stage + data drawer */}
      <div className={`mapcentric-stage${focus ? ' has-drawer' : ''}`}>
        <div className="mapcentric-map">
          <USAMap
            states={filtered.length ? filtered : US_STATES}
            selected={selected}
            onSelect={selectState}
            metric={metric}
            large
          />
        </div>

        {focus && (
          <aside className="mapcentric-drawer" aria-label="State data from map">
            <p className="kicker">From map</p>
            <h2 className="page-h2" style={{ fontSize: '1.2rem' }}>
              {focus.name}{' '}
              <span className="mono muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {focus.abbr}
              </span>
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <Badge variant="info">{focus.region}</Badge>
              <Badge>{focus.grid}</Badge>
            </div>
            <p className="sub" style={{ maxWidth: 'none', fontSize: '0.82rem' }}>
              {focus.note}
            </p>

            <p className="kicker" style={{ marginTop: 12 }}>
              Capacity flow
            </p>
            <div className="mapcentric-flowbar" aria-hidden>
              {fuelFlow.map((f) => (
                <div
                  key={f.k}
                  style={{ width: `${(f.v / fuelSum) * 100}%`, background: f.c }}
                  title={`${f.k}: ${f.v} GW`}
                />
              ))}
            </div>
            <ul className="mapcentric-flowlist">
              {fuelFlow.map((f) => (
                <li key={f.k}>
                  <i style={{ background: f.c }} />
                  {f.k}{' '}
                  <span className="mono">
                    {f.v.toFixed(1)} GW · {((f.v / fuelSum) * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>

            <table className="list-table" style={{ marginTop: 10 }}>
              <tbody>
                <tr>
                  <th scope="row">Capacity</th>
                  <td className="mono" style={{ color: 'var(--highlight)' }}>
                    {focus.capacityGw} GW
                  </td>
                </tr>
                <tr>
                  <th scope="row">Peak</th>
                  <td className="mono">{focus.peakGw} GW</td>
                </tr>
                <tr>
                  <th scope="row">Generation</th>
                  <td className="mono">{focus.generationTwh} TWh/yr</td>
                </tr>
                <tr>
                  <th scope="row">Clean</th>
                  <td className="mono">{focus.cleanPct}%</td>
                </tr>
                {focusTrade && (
                  <>
                    <tr>
                      <th scope="row">Imports</th>
                      <td className="mono">{focusTrade.importsTwh} TWh</td>
                    </tr>
                    <tr>
                      <th scope="row">Exports</th>
                      <td className="mono">{focusTrade.exportsTwh} TWh</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <Button size="sm" onClick={() => openState(focus.abbr)}>
                Open {focus.abbr} page
              </Button>
            </div>
          </aside>
        )}
      </div>

      <details className="mapcentric-details">
        <summary>Trade chart · full catalog ({filtered.length} states)</summary>
        <section className="block" style={{ marginTop: '0.75rem' }}>
          <p className="sub">
            Imports {tradeSum.importsTwh} TWh · exports {tradeSum.exportsTwh} TWh · net{' '}
            {tradeSum.netExportTwh >= 0 ? '+' : ''}
            {tradeSum.netExportTwh} TWh · ex-CA capacity {totals(other49).capacityGw.toFixed(0)} GW
          </p>
          <ImportExportChart
            states={filtered.length ? filtered : US_STATES}
            selectedAbbr={selected}
            onSelect={selectState}
          />
          {selected === 'CA' && (
            <div style={{ marginTop: '1rem' }}>
              <CaliforniaTradeDetail />
            </div>
          )}
          <div className="table-wrap" style={{ marginTop: '1rem', maxHeight: '20rem', overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th style={{ textAlign: 'right' }}>Cap</th>
                  <th style={{ textAlign: 'right' }}>TWh</th>
                  <th style={{ textAlign: 'right' }}>Clean</th>
                  <th style={{ textAlign: 'right' }}>Net trade</th>
                  <th>Primary</th>
                </tr>
              </thead>
              <tbody>
                {tradeRows.map((s) => (
                  <tr
                    key={s.abbr}
                    onClick={() => selectState(s.abbr)}
                    style={{
                      cursor: 'pointer',
                      background: s.abbr === selected ? 'var(--fill)' : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>
                      {s.abbr} {s.name}
                    </td>
                    <td className="num">{s.capacityGw}</td>
                    <td className="num">{s.generationTwh}</td>
                    <td className="num">{s.cleanPct}%</td>
                    <td className="num">
                      {s.netExportTwh >= 0 ? '+' : ''}
                      {s.netExportTwh}
                    </td>
                    <td>{s.primary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </details>

      <p className="footer-line">USA · map-centric · data flows from selection · EIA-scale samples</p>
    </div>
  )
}
