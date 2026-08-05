import {
  DATA_MODEL,
  LAST_REFRESH,
  PIPELINE_ERRORS,
  PIPELINE_RUNS,
  QUALITY_CHECKS,
} from '../../data/mockData'
import { Badge } from '../ui/Badge'
import type { PipelineStatus } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import { useLiveGrid } from '../../hooks/useLiveGrid'
import { Button } from '../ui/Button'
import { RefreshCw } from 'lucide-react'

function statusBadge(status: PipelineStatus) {
  const map: Record<
    PipelineStatus,
    { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }
  > = {
    success: { variant: 'success', label: 'ok' },
    running: { variant: 'info', label: 'running' },
    failed: { variant: 'danger', label: 'failed' },
    queued: { variant: 'default', label: 'queued' },
    warning: { variant: 'warning', label: 'warn' },
  }
  const m = map[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function DataEngineering() {
  const lastRefresh = formatDistanceToNow(new Date(LAST_REFRESH), { addSuffix: true })
  const { data: live, loading, refresh } = useLiveGrid(true)

  return (
    <div id="data">
      <div className="intro fadein t1">
        <strong>Data</strong>
        <p>
          Live source health plus entity model, quality checks, and sample pipeline log. Mock
          pipeline catalog last baked {lastRefresh}.
        </p>
      </div>

      <section className="block fadein t2">
        <div className="block-head">
          <div>
            <p className="kicker">Live sources</p>
            <h2 className="page-h2">Today&apos;s pulls</h2>
          </div>
          <Button size="sm" onClick={() => void refresh()} disabled={loading} icon={<RefreshCw className={`h-3.5 w-3.5${loading ? ' spin' : ''}`} />}>
            Refresh
          </Button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Org</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {(live?.sources ?? []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.name}
                    </a>
                  </td>
                  <td className="muted">{s.organization}</td>
                  <td>
                    <Badge
                      variant={
                        s.status === 'ok'
                          ? 'success'
                          : s.status === 'error'
                            ? 'danger'
                            : s.status === 'skipped'
                              ? 'default'
                              : 'warning'
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="mono muted">{s.latencyMs != null ? `${s.latencyMs} ms` : '—'}</td>
                  <td className="muted">{s.message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="rule" />

      <section className="block fadein t2">
        <p className="kicker">Pipelines (sample)</p>
        <table className="list-table">
          <tbody>
            {PIPELINE_RUNS.map((run) => (
              <tr key={run.id}>
                <th scope="row">
                  <code className="mono" style={{ color: 'var(--highlight)' }}>
                    {run.name}
                  </code>
                </th>
                <td>
                  {statusBadge(run.status)}{' '}
                  <span className="muted">
                    · {run.recordsProcessed.toLocaleString()} records
                    {run.errorCount > 0 ? ` · ${run.errorCount} issues` : ''}
                    {run.message ? ` · ${run.message}` : ''}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <hr className="rule" />

      <div className="grid-2 fadein t3">
        <section className="block">
          <p className="kicker">Schema</p>
          <h2 className="page-h2">Data model</h2>
          <table className="list-table">
            <tbody>
              {DATA_MODEL.map((e) => (
                <tr key={e.entity}>
                  <th scope="row">
                    <code className="mono">{e.entity}</code>
                  </th>
                  <td className="mono muted">
                    {e.rows.toLocaleString()} rows · pk {e.pk}
                    <div style={{ marginTop: 4, opacity: 0.85 }}>
                      {e.fields.slice(0, 6).join(', ')}
                      {e.fields.length > 6 ? '…' : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="block">
          <p className="kicker">Validation</p>
          <h2 className="page-h2">Quality checks</h2>
          <table className="list-table">
            <tbody>
              {QUALITY_CHECKS.map((q) => (
                <tr key={q.id}>
                  <th scope="row">
                    <Badge
                      variant={
                        q.status === 'pass' ? 'success' : q.status === 'warn' ? 'warning' : 'danger'
                      }
                    >
                      {q.status}
                    </Badge>
                  </th>
                  <td>
                    <strong style={{ color: 'var(--highlight)', fontWeight: 600 }}>{q.name}</strong>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                      {q.detail}
                    </div>
                    <div className="mono muted">{q.entity}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Logs</p>
        <h2 className="page-h2">Errors</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Entity</th>
                <th>Run</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE_ERRORS.map((e) => (
                <tr key={e.id}>
                  <td className="mono muted">{new Date(e.timestamp).toLocaleString()}</td>
                  <td>
                    <Badge
                      variant={
                        e.severity === 'error' ? 'danger' : e.severity === 'warning' ? 'warning' : 'info'
                      }
                    >
                      {e.severity}
                    </Badge>
                  </td>
                  <td className="mono">{e.entity}</td>
                  <td className="mono muted">{e.runId}</td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line">Data engineering · pipelines · quality</p>
    </div>
  )
}
