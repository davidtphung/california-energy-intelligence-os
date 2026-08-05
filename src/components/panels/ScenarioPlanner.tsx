import { useState } from 'react'
import { useApp } from '../../context/AppContext'
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
  const tick = theme === 'dark' ? '#ffffff73' : '#5c6b7f'
  const grid = theme === 'dark' ? '#ffffff14' : '#0b12201f'

  const trajectory = activeScenario.outputs.map((o) => ({
    year: String(o.year),
    emissions: o.emissionsMt,
    cleanShare: o.cleanEnergySharePct,
    reserve: o.reserveMarginPct,
    cost: o.systemCostBillion,
  }))

  return (
    <div className="animate-in stack">
      <section className="hero">
        <p className="section-label">What-if</p>
        <h1 className="page-title gradient-text">Scenario planner</h1>
        <p className="lede">
          Tune demand, buildout, retirements, hydro, imports, and policy. Outputs update live for
          2030, 2035, and 2045.
        </p>
      </section>

      <section className="tray panel" id="scenario">
        <div className="panel-head">
          <div>
            <p className="section-label">Active case</p>
            <h2 className="page-h2">{activeScenario.name}</h2>
            <p className="status-line">{activeScenario.description}</p>
          </div>
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

        <div className="chip-row" style={{ marginBottom: '1.1rem' }}>
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip${s.id === activeScenario.id ? ' active' : ''}`}
              onClick={() => setActiveScenarioId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="grid-2">
          <div className="stack" style={{ gap: '1rem', maxWidth: 440 }}>
            <p className="section-label tight">Assumptions</p>
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

            <div className="result-bar">
              <span>Clean share · {horizon}</span>
              <strong className="mono">{out.cleanEnergySharePct.toFixed(1)}%</strong>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Input
                placeholder="Preset name…"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                aria-label="Scenario preset name"
              />
              <Button
                variant="primary"
                icon={<Save className="h-3.5 w-3.5" />}
                disabled={!presetName.trim()}
                onClick={() => {
                  saveScenarioPreset(presetName.trim())
                  setPresetName('')
                }}
              >
                Save
              </Button>
              <Button
                icon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => setActiveScenarioId('base')}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="stack">
            <div className="grid-3">
              {[
                { label: 'Capacity need', value: out.capacityNeedGw, unit: 'GW' },
                { label: 'Emissions', value: out.emissionsMt, unit: 'Mt' },
                { label: 'Reserve margin', value: out.reserveMarginPct, unit: '%' },
                { label: 'System cost', value: out.systemCostBillion, unit: '$B' },
                { label: 'Peak load', value: out.peakLoadGw, unit: 'GW' },
                { label: 'Storage', value: out.storageGw, unit: 'GW' },
              ].map((m) => (
                <div key={m.label} className="card-solid block">
                  <p className="section-label">{m.label}</p>
                  <span className="stat-value mono" style={{ fontSize: '1.35rem' }}>
                    {m.value.toFixed(1)}
                    <span className="stat-unit">{m.unit}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="card-solid block">
              <p className="section-label">Trajectory</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trajectory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: tick, fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: tick, fontSize: 11 }} axisLine={false} width={36} />
                  <Tooltip
                    contentStyle={{
                      background: theme === 'dark' ? '#0a0a0a' : '#fff',
                      border: `1px solid ${grid}`,
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cleanShare" name="Clean %" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="emissions" name="Emissions" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="reserve" name="Reserve %" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cost" name="Cost $B" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="tray panel">
        <div className="panel-head">
          <div>
            <p className="section-label">Compare</p>
            <h2 className="page-h2">Scenario table · {horizon}</h2>
          </div>
          <Badge variant="info">{scenarios.length} cases</Badge>
        </div>
        <ScenarioCompareTable
          scenarios={scenarios.slice(0, 5)}
          year={year}
          activeId={activeScenario.id}
          onSelect={setActiveScenarioId}
        />
      </section>

      <section className="panel" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <p className="section-label">Library</p>
        <h2 className="page-h2">Presets</h2>
        <p className="sub">Start from a published case.</p>
        <div className="grid-3">
          {PRESET_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`card block${activeScenario.id === s.id ? ' stat-glow' : ''}`}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: activeScenario.id === s.id ? 'var(--accent-border)' : undefined,
              }}
              onClick={() => setActiveScenarioId(s.id)}
            >
              <strong style={{ display: 'block', fontSize: '0.92rem' }}>{s.name}</strong>
              <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.8rem' }}>
                {s.description}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
