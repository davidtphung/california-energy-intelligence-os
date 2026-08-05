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
import { CapacityBarChart } from '../charts/CapacityBarChart'
import { GenerationMixChart } from '../charts/GenerationMixChart'
import { LoadGenerationChart } from '../charts/LoadGenerationChart'
import { FlowView } from '../charts/FlowView'
import { CAMap } from '../charts/CAMap'
import { TECH_LABELS, formatNumber } from '../../lib/utils'
import type { Technology, CARegion } from '../../types'

export function OverviewDashboard() {
  const { filters, setFilters, setDrilldown, drilldown } = useApp()
  const [mixTab, setMixTab] = useState('stacked')

  const kpis = useMemo(() => getKPIs(filters), [filters])
  const capacity = useMemo(() => getCapacityByTech(filters), [filters])
  const generation = useMemo(() => getGenerationBySource(filters), [filters])
  const hourly = useMemo(() => getHourlySeries(filters), [filters])
  const flows = useMemo(() => getTransmissionFlows(), [])
  const regional = useMemo(() => getRegionalCapacity(filters), [filters])

  return (
    <div className="animate-in stack">
      <section className="hero">
        <p className="section-label">California · Electricity · Systems</p>
        <h1 className="page-title gradient-text">Read the grid at a glance</h1>
        <p className="lede">
          Capacity, generation mix, load, storage, and intertie flows with realistic sample data.
          Filter by year, tech, or region — click any chart to drill down.
        </p>

        <div className="stat-row" style={{ marginBottom: '0.25rem' }}>
          <button type="button" className="card stat-card stat-glow" onClick={() => setDrilldown('kpi:peak-load')}>
            <span className="section-label">Peak load</span>
            <span className="stat-value mono">
              {kpis.peakLoadGw}
              <span className="stat-unit">GW</span>
            </span>
            <span className="stat-delta">+2.1% vs prior year</span>
          </button>
          <button type="button" className="card stat-card stat-glow" onClick={() => setDrilldown('kpi:clean-share')}>
            <span className="section-label">Clean share</span>
            <span className="stat-value mono">
              {kpis.cleanEnergySharePct}
              <span className="stat-unit">%</span>
            </span>
            <span className="stat-delta">+3.4% vs prior year</span>
          </button>
          <button type="button" className="card stat-card stat-glow" onClick={() => setDrilldown('kpi:reserve-margin')}>
            <span className="section-label">Reserve margin</span>
            <span className="stat-value mono">
              {kpis.reserveMarginPct}
              <span className="stat-unit">%</span>
            </span>
            <span className="stat-delta">−0.8% vs prior year</span>
          </button>
          <button type="button" className="card stat-card stat-glow" onClick={() => setDrilldown('kpi:emissions')}>
            <span className="section-label">Emissions</span>
            <span className="stat-value mono">
              {kpis.emissionsMt}
              <span className="stat-unit">Mt</span>
            </span>
            <span className="stat-delta">−4.2% vs prior year</span>
          </button>
        </div>
      </section>

      <section className="tray panel">
        <div className="panel-head">
          <div>
            <p className="section-label">Explorer</p>
            <h2 className="page-h2">System overview</h2>
            <p className="status-line">
              {filters.year}
              {filters.region !== 'all' ? ` · ${filters.region}` : ' · Statewide'}
              {drilldown ? ` · ${drilldown}` : ''}
            </p>
          </div>
          <div className="btn-row">
            <Badge variant="info">Mock data</Badge>
            {drilldown && (
              <button type="button" className="btn btn-sm" onClick={() => setDrilldown(null)}>
                Clear drilldown
              </button>
            )}
          </div>
        </div>

        <div className="filter-bar">
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
            label="Technology"
            value={filters.technology}
            onChange={(e) => setFilters({ technology: e.target.value as Technology | 'all' })}
            options={[
              { value: 'all', label: 'All tech' },
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

        <div className="stat-row" style={{ marginBottom: '1rem' }}>
          <div className="card-solid block">
            <p className="section-label">Total capacity</p>
            <span className="stat-value mono" style={{ fontSize: '1.35rem' }}>
              {kpis.totalCapacityGw}
              <span className="stat-unit">GW</span>
            </span>
          </div>
          <div className="card-solid block">
            <p className="section-label">Battery storage</p>
            <span className="stat-value mono" style={{ fontSize: '1.35rem' }}>
              {kpis.batteryCapacityGw}
              <span className="stat-unit">GW</span>
            </span>
          </div>
          <div className="card-solid block">
            <p className="section-label">Battery discharge</p>
            <span className="stat-value mono" style={{ fontSize: '1.35rem' }}>
              {kpis.batteryDischargeGwh}
              <span className="stat-unit">GWh/d</span>
            </span>
          </div>
          <div className="card-solid block">
            <p className="section-label">Net imports</p>
            <span className="stat-value mono" style={{ fontSize: '1.35rem' }}>
              {kpis.netImportsGw}
              <span className="stat-unit">GW</span>
            </span>
          </div>
        </div>

        <div className="grid-2">
          <div className="card-solid block">
            <p className="section-label">Capacity by technology</p>
            <CapacityBarChart data={capacity} height={260} />
          </div>
          <div className="card-solid block">
            <div className="panel-head" style={{ marginBottom: '0.5rem' }}>
              <p className="section-label" style={{ margin: 0 }}>
                Generation mix
              </p>
              <Tabs
                tabs={[
                  { id: 'stacked', label: 'Stacked' },
                  { id: 'load', label: 'Load vs gen' },
                ]}
                active={mixTab}
                onChange={setMixTab}
              />
            </div>
            <GenerationMixChart data={hourly} stacked={mixTab === 'stacked'} height={260} />
          </div>
        </div>
      </section>

      <div className="grid-2">
        <section className="tray panel">
          <p className="section-label">Load shape</p>
          <h2 className="page-h2">Load & generation</h2>
          <p className="sub">Sample day profile with solar and wind contribution.</p>
          <LoadGenerationChart data={hourly} height={260} />
        </section>

        <section className="tray panel">
          <p className="section-label">Energy mix</p>
          <h2 className="page-h2">Generation share</h2>
          <p className="sub">Annualized energy by technology.</p>
          <div className="stack" style={{ gap: '0.55rem' }}>
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
                  <span className="mono muted" style={{ width: '5.5rem', fontSize: '0.72rem' }}>
                    {TECH_LABELS[g.technology]}
                  </span>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${g.share}%` }} />
                  </div>
                  <span className="mono" style={{ width: '3rem', textAlign: 'right' }}>
                    {g.share.toFixed(1)}%
                  </span>
                  <span className="mono muted" style={{ width: '3.5rem', textAlign: 'right' }}>
                    {formatNumber(g.mwh / 1e6, 1)} TWh
                  </span>
                </button>
              ))}
          </div>
        </section>
      </div>

      <div className="grid-3">
        <section className="tray panel">
          <p className="section-label">Geography</p>
          <h2 className="page-h2">Regions</h2>
          <p className="sub">Click a region to filter.</p>
          <CAMap data={regional} />
        </section>

        <section className="tray panel">
          <p className="section-label">Interties</p>
          <h2 className="page-h2">Flows</h2>
          <p className="sub">Imports, exports, internal paths.</p>
          <FlowView flows={flows} />
        </section>

        <section className="tray panel">
          <p className="section-label">Policy</p>
          <h2 className="page-h2">Targets</h2>
          <p className="sub">Key milestones.</p>
          <div className="stack" style={{ gap: '0.65rem' }}>
            {POLICY_TARGETS.map((t) => (
              <div key={t.id} className="card-solid block">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t.name}</span>
                  <Badge variant={t.year <= 2030 ? 'warning' : 'info'}>{t.year}</Badge>
                </div>
                <div className="stat-value mono" style={{ fontSize: '1.25rem', marginTop: 6 }}>
                  {t.targetValue}
                  <span className="stat-unit">{t.unit}</span>
                </div>
                <p className="mono muted" style={{ margin: '4px 0 0' }}>
                  {t.source}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="tray panel">
        <p className="section-label">Registry</p>
        <h2 className="page-h2">Notable plants</h2>
        <p className="sub">Sample nameplate capacity entries.</p>
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
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>{p.name}</td>
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
    </div>
  )
}
