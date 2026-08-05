import {
  Activity,
  Battery,
  Leaf,
  Gauge,
  Cloud,
  Zap,
  ArrowLeftRight,
} from 'lucide-react'
import { useMemo } from 'react'
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
import { KPITile } from '../ui/KPITile'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { CapacityBarChart } from '../charts/CapacityBarChart'
import { GenerationMixChart } from '../charts/GenerationMixChart'
import { LoadGenerationChart } from '../charts/LoadGenerationChart'
import { FlowView } from '../charts/FlowView'
import { CAMap } from '../charts/CAMap'
import { TECH_LABELS, formatNumber } from '../../lib/utils'
import { Tabs } from '../ui/Tabs'
import { useState } from 'react'

export function OverviewDashboard() {
  const { filters, setDrilldown } = useApp()
  const [mixTab, setMixTab] = useState('stacked')

  const kpis = useMemo(() => getKPIs(filters), [filters])
  const capacity = useMemo(() => getCapacityByTech(filters), [filters])
  const generation = useMemo(() => getGenerationBySource(filters), [filters])
  const hourly = useMemo(() => getHourlySeries(filters), [filters])
  const flows = useMemo(() => getTransmissionFlows(), [])
  const regional = useMemo(() => getRegionalCapacity(filters), [filters])

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            System Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Installed capacity, generation mix, load, storage, and intertie flows — {filters.year}
            {filters.region !== 'all' ? ` · ${filters.region}` : ' · Statewide'}
          </p>
        </div>
        <Badge variant="info">Mock data · API-ready schema</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-4">
        <KPITile
          label="Peak Load"
          value={kpis.peakLoadGw}
          unit="GW"
          delta={2.1}
          deltaLabel="vs prior year"
          icon={<Activity className="h-4 w-4" />}
          accent="rose"
          onClick={() => setDrilldown('kpi:peak-load')}
        />
        <KPITile
          label="Clean Energy Share"
          value={kpis.cleanEnergySharePct}
          unit="%"
          delta={3.4}
          deltaLabel="vs prior year"
          icon={<Leaf className="h-4 w-4" />}
          accent="emerald"
          onClick={() => setDrilldown('kpi:clean-share')}
        />
        <KPITile
          label="Reserve Margin"
          value={kpis.reserveMarginPct}
          unit="%"
          delta={-0.8}
          deltaLabel="vs prior year"
          icon={<Gauge className="h-4 w-4" />}
          accent="sky"
          onClick={() => setDrilldown('kpi:reserve-margin')}
        />
        <KPITile
          label="Emissions"
          value={kpis.emissionsMt}
          unit="Mt CO₂e"
          delta={-4.2}
          deltaLabel="vs prior year"
          icon={<Cloud className="h-4 w-4" />}
          accent="violet"
          onClick={() => setDrilldown('kpi:emissions')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPITile
          label="Total Capacity"
          value={kpis.totalCapacityGw}
          unit="GW"
          icon={<Zap className="h-4 w-4" />}
          accent="amber"
          onClick={() => setDrilldown('kpi:capacity')}
        />
        <KPITile
          label="Battery Storage"
          value={kpis.batteryCapacityGw}
          unit="GW"
          delta={18}
          deltaLabel="YoY buildout"
          icon={<Battery className="h-4 w-4" />}
          accent="emerald"
          onClick={() => setDrilldown('kpi:battery')}
        />
        <KPITile
          label="Battery Discharge"
          value={kpis.batteryDischargeGwh}
          unit="GWh/day"
          icon={<Battery className="h-4 w-4" />}
          accent="sky"
          onClick={() => setDrilldown('kpi:battery-discharge')}
        />
        <KPITile
          label="Net Imports"
          value={kpis.netImportsGw}
          unit="GW avg"
          icon={<ArrowLeftRight className="h-4 w-4" />}
          accent="slate"
          onClick={() => setDrilldown('kpi:imports')}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Installed Capacity by Technology"
          subtitle="Nameplate capacity (GW) — click bar to drill down"
          interactive
          className="animate-slide-up"
        >
          <CapacityBarChart data={capacity} />
        </Card>

        <Card
          title="Generation Mix (Sample Day)"
          subtitle="Hourly stacked generation by source"
          action={
            <Tabs
              tabs={[
                { id: 'stacked', label: 'Stacked' },
                { id: 'load', label: 'Load vs Gen' },
              ]}
              active={mixTab}
              onChange={setMixTab}
            />
          }
          className="animate-slide-up"
        >
          <GenerationMixChart data={hourly} stacked={mixTab === 'stacked'} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Load & Generation Profile"
          subtitle="Net demand shape with solar/wind contribution"
          className="animate-slide-up"
        >
          <LoadGenerationChart data={hourly} />
        </Card>

        <Card
          title="Generation Share"
          subtitle="Annualized energy by technology"
          className="animate-slide-up"
        >
          <div className="space-y-2.5">
            {generation
              .slice()
              .sort((a, b) => b.share - a.share)
              .map((g) => (
                <button
                  key={g.technology}
                  type="button"
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => setDrilldown(`gen:${g.technology}`)}
                >
                  <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                    {TECH_LABELS[g.technology]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-500"
                      style={{
                        width: `${g.share}%`,
                        backgroundColor:
                          g.technology === 'solar'
                            ? '#f59e0b'
                            : g.technology === 'wind'
                              ? '#38bdf8'
                              : g.technology === 'natural_gas'
                                ? '#94a3b8'
                                : g.technology === 'hydro'
                                  ? '#0ea5e9'
                                  : undefined,
                      }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                    {g.share.toFixed(1)}%
                  </span>
                  <span className="hidden w-20 shrink-0 text-right text-[11px] text-slate-400 sm:block">
                    {formatNumber(g.mwh / 1e6, 1)} TWh
                  </span>
                </button>
              ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="California Regions" subtitle="Click region to filter" className="lg:col-span-1">
          <CAMap data={regional} />
        </Card>

        <Card
          title="Imports, Exports & Interties"
          subtitle="Sankey-style flow magnitudes"
          className="lg:col-span-1"
        >
          <FlowView flows={flows} />
        </Card>

        <Card title="Policy Targets" subtitle="Key milestones" className="lg:col-span-1">
          <ul className="space-y-3">
            {POLICY_TARGETS.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.name}</p>
                  <Badge variant={t.year <= 2030 ? 'warning' : 'info'}>{t.year}</Badge>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold text-sky-600 dark:text-sky-400">
                  {t.targetValue}
                  {t.unit}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{t.source}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Notable Plants" subtitle="Sample registry entries">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="px-3 py-2 font-semibold">Plant</th>
                <th className="px-3 py-2 font-semibold">Tech</th>
                <th className="px-3 py-2 font-semibold">Region</th>
                <th className="px-3 py-2 font-semibold text-right">MW</th>
                <th className="px-3 py-2 font-semibold">Operator</th>
                <th className="px-3 py-2 font-semibold">Online</th>
              </tr>
            </thead>
            <tbody>
              {PLANTS.filter(
                (p) =>
                  (filters.technology === 'all' || p.technology === filters.technology) &&
                  (filters.region === 'all' || p.region === filters.region)
              ).map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100">
                    {p.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge>{TECH_LABELS[p.technology]}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{p.region}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{p.capacityMw}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{p.operator}</td>
                  <td className="px-3 py-2.5 text-slate-500">{p.onlineYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
