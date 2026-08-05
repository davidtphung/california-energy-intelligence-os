import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  getCapacityByTech,
  getGenerationBySource,
  getHourlySeries,
  getKPIs,
  getRegionalCapacity,
  getTransmissionFlows,
  PLANTS,
  POLICY_TARGETS,
} from '../../data/mockData'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { Tabs } from '../ui/Tabs'
import { Button } from '../ui/Button'
import { CapacityBarChart } from '../charts/CapacityBarChart'
import { GenerationMixChart } from '../charts/GenerationMixChart'
import { LoadGenerationChart } from '../charts/LoadGenerationChart'
import { FlowView } from '../charts/FlowView'
import { CAMap } from '../charts/CAMap'
import { EnergyPathwayMap } from '../charts/EnergyPathwayMap'
import { BaseloadDensityTimeline } from '../charts/BaseloadDensityTimeline'
import { CaliforniaTradeDetail } from '../charts/ImportExportChart'
import { LiveGridPanel } from './LiveGridPanel'
import { TECH_LABELS, formatNumber } from '../../lib/utils'
import type { Technology, CARegion } from '../../types'

export function OverviewDashboard() {
  const { filters, setFilters, setDrilldown, drilldown, setView } = useApp()
  const [mixTab, setMixTab] = useState('stacked')

  const kpis = useMemo(() => getKPIs(filters), [filters])
  const capacity = useMemo(() => getCapacityByTech(filters), [filters])
  const generation = useMemo(() => getGenerationBySource(filters), [filters])
  const hourly = useMemo(() => getHourlySeries(filters), [filters])
  const flows = useMemo(() => getTransmissionFlows(), [])
  const regional = useMemo(() => getRegionalCapacity(filters), [filters])

  return (
    <div>
      <div className="intro fadein t1">
        <strong>California Energy Intelligence OS</strong>
        <p>
          Live CAISO grid telemetry for today, plus research and scenario tools for California
          electricity systems. Built by{' '}
          <a href="https://x.com/davidtphung" target="_blank" rel="noopener noreferrer">
            David T Phung
          </a>
          .
        </p>
      </div>

      <LiveGridPanel />

      <hr className="rule" />

      <div className="fadein t2">
        <BaseloadDensityTimeline />
      </div>

      <hr className="rule" />

      <section className="block fadein t3">
        <p className="kicker">Trade · California</p>
        <h2 className="page-h2">Import and export energy</h2>
        <p className="sub">
          Annual electricity interchange sample for CA. Full 50-state chart lives under USA.
        </p>
        <CaliforniaTradeDetail />
        <Button
          size="sm"
          style={{ marginTop: 12 }}
          onClick={() => {
            setView('states')
            window.history.replaceState(null, '', '#states')
          }}
        >
          Open USA trade chart
        </Button>
      </section>

      <hr className="rule" />

      <p className="kicker">Reference · sample</p>
      <h2 className="page-h2">Modeled system snapshot</h2>
      <p className="sub">
        The metrics below remain scenario-scale placeholders for multi-year planning. Live CAISO
        values are above.
      </p>

      <div className="metric-strip fadein t2">
        <button type="button" className="metric" onClick={() => setDrilldown('kpi:peak-load')}>
          <span className="metric-label">Peak load</span>
          <span className="metric-value">
            {kpis.peakLoadGw}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">+2.1% vs prior year</span>
        </button>
        <button type="button" className="metric" onClick={() => setDrilldown('kpi:clean-share')}>
          <span className="metric-label">Clean share</span>
          <span className="metric-value">
            {kpis.cleanEnergySharePct}
            <span className="metric-unit">%</span>
          </span>
          <span className="metric-hint">+3.4% vs prior year</span>
        </button>
        <button type="button" className="metric" onClick={() => setDrilldown('kpi:reserve')}>
          <span className="metric-label">Reserve margin</span>
          <span className="metric-value">
            {kpis.reserveMarginPct}
            <span className="metric-unit">%</span>
          </span>
          <span className="metric-hint">−0.8% vs prior year</span>
        </button>
        <button type="button" className="metric" onClick={() => setDrilldown('kpi:emissions')}>
          <span className="metric-label">Emissions</span>
          <span className="metric-value">
            {kpis.emissionsMt}
            <span className="metric-unit">Mt</span>
          </span>
          <span className="metric-hint">−4.2% vs prior year</span>
        </button>
      </div>

      <div className="fadein t3">
        <div className="block-head">
          <div>
            <p className="kicker">Grid</p>
            <h2 className="page-h2">System read</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              {filters.year}
              {filters.region !== 'all' ? ` · ${filters.region}` : ' · statewide'}
              {drilldown ? ` · ${drilldown}` : ''}
            </p>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setView('scenarios')
                window.history.replaceState(null, '', '#scenario')
              }}
            >
              Open scenario
            </button>
            {drilldown && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDrilldown(null)}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="filters">
          <Select
            label="Year"
            value={filters.year}
            onChange={(e) => setFilters({ year: Number(e.target.value) })}
            options={[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => ({
              value: y,
              label: String(y),
            }))}
          />
          <Select
            label="Month"
            value={filters.month}
            onChange={(e) =>
              setFilters({ month: e.target.value === 'all' ? 'all' : Number(e.target.value) })
            }
            options={[
              { value: 'all', label: 'All' },
              ...Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(2000, i).toLocaleString('en', { month: 'short' }),
              })),
            ]}
          />
          <Select
            label="Tech"
            value={filters.technology}
            onChange={(e) => setFilters({ technology: e.target.value as Technology | 'all' })}
            options={[
              { value: 'all', label: 'All' },
              ...Object.entries(TECH_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          <Select
            label="Region"
            value={filters.region}
            onChange={(e) => setFilters({ region: e.target.value as CARegion | 'all' })}
            options={[
              { value: 'all', label: 'Statewide' },
              'Northern CA',
              'Bay Area',
              'Central Valley',
              'Central Coast',
              'Southern CA',
              'Desert / Inland Empire',
            ].map((r) => (typeof r === 'string' ? { value: r, label: r } : r))}
          />
        </div>

        <table className="list-table" style={{ marginBottom: '1.25rem' }}>
          <tbody>
            <tr>
              <th scope="row">Capacity</th>
              <td>
                {kpis.totalCapacityGw} GW nameplate · battery {kpis.batteryCapacityGw} GW · net
                imports {kpis.netImportsGw} GW
              </td>
            </tr>
            <tr>
              <th scope="row">Storage day</th>
              <td>~{kpis.batteryDischargeGwh} GWh discharge on a sample peak evening</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="rule fadein t3" />

      <div className="fadein t3">
        <EnergyPathwayMap />
      </div>

      <hr className="rule" />

      <div className="grid-2 fadein t4">
        <section className="block">
          <p className="kicker">Capacity</p>
          <h2 className="page-h2">By technology</h2>
          <p className="sub">Nameplate GW - click a bar to drill down.</p>
          <div className="chart-box">
            <CapacityBarChart data={capacity} height={240} />
          </div>
        </section>
        <section className="block">
          <div className="block-head">
            <div>
              <p className="kicker">Generation</p>
              <h2 className="page-h2">Sample day mix</h2>
            </div>
            <Tabs
              tabs={[
                { id: 'stacked', label: 'Stacked' },
                { id: 'load', label: 'Load vs gen' },
              ]}
              active={mixTab}
              onChange={setMixTab}
            />
          </div>
          <div className="chart-box">
            <GenerationMixChart data={hourly} stacked={mixTab === 'stacked'} height={240} />
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="block">
          <p className="kicker">Shape</p>
          <h2 className="page-h2">Load & generation</h2>
          <p className="sub">Net demand with solar and wind contribution.</p>
          <div className="chart-box">
            <LoadGenerationChart data={hourly} height={240} />
          </div>
        </section>
        <section className="block">
          <p className="kicker">Share</p>
          <h2 className="page-h2">Annualized energy</h2>
          <p className="sub">Click a row to focus that technology.</p>
          {generation
            .slice()
            .sort((a, b) => b.share - a.share)
            .map((g) => (
              <button
                key={g.technology}
                type="button"
                className="share-row"
                onClick={() => setDrilldown(`gen:${g.technology}`)}
              >
                <span className="mono muted" style={{ width: '5.5rem', fontSize: '0.7rem' }}>
                  {TECH_LABELS[g.technology]}
                </span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${g.share}%` }} />
                </div>
                <span className="mono" style={{ width: '2.75rem', textAlign: 'right', color: 'var(--highlight)' }}>
                  {g.share.toFixed(1)}%
                </span>
                <span className="mono muted" style={{ width: '3.25rem', textAlign: 'right' }}>
                  {formatNumber(g.mwh / 1e6, 1)} TWh
                </span>
              </button>
            ))}
        </section>
      </div>

      <hr className="rule" />

      <div className="grid-3">
        <section className="block">
          <p className="kicker">Place</p>
          <h2 className="page-h2">Regions</h2>
          <p className="sub">Click to filter the view.</p>
          <CAMap data={regional} />
        </section>
        <section className="block">
          <p className="kicker">Interties</p>
          <h2 className="page-h2">Flows</h2>
          <p className="sub">Imports, exports, internal paths.</p>
          <FlowView flows={flows} />
        </section>
        <section className="block">
          <p className="kicker">Policy</p>
          <h2 className="page-h2">Targets</h2>
          <table className="list-table">
            <tbody>
              {POLICY_TARGETS.map((t) => (
                <tr key={t.id}>
                  <th scope="row">{t.year}</th>
                  <td>
                    {t.name} - {t.targetValue}
                    {t.unit}
                    <div className="mono muted" style={{ marginTop: 2 }}>
                      {t.source}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Registry</p>
        <h2 className="page-h2">Notable plants</h2>
        <p className="sub">Sample nameplate entries from the plant registry.</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plant</th>
                <th>Tech</th>
                <th>Region</th>
                <th style={{ textAlign: 'right' }}>MW</th>
                <th>Operator</th>
                <th>Online</th>
              </tr>
            </thead>
            <tbody>
              {PLANTS.filter(
                (p) =>
                  (filters.technology === 'all' || p.technology === filters.technology) &&
                  (filters.region === 'all' || p.region === filters.region)
              ).map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--highlight)', fontWeight: 500 }}>{p.name}</td>
                  <td>
                    <Badge>{TECH_LABELS[p.technology]}</Badge>
                  </td>
                  <td>{p.region}</td>
                  <td className="num">{p.capacityMw}</td>
                  <td>{p.operator}</td>
                  <td className="mono muted">{p.onlineYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line">
        Overview · mock CEC / CAISO / EIA-scale values ·{' '}
        <a href="#scenario" onClick={() => setView('scenarios')}>
          Scenario
        </a>{' '}
        ·{' '}
        <a href="#research" onClick={() => setView('research')}>
          Research
        </a>
      </p>
    </div>
  )
}
