import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Slider } from '../ui/Slider'
import { Button } from '../ui/Button'
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
  const tick = 'var(--chart-tick)'
  const grid = 'var(--chart-grid)'

  const trajectory = activeScenario.outputs.map((o) => ({
    year: String(o.year),
    emissions: o.emissionsMt,
    cleanShare: o.cleanEnergySharePct,
    reserve: o.reserveMarginPct,
    cost: o.systemCostBillion,
  }))

  return (
    <div id="scenario">
      <div className="intro fadein t1">
        <strong>Scenario</strong>
        <p>
          Adjust global drivers - demand, buildout, retirements, hydro, imports, policy. Projected
          system metrics for 2030 / 2035 / 2045 update live. Editing a preset clones it so originals
          stay intact.
        </p>
      </div>

      <div className="chip-row fadein t2" style={{ marginBottom: '1rem' }}>
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

      <div className="block-head fadein t2">
        <div>
          <p className="kicker">Active</p>
          <h2 className="page-h2">{activeScenario.name}</h2>
          <p className="sub" style={{ marginBottom: 0 }}>
            {activeScenario.description}
          </p>
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

      <div className="grid-2 fadein t3">
        <div className="scenario-form">
          <p className="kicker">Assumptions</p>
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
            <strong>{out.cleanEnergySharePct.toFixed(1)}%</strong>
          </div>

          <div className="btn-row" style={{ marginTop: '0.35rem' }}>
            <Input
              placeholder="Name this preset…"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              aria-label="Preset name"
              style={{ minWidth: '10rem' }}
            />
            <Button
              variant="primary"
              disabled={!presetName.trim()}
              onClick={() => {
                saveScenarioPreset(presetName.trim())
                setPresetName('')
              }}
            >
              Save
            </Button>
            <Button onClick={() => setActiveScenarioId('base')}>Reset</Button>
          </div>
        </div>

        <div>
          <p className="kicker">Outputs · {horizon}</p>
          <table className="list-table" style={{ marginBottom: '1.25rem' }}>
            <tbody>
              {[
                { label: 'Capacity need', value: `${out.capacityNeedGw.toFixed(1)} GW` },
                { label: 'Emissions', value: `${out.emissionsMt.toFixed(1)} Mt` },
                { label: 'Reserve margin', value: `${out.reserveMarginPct.toFixed(1)}%` },
                { label: 'System cost', value: `$${out.systemCostBillion.toFixed(1)}B` },
                { label: 'Peak load', value: `${out.peakLoadGw.toFixed(1)} GW` },
                { label: 'Storage', value: `${out.storageGw.toFixed(1)} GW` },
              ].map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--highlight)' }}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="kicker">Trajectory</p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  contentStyle={{
                    background: theme === 'dark' ? '#1c1a17' : '#ffffff',
                    border: '1px solid var(--line)',
                    borderRadius: 2,
                    fontSize: 12,
                    color: 'var(--ink)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cleanShare" name="Clean %" stroke="var(--highlight)" strokeWidth={1.75} dot={false} />
                <Line type="monotone" dataKey="emissions" name="Emissions" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="reserve" name="Reserve %" stroke="#0ea5e9" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="cost" name="Cost $B" stroke="#b45309" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Compare</p>
        <h2 className="page-h2">Side-by-side · {horizon}</h2>
        <p className="sub">Best values highlight in green.</p>
        <ScenarioCompareTable
          scenarios={scenarios.slice(0, 5)}
          year={year}
          activeId={activeScenario.id}
          onSelect={setActiveScenarioId}
        />
      </section>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Library</p>
        <h2 className="page-h2">Presets</h2>
        <table className="list-table">
          <tbody>
            {PRESET_SCENARIOS.map((s) => (
              <tr key={s.id}>
                <th scope="row">
                  <button
                    type="button"
                    onClick={() => setActiveScenarioId(s.id)}
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      font: 'inherit',
                      fontWeight: 600,
                      color: 'var(--highlight)',
                      cursor: 'pointer',
                    }}
                  >
                    {s.name}
                  </button>
                </th>
                <td>{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="footer-line">Scenario · what-if pathways · 2030-2045</p>
    </div>
  )
}
