import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Card } from '../ui/Card'
import { Slider } from '../ui/Slider'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { Tabs } from '../ui/Tabs'
import { ScenarioCompareTable } from '../charts/ScenarioCompareTable'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Save, RotateCcw } from 'lucide-react'
import { PRESET_SCENARIOS } from '../../data/mockData'

export function ScenarioPlanner() {
  const {
    scenarios,
    activeScenario,
    setActiveScenarioId,
    updateAssumptions,
    saveScenarioPreset,
    theme,
  } = useApp()
  const [horizon, setHorizon] = useState<'2030' | '2035' | '2045'>('2035')
  const [presetName, setPresetName] = useState('')
  const a = activeScenario.assumptions
  const year = Number(horizon) as 2030 | 2035 | 2045
  const out = activeScenario.outputs.find((o) => o.year === year)!
  const tick = theme === 'dark' ? '#94a3b8' : '#64748b'
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0'

  const trajectory = activeScenario.outputs.map((o) => ({
    year: String(o.year),
    emissions: o.emissionsMt,
    cleanShare: o.cleanEnergySharePct,
    reserve: o.reserveMarginPct,
    cost: o.systemCostBillion,
    peak: o.peakLoadGw,
  }))

  const resetToBase = () => {
    setActiveScenarioId('base')
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Scenario Planner
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tune demand, buildout, retirements, hydro, imports, and policy — outputs for 2030, 2035,
            2045.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            tabs={[
              { id: '2030', label: '2030' },
              { id: '2035', label: '2035' },
              { id: '2045', label: '2045' },
            ]}
            active={horizon}
            onChange={(id) => setHorizon(id as typeof horizon)}
          />
        </div>
      </div>

      {/* Scenario chips */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveScenarioId(s.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              s.id === activeScenario.id
                ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {s.name}
            {s.isPreset && (
              <span className="ml-1.5 opacity-60">preset</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Assumptions */}
        <Card
          title="Assumptions"
          subtitle={activeScenario.description}
          className="lg:col-span-2"
          action={
            <Button variant="ghost" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={resetToBase}>
              Reset
            </Button>
          }
        >
          <div className="space-y-5">
            <Slider
              label="Demand growth"
              value={a.demandGrowthPct}
              min={0}
              max={5}
              step={0.1}
              unit="%/yr"
              onChange={(v) => updateAssumptions({ demandGrowthPct: v })}
            />
            <Slider
              label="Solar buildout"
              value={a.solarBuildoutGw}
              min={0}
              max={100}
              step={1}
              unit="GW"
              onChange={(v) => updateAssumptions({ solarBuildoutGw: v })}
            />
            <Slider
              label="Wind buildout"
              value={a.windBuildoutGw}
              min={0}
              max={50}
              step={1}
              unit="GW"
              onChange={(v) => updateAssumptions({ windBuildoutGw: v })}
            />
            <Slider
              label="Storage buildout"
              value={a.storageBuildoutGw}
              min={0}
              max={80}
              step={1}
              unit="GW"
              onChange={(v) => updateAssumptions({ storageBuildoutGw: v })}
            />
            <Slider
              label="Gas retirements"
              value={a.gasRetirementsGw}
              min={0}
              max={30}
              step={0.5}
              unit="GW"
              onChange={(v) => updateAssumptions({ gasRetirementsGw: v })}
            />
            <Slider
              label="Hydro variability"
              value={a.hydroVariability}
              min={0.7}
              max={1.3}
              step={0.05}
              unit="×"
              onChange={(v) => updateAssumptions({ hydroVariability: v })}
            />
            <Slider
              label="Import level"
              value={a.importLevelGw}
              min={0}
              max={15}
              step={0.5}
              unit="GW"
              onChange={(v) => updateAssumptions({ importLevelGw: v })}
            />
            <Slider
              label="Clean energy target"
              value={a.cleanEnergyTargetPct}
              min={60}
              max={100}
              step={1}
              unit="%"
              onChange={(v) => updateAssumptions({ cleanEnergyTargetPct: v })}
            />
            <Slider
              label="Carbon price"
              value={a.carbonPrice}
              min={0}
              max={150}
              step={5}
              unit="$/t"
              onChange={(v) => updateAssumptions({ carbonPrice: v })}
            />

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row">
              <Input
                placeholder="Preset name…"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1"
                aria-label="Scenario preset name"
              />
              <Button
                icon={<Save className="h-3.5 w-3.5" />}
                disabled={!presetName.trim()}
                onClick={() => {
                  saveScenarioPreset(presetName.trim())
                  setPresetName('')
                }}
              >
                Save preset
              </Button>
            </div>
          </div>
        </Card>

        {/* Outputs */}
        <div className="space-y-4 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Capacity need', value: out.capacityNeedGw, unit: 'GW', accent: 'text-sky-600' },
              { label: 'Emissions', value: out.emissionsMt, unit: 'Mt', accent: 'text-violet-600' },
              { label: 'Reserve margin', value: out.reserveMarginPct, unit: '%', accent: 'text-emerald-600' },
              { label: 'System cost', value: out.systemCostBillion, unit: '$B', accent: 'text-amber-600' },
              { label: 'Clean share', value: out.cleanEnergySharePct, unit: '%', accent: 'text-emerald-600' },
              { label: 'Peak load', value: out.peakLoadGw, unit: 'GW', accent: 'text-rose-600' },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-slate-200 bg-white p-3 card-shadow dark:border-slate-800 dark:bg-slate-900/90"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {m.label}
                </p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${m.accent} dark:opacity-90`}>
                  {m.value.toFixed(1)}
                  <span className="ml-1 text-sm font-medium text-slate-400">{m.unit}</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{horizon} horizon</p>
              </div>
            ))}
          </div>

          <Card title="Trajectory" subtitle={`${activeScenario.name} · multi-year path`}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: tick, fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: tick, fontSize: 11 }} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: theme === 'dark' ? '#0f172a' : '#fff',
                    border: `1px solid ${grid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cleanShare" name="Clean %" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="emissions" name="Emissions Mt" stroke="#a78bfa" strokeWidth={2} />
                <Line type="monotone" dataKey="reserve" name="Reserve %" stroke="#0ea5e9" strokeWidth={2} />
                <Line type="monotone" dataKey="cost" name="Cost $B" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card
            title="Scenario Comparison"
            subtitle={`Side-by-side metrics for ${horizon}`}
            action={<Badge variant="info">{scenarios.length} scenarios</Badge>}
          >
            <ScenarioCompareTable
              scenarios={scenarios.slice(0, 5)}
              year={year}
              activeId={activeScenario.id}
              onSelect={setActiveScenarioId}
            />
          </Card>
        </div>
      </div>

      <Card title="Preset library" subtitle="Start from a published case">
        <div className="grid gap-3 sm:grid-cols-3">
          {PRESET_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveScenarioId(s.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                activeScenario.id === s.id
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                  : 'border-slate-200 hover:border-sky-300 dark:border-slate-700'
              }`}
            >
              <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.description}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
