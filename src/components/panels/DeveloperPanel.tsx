import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  METRIC_DEFINITIONS,
  DATA_MODEL,
  getCapacityByTech,
  getGenerationBySource,
  getKPIs,
  PLANTS,
} from '../../data/mockData'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Tabs } from '../ui/Tabs'
import { exportCsv, exportJson } from '../../lib/utils'
import { Download, FileJson, Table2, Braces, AlertCircle } from 'lucide-react'

export function DeveloperPanel() {
  const { activeScenario, filters, updateAssumptions } = useApp()
  const [tab, setTab] = useState('config')
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(activeScenario.assumptions, null, 2)
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Sync editor when scenario changes
  useEffect(() => {
    setJsonText(JSON.stringify(activeScenario.assumptions, null, 2))
    setJsonError(null)
  }, [activeScenario.id, activeScenario.assumptions])

  const apiTables = useMemo(() => {
    const capacity = getCapacityByTech(filters)
    const generation = getGenerationBySource(filters)
    const kpis = getKPIs(filters)
    return {
      kpis: [kpis],
      capacity_by_tech: capacity,
      generation_by_source: generation,
      plants: PLANTS,
      scenario_outputs: activeScenario.outputs,
    }
  }, [filters, activeScenario])

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      updateAssumptions(parsed)
      setJsonError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Developer Panel
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Editable scenario config, metric definitions, API-ready tables, and exports.
          </p>
        </div>
        <Tabs
          tabs={[
            { id: 'config', label: 'JSON Config' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'tables', label: 'API Tables' },
            { id: 'export', label: 'Export' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'config' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            title="Scenario assumptions (JSON)"
            subtitle={activeScenario.name}
            action={<Braces className="h-4 w-4 text-slate-400" aria-hidden />}
          >
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                setJsonError(null)
              }}
              spellCheck={false}
              className="h-80 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              aria-label="Scenario JSON configuration"
            />
            {jsonError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {jsonError}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={applyJson}>Apply JSON</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setJsonText(JSON.stringify(activeScenario.assumptions, null, 2))
                  setJsonError(null)
                }}
              >
                Reset editor
              </Button>
              <Button
                variant="outline"
                icon={<FileJson className="h-3.5 w-3.5" />}
                onClick={() =>
                  exportJson(activeScenario, `scenario-${activeScenario.id}.json`)
                }
              >
                Download scenario
              </Button>
            </div>
          </Card>

          <Card title="Schema reference" subtitle="Expected assumption keys">
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300 scrollbar-thin">
{`{
  "demandGrowthPct": number,    // %/yr
  "solarBuildoutGw": number,
  "windBuildoutGw": number,
  "storageBuildoutGw": number,
  "gasRetirementsGw": number,
  "hydroVariability": number,   // 0.7–1.3
  "importLevelGw": number,
  "cleanEnergyTargetPct": number,
  "carbonPrice": number         // $/ton
}`}
            </pre>
            <p className="mt-3 text-xs text-slate-500">
              Editing a preset clones it to a custom scenario. Wire this payload to{' '}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">POST /api/scenarios</code>{' '}
              in production.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-500">Entities</p>
              {DATA_MODEL.map((e) => (
                <div
                  key={e.entity}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                >
                  <code className="text-xs text-sky-600 dark:text-sky-400">{e.entity}</code>
                  <span className="text-[11px] text-slate-400">{e.rows.toLocaleString()} rows</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="grid gap-3 md:grid-cols-2">
          {METRIC_DEFINITIONS.map((m) => (
            <Card key={m.id} title={m.name} subtitle={m.unit}>
              <p className="text-sm text-slate-600 dark:text-slate-300">{m.description}</p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-3 font-mono text-xs text-slate-700 dark:bg-slate-950 dark:text-emerald-300">
                {m.formula}
              </pre>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.sourceEntities.map((e) => (
                  <Badge key={e} variant="info">
                    {e}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'tables' && (
        <div className="space-y-4">
          {Object.entries(apiTables).map(([name, rows]) => (
            <Card
              key={name}
              title={name}
              subtitle={`${Array.isArray(rows) ? rows.length : 0} records · JSON serializable`}
              action={
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<FileJson className="h-3 w-3" />}
                    onClick={() => exportJson(rows, `${name}.json`)}
                  >
                    JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Table2 className="h-3 w-3" />}
                    onClick={() =>
                      exportCsv(rows as unknown as Record<string, unknown>[], `${name}.csv`)
                    }
                  >
                    CSV
                  </Button>
                </div>
              }
            >
              <div className="max-h-56 overflow-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-950 scrollbar-thin">
                <pre className="font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {JSON.stringify(rows, null, 2).slice(0, 2000)}
                  {JSON.stringify(rows).length > 2000 ? '\n…' : ''}
                </pre>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'export' && (
        <Card title="Export current view" subtitle="Download filtered datasets for analysis">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: 'Full dashboard snapshot',
                desc: 'Filters, KPIs, capacity, generation',
                action: () =>
                  exportJson(
                    {
                      filters,
                      kpis: getKPIs(filters),
                      capacity: getCapacityByTech(filters),
                      generation: getGenerationBySource(filters),
                      scenario: activeScenario,
                    },
                    'ceios-snapshot.json'
                  ),
              },
              {
                label: 'Capacity CSV',
                desc: 'Technology × MW capacity table',
                action: () =>
                  exportCsv(
                    getCapacityByTech(filters) as unknown as Record<string, unknown>[],
                    'capacity.csv'
                  ),
              },
              {
                label: 'Generation CSV',
                desc: 'Energy share by technology',
                action: () =>
                  exportCsv(
                    getGenerationBySource(filters) as unknown as Record<string, unknown>[],
                    'generation.csv'
                  ),
              },
              {
                label: 'Plants CSV',
                desc: 'Plant registry sample',
                action: () => exportCsv(PLANTS as unknown as Record<string, unknown>[], 'plants.csv'),
              },
              {
                label: 'Scenario JSON',
                desc: 'Active scenario + outputs',
                action: () => exportJson(activeScenario, 'scenario.json'),
              },
              {
                label: 'Metric catalog',
                desc: 'Definitions for API consumers',
                action: () => exportJson(METRIC_DEFINITIONS, 'metrics.json'),
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="flex flex-col items-start rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-sky-400 hover:shadow-md dark:border-slate-700 dark:hover:border-sky-500"
              >
                <Download className="mb-2 h-5 w-5 text-sky-500" aria-hidden />
                <p className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
