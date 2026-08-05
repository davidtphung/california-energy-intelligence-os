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
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Tabs } from '../ui/Tabs'
import { exportCsv, exportJson } from '../../lib/utils'
import { Download, FileJson, Table2, AlertCircle } from 'lucide-react'

export function DeveloperPanel() {
  const { activeScenario, filters, updateAssumptions } = useApp()
  const [tab, setTab] = useState('config')
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(activeScenario.assumptions, null, 2)
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    setJsonText(JSON.stringify(activeScenario.assumptions, null, 2))
    setJsonError(null)
  }, [activeScenario.id, activeScenario.assumptions])

  const apiTables = useMemo(() => {
    return {
      kpis: [getKPIs(filters)],
      capacity_by_tech: getCapacityByTech(filters),
      generation_by_source: getGenerationBySource(filters),
      plants: PLANTS,
      scenario_outputs: activeScenario.outputs,
    }
  }, [filters, activeScenario])

  const applyJson = () => {
    try {
      updateAssumptions(JSON.parse(jsonText))
      setJsonError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  return (
    <div className="animate-in stack">
      <section className="hero">
        <p className="section-label">API-ready</p>
        <h1 className="page-title gradient-text">Developer panel</h1>
        <p className="lede">
          Editable scenario config, metric definitions, tables, and export.
        </p>
        <Tabs
          tabs={[
            { id: 'config', label: 'JSON config' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'tables', label: 'API tables' },
            { id: 'export', label: 'Export' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </section>

      {tab === 'config' && (
        <div className="grid-2">
          <section className="tray panel">
            <p className="section-label">Scenario</p>
            <h2 className="page-h2">{activeScenario.name}</h2>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                setJsonError(null)
              }}
              spellCheck={false}
              className="code-block"
              style={{
                width: '100%',
                minHeight: 280,
                resize: 'vertical',
                marginTop: '0.75rem',
                color: 'var(--success)',
              }}
              aria-label="Scenario JSON configuration"
            />
            {jsonError && (
              <p
                className="mono"
                style={{ color: 'var(--danger)', display: 'flex', gap: 6, alignItems: 'center' }}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {jsonError}
              </p>
            )}
            <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: '0.75rem' }}>
              <Button variant="primary" onClick={applyJson}>
                Apply JSON
              </Button>
              <Button
                onClick={() => {
                  setJsonText(JSON.stringify(activeScenario.assumptions, null, 2))
                  setJsonError(null)
                }}
              >
                Reset
              </Button>
              <Button
                icon={<FileJson className="h-3.5 w-3.5" />}
                onClick={() => exportJson(activeScenario, `scenario-${activeScenario.id}.json`)}
              >
                Download
              </Button>
            </div>
          </section>

          <section className="tray panel">
            <p className="section-label">Schema</p>
            <h2 className="page-h2">Reference</h2>
            <pre className="code-block" style={{ marginTop: '0.75rem', color: 'var(--success)' }}>
{`{
  "demandGrowthPct": number,
  "solarBuildoutGw": number,
  "windBuildoutGw": number,
  "storageBuildoutGw": number,
  "gasRetirementsGw": number,
  "hydroVariability": number,
  "importLevelGw": number,
  "cleanEnergyTargetPct": number,
  "carbonPrice": number
}`}
            </pre>
            <div className="stack" style={{ gap: '0.35rem', marginTop: '1rem' }}>
              {DATA_MODEL.map((e) => (
                <div
                  key={e.entity}
                  className="card-solid block"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <code className="mono" style={{ color: 'var(--accent)' }}>
                    {e.entity}
                  </code>
                  <span className="mono muted">{e.rows.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="grid-2">
          {METRIC_DEFINITIONS.map((m) => (
            <section key={m.id} className="card panel">
              <p className="section-label">{m.unit}</p>
              <h2 className="page-h2">{m.name}</h2>
              <p className="sub">{m.description}</p>
              <pre className="code-block">{m.formula}</pre>
              <div className="chip-row" style={{ marginTop: '0.75rem' }}>
                {m.sourceEntities.map((e) => (
                  <Badge key={e} variant="info">
                    {e}
                  </Badge>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === 'tables' && (
        <div className="stack">
          {Object.entries(apiTables).map(([name, rows]) => (
            <section key={name} className="tray panel">
              <div className="panel-head">
                <div>
                  <p className="section-label">Table</p>
                  <h2 className="page-h2">{name}</h2>
                  <p className="status-line">
                    {Array.isArray(rows) ? rows.length : 0} records
                  </p>
                </div>
                <div className="btn-row">
                  <Button
                    size="sm"
                    icon={<FileJson className="h-3 w-3" />}
                    onClick={() => exportJson(rows, `${name}.json`)}
                  >
                    JSON
                  </Button>
                  <Button
                    size="sm"
                    icon={<Table2 className="h-3 w-3" />}
                    onClick={() =>
                      exportCsv(rows as unknown as Record<string, unknown>[], `${name}.csv`)
                    }
                  >
                    CSV
                  </Button>
                </div>
              </div>
              <pre className="code-block" style={{ maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(rows, null, 2).slice(0, 1800)}
                {JSON.stringify(rows).length > 1800 ? '\n…' : ''}
              </pre>
            </section>
          ))}
        </div>
      )}

      {tab === 'export' && (
        <section className="tray panel">
          <p className="section-label">Download</p>
          <h2 className="page-h2">Export current view</h2>
          <p className="sub">Filtered datasets for analysis.</p>
          <div className="grid-3">
            {[
              {
                label: 'Dashboard snapshot',
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
                desc: 'Technology × MW',
                action: () =>
                  exportCsv(
                    getCapacityByTech(filters) as unknown as Record<string, unknown>[],
                    'capacity.csv'
                  ),
              },
              {
                label: 'Generation CSV',
                desc: 'Energy share by tech',
                action: () =>
                  exportCsv(
                    getGenerationBySource(filters) as unknown as Record<string, unknown>[],
                    'generation.csv'
                  ),
              },
              {
                label: 'Plants CSV',
                desc: 'Plant registry',
                action: () => exportCsv(PLANTS as unknown as Record<string, unknown>[], 'plants.csv'),
              },
              {
                label: 'Scenario JSON',
                desc: 'Active case + outputs',
                action: () => exportJson(activeScenario, 'scenario.json'),
              },
              {
                label: 'Metric catalog',
                desc: 'Definitions for consumers',
                action: () => exportJson(METRIC_DEFINITIONS, 'metrics.json'),
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="card block"
                style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={item.action}
              >
                <Download className="h-4 w-4" style={{ color: 'var(--accent)', marginBottom: 8 }} />
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{item.label}</strong>
                <p className="muted" style={{ margin: '0.3rem 0 0', fontSize: '0.78rem' }}>
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
