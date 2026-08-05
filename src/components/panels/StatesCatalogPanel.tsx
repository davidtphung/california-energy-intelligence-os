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
import { USAMap } from '../charts/USAMap'
import { ImportExportChart, CaliforniaTradeDetail } from '../charts/ImportExportChart'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'
import { exportCsv, exportJson } from '../../lib/utils'
import { useApp } from '../../context/AppContext'
import { tradeOf, withTrade, tradeTotals } from '../../data/energyTrade'

type SortKey = 'name' | 'capacityGw' | 'cleanPct' | 'peakGw' | 'generationTwh'

export function StatesCatalogPanel() {
  const { openStateDetail } = useApp()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<USRegion | 'all'>('all')
  const [grid, setGrid] = useState<GridOperator | 'all'>('all')
  const [metric, setMetric] = useState<'cleanPct' | 'capacityGw' | 'peakGw' | 'solarGw' | 'windGw'>(
    'cleanPct'
  )
  const [sortKey, setSortKey] = useState<SortKey>('capacityGw')
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
    list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      return (b[sortKey] as number) - (a[sortKey] as number)
    })
    return list
  }, [query, region, grid, sortKey])

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

  /** Open full dedicated state page */
  const openState = (abbr: string) => {
    setSelected(abbr)
    openStateDetail(abbr)
  }

  return (
    <div id="states" className="fadein t1">
      <div className="intro">
        <strong>United States catalog</strong>
        <p>
          All 50 states plus Puerto Rico: capacity, peak, clean share, trade, and primary fuel.
          California is the home workspace; use this map to navigate other jurisdictions.
        </p>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">States shown</span>
          <span className="metric-value">{t.count}</span>
          <span className="metric-hint">of 51 (50 + PR)</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Capacity</span>
          <span className="metric-value">
            {t.capacityGw.toFixed(0)}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">filtered sum</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Generation</span>
          <span className="metric-value">
            {t.generationTwh.toFixed(0)}
            <span className="metric-unit">TWh</span>
          </span>
          <span className="metric-hint">annual sample</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Avg clean</span>
          <span className="metric-value">
            {t.cleanAvg.toFixed(0)}
            <span className="metric-unit">%</span>
          </span>
          <span className="metric-hint">unweighted mean</span>
        </div>
      </div>

      <div className="filters">
        <Input
          placeholder="Search state, fuel, grid…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search states"
          style={{ minWidth: '11rem' }}
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
          label="Grid / ISO"
          value={grid}
          onChange={(e) => setGrid(e.target.value as GridOperator | 'all')}
          options={[
            { value: 'all', label: 'All grids' },
            ...GRID_OPS.map((g) => ({ value: g, label: g })),
          ]}
        />
        <Select
          label="Map metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
          options={[
            { value: 'cleanPct', label: 'Clean %' },
            { value: 'capacityGw', label: 'Capacity GW' },
            { value: 'peakGw', label: 'Peak GW' },
            { value: 'solarGw', label: 'Solar GW' },
            { value: 'windGw', label: 'Wind GW' },
          ]}
        />
        <Select
          label="Sort"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          options={[
            { value: 'capacityGw', label: 'Capacity' },
            { value: 'cleanPct', label: 'Clean %' },
            { value: 'peakGw', label: 'Peak' },
            { value: 'generationTwh', label: 'Generation' },
            { value: 'name', label: 'Name' },
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
                  region: s.region,
                  grid: s.grid,
                  capacity_gw: s.capacityGw,
                  generation_twh: s.generationTwh,
                  peak_gw: s.peakGw,
                  clean_pct: s.cleanPct,
                  imports_twh: s.importsTwh,
                  exports_twh: s.exportsTwh,
                  net_export_twh: s.netExportTwh,
                  primary: s.primary,
                  secondary: s.secondary,
                  nuclear_gw: s.nuclearGw,
                  solar_gw: s.solarGw,
                  wind_gw: s.windGw,
                  gas_gw: s.gasGw,
                  coal_gw: s.coalGw,
                  hydro_gw: s.hydroGw,
                  storage_gw: s.storageGw,
                })),
                'us-states-energy-trade.csv'
              )
            }
          >
            CSV
          </Button>
          <Button size="sm" onClick={() => exportJson(filtered, 'us-states-energy.json')}>
            JSON
          </Button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">Map</p>
          <h2 className="page-h2">Navigate the USA</h2>
          <p className="sub">
            Click a state or Puerto Rico. Dot size and color follow the map metric ({metric}). AK, HI,
            and PR sit in insets.
          </p>
          <USAMap
            states={filtered.length ? filtered : US_STATES}
            selected={selected}
            onSelect={openState}
            metric={metric}
          />
        </section>

        <section className="block">
          <p className="kicker">Profile</p>
          {focus ? (
            <>
              <h2 className="page-h2">
                {focus.name}{' '}
                <span className="mono muted" style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {focus.abbr}
                </span>
              </h2>
              <p className="sub">{focus.note}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <Badge variant="info">{focus.region}</Badge>
                <Badge>{focus.grid}</Badge>
                {focus.abbr === 'CA' && <Badge variant="success">Home workspace</Badge>}
              </div>
              <Button size="sm" style={{ marginBottom: 12 }} onClick={() => openState(focus.abbr)}>
                Open full {focus.abbr} page
              </Button>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Capacity</th>
                    <td className="mono" style={{ color: 'var(--highlight)' }}>
                      {focus.capacityGw} GW
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Peak load</th>
                    <td className="mono">{focus.peakGw} GW</td>
                  </tr>
                  <tr>
                    <th scope="row">Generation</th>
                    <td className="mono">{focus.generationTwh} TWh/yr</td>
                  </tr>
                  <tr>
                    <th scope="row">Clean share</th>
                    <td className="mono">{focus.cleanPct}%</td>
                  </tr>
                  <tr>
                    <th scope="row">Primary / secondary</th>
                    <td>
                      {focus.primary} · {focus.secondary}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Nuclear</th>
                    <td className="mono">{focus.nuclearGw} GW</td>
                  </tr>
                  <tr>
                    <th scope="row">Solar / wind</th>
                    <td className="mono">
                      {focus.solarGw} / {focus.windGw} GW
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Gas / coal</th>
                    <td className="mono">
                      {focus.gasGw} / {focus.coalGw} GW
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Hydro / storage</th>
                    <td className="mono">
                      {focus.hydroGw} / {focus.storageGw} GW
                    </td>
                  </tr>
                </tbody>
              </table>
              {focusTrade && (
                <>
                  <p className="kicker" style={{ marginTop: '1rem' }}>
                    Electricity trade
                  </p>
                  <table className="list-table">
                    <tbody>
                      <tr>
                        <th scope="row">Imports</th>
                        <td className="mono" style={{ color: 'var(--highlight)' }}>
                          {focusTrade.importsTwh} TWh/yr
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Exports</th>
                        <td className="mono">{focusTrade.exportsTwh} TWh/yr</td>
                      </tr>
                      <tr>
                        <th scope="row">Net export</th>
                        <td className="mono">
                          {focusTrade.exportsTwh - focusTrade.importsTwh >= 0 ? '+' : ''}
                          {focusTrade.exportsTwh - focusTrade.importsTwh} TWh
                          {focusTrade.exportsTwh - focusTrade.importsTwh >= 0
                            ? ' (exporter)'
                            : ' (importer)'}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Import from</th>
                        <td>{focusTrade.importFrom.join(' · ') || 'none listed'}</td>
                      </tr>
                      <tr>
                        <th scope="row">Export to</th>
                        <td>{focusTrade.exportTo.join(' · ') || 'none listed'}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="sub" style={{ marginTop: 8 }}>
                    {focusTrade.note}
                  </p>
                </>
              )}
            </>
          ) : (
            <p className="sub">No states match filters.</p>
          )}
        </section>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Trade</p>
        <h2 className="page-h2">Import and export energy</h2>
        <p className="sub">
          Filtered set: {tradeSum.importsTwh} TWh imports · {tradeSum.exportsTwh} TWh exports · net{' '}
          {tradeSum.netExportTwh >= 0 ? '+' : ''}
          {tradeSum.netExportTwh} TWh. Click a bar to open that state&apos;s page.
        </p>
        <ImportExportChart
          states={filtered.length ? filtered : US_STATES}
          selectedAbbr={selected}
          onSelect={openState}
        />
      </section>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">California focus</p>
        <h2 className="page-h2">CA import / export detail</h2>
        <CaliforniaTradeDetail />
      </section>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Catalog</p>
        <h2 className="page-h2">All states</h2>
        <p className="sub">
          Smart list of {filtered.length} jurisdictions (states + PR). Other mainland/territory sample
          capacity (ex-CA) {totals(other49).capacityGw.toFixed(0)} GW.
        </p>
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
                <th style={{ textAlign: 'right' }}>Import</th>
                <th style={{ textAlign: 'right' }}>Export</th>
                <th style={{ textAlign: 'right' }}>Net</th>
                <th>Primary</th>
              </tr>
            </thead>
            <tbody>
              {tradeRows.map((s) => (
                <tr
                  key={s.abbr}
                  onClick={() => openState(s.abbr)}
                  style={{
                    cursor: 'pointer',
                    background: s.abbr === selected ? 'var(--fill)' : undefined,
                  }}
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
                  <td className="num">{s.importsTwh}</td>
                  <td className="num">{s.exportsTwh}</td>
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

      <p className="footer-line">
        USA catalog · EIA-scale sample values for navigation · pair with CA live CAISO feeds for
        California detail
      </p>
    </div>
  )
}
