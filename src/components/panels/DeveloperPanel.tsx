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

  const apiTables = useMemo(
    () => ({
      kpis: [getKPIs(filters)],
      capacity_by_tech: getCapacityByTech(filters),
      generation_by_source: getGenerationBySource(filters),
      plants: PLANTS,
      scenario_outputs: activeScenario.outputs,
    }),
    [filters, activeScenario]
  )

  return (
    <div id="dev">
      <div className="intro fadein t1">
        <strong>Dev</strong>
        <p>
          Editable scenario JSON, metric definitions, API-shaped tables, and exports. Wire these
          payloads to real endpoints without changing the UI contract.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'config', label: 'Config' },
          { id: 'metrics', label: 'Metrics' },
          { id: 'tables', label: 'Tables' },
          { id: 'export', label: 'Export' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'config' && (
        <div className="grid-2 fadein t2">
          <div>
            <p className="kicker">Assumptions JSON</p>
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
                marginTop: '0.5rem',
                color: 'var(--ok)',
              }}
              aria-label="Scenario JSON"
            />
            {jsonError && (
              <p className="mono" style={{ color: 'var(--danger)' }}>
                {jsonError}
              </p>
            )}
            <div className="btn-row" style={{ marginTop: '0.65rem' }}>
              <Button
                variant="primary"
                onClick={() => {
                  try {
                    updateAssumptions(JSON.parse(jsonText))
                    setJsonError(null)
                  } catch (e) {
                    setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
                  }
                }}
              >
                Apply
              </Button>
              <Button
                onClick={() => {
                  setJsonText(JSON.stringify(activeScenario.assumptions, null, 2))
                  setJsonError(null)
                }}
              >
                Reset
              </Button>
              <Button onClick={() => exportJson(activeScenario, `scenario-${activeScenario.id}.json`)}>
                Download
              </Button>
            </div>
          </div>
          <div>
            <p className="kicker">Entities</p>
            <table className="list-table">
              <tbody>
                {DATA_MODEL.map((e) => (
                  <tr key={e.entity}>
                    <th scope="row">
                      <code className="mono">{e.entity}</code>
                    </th>
                    <td className="mono muted">{e.rows.toLocaleString()} rows</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="fadein t2">
          {METRIC_DEFINITIONS.map((m) => (
            <div key={m.id} style={{ marginBottom: '1.35rem' }}>
              <p className="kicker">{m.unit}</p>
              <h2 className="page-h2">{m.name}</h2>
              <p className="sub">{m.description}</p>
              <pre className="code-block">{m.formula}</pre>
              <div className="chip-row" style={{ marginTop: '0.5rem' }}>
                {m.sourceEntities.map((e) => (
                  <Badge key={e} variant="info">
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tables' && (
        <div className="fadein t2 stack">
          {Object.entries(apiTables).map(([name, rows]) => (
            <div key={name}>
              <div className="block-head">
                <div>
                  <p className="kicker">Table</p>
                  <h2 className="page-h2">{name}</h2>
                </div>
                <div className="btn-row">
                  <Button size="sm" onClick={() => exportJson(rows, `${name}.json`)}>
                    JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      exportCsv(rows as unknown as Record<string, unknown>[], `${name}.csv`)
                    }
                  >
                    CSV
                  </Button>
                </div>
              </div>
              <pre className="code-block" style={{ maxHeight: 180, overflow: 'auto' }}>
                {JSON.stringify(rows, null, 2).slice(0, 1600)}
                {JSON.stringify(rows).length > 1600 ? '\n…' : ''}
              </pre>
            </div>
          ))}
        </div>
      )}

      {tab === 'export' && (
        <div className="fadein t2">
          <p className="kicker">Download</p>
          <h2 className="page-h2">Current view</h2>
          <table className="list-table">
            <tbody>
              {[
                {
                  label: 'Snapshot',
                  desc: 'Filters, KPIs, capacity, generation, scenario',
                  action: () =>
                    exportJson(
                      {
                        filters,
                        kpis: getKPIs(filters),
                        capacity: getCapacityByTech(filters),
                        generation: getGenerationBySource(filters),
                        scenario: activeScenario,
                      },
                      'eis-snapshot.json'
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
                  desc: 'Registry sample',
                  action: () =>
                    exportCsv(PLANTS as unknown as Record<string, unknown>[], 'plants.csv'),
                },
                {
                  label: 'Scenario JSON',
                  desc: 'Active case + outputs',
                  action: () => exportJson(activeScenario, 'scenario.json'),
                },
                {
                  label: 'Metrics JSON',
                  desc: 'Definition catalog',
                  action: () => exportJson(METRIC_DEFINITIONS, 'metrics.json'),
                },
              ].map((item) => (
                <tr key={item.label}>
                  <th scope="row">
                    <button
                      type="button"
                      onClick={item.action}
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
                      {item.label}
                    </button>
                  </th>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="footer-line">Dev · config · metrics · export</p>
    </div>
  )
}
