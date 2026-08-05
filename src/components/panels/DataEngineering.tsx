import {
  DATA_MODEL,
  LAST_REFRESH,
  PIPELINE_ERRORS,
  PIPELINE_RUNS,
  QUALITY_CHECKS,
} from '../../data/mockData'
import { Badge } from '../ui/Badge'
import type { PipelineStatus, QualityCheck } from '../../types'
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function statusBadge(status: PipelineStatus) {
  const map: Record<
    PipelineStatus,
    { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }
  > = {
    success: { variant: 'success', label: 'Success' },
    running: { variant: 'info', label: 'Running' },
    failed: { variant: 'danger', label: 'Failed' },
    queued: { variant: 'default', label: 'Queued' },
    warning: { variant: 'warning', label: 'Warning' },
  }
  const m = map[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

function qcIcon(status: QualityCheck['status']) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--success)' }} />
  if (status === 'warn') return <AlertTriangle className="h-4 w-4" style={{ color: 'var(--warn)' }} />
  return <XCircle className="h-4 w-4" style={{ color: 'var(--danger)' }} />
}

export function DataEngineering() {
  const lastRefresh = formatDistanceToNow(new Date(LAST_REFRESH), { addSuffix: true })

  return (
    <div className="animate-in stack">
      <section className="hero">
        <p className="section-label">Pipelines</p>
        <h1 className="page-title gradient-text">Data engineering</h1>
        <p className="lede">
          Entity model, pipeline health, quality checks, and error log. Last refresh {lastRefresh}.
        </p>
      </section>

      <div className="grid-3">
        {PIPELINE_RUNS.map((run) => (
          <div key={run.id} className="card panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <code className="mono" style={{ color: 'var(--text)', fontSize: '0.8rem' }}>
                {run.name}
              </code>
              {statusBadge(run.status)}
            </div>
            <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
              {run.recordsProcessed.toLocaleString()} records
              {run.errorCount > 0 && ` · ${run.errorCount} issues`}
            </p>
            {run.message && (
              <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.75rem' }}>
                {run.message}
              </p>
            )}
            <p className="mono muted" style={{ margin: '0.65rem 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              {run.status === 'running' ? (
                <Loader2 className="h-3 w-3" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {new Date(run.startedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <section className="tray panel">
          <p className="section-label">Schema</p>
          <h2 className="page-h2">Data model</h2>
          <p className="sub">Entity catalog — ready for API wiring.</p>
          <div className="stack" style={{ gap: '0.4rem' }}>
            {DATA_MODEL.map((entity) => (
              <details key={entity.entity} className="card-solid block">
                <summary
                  style={{
                    cursor: 'pointer',
                    listStyle: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  <code className="mono" style={{ color: 'var(--accent)' }}>
                    {entity.entity}
                  </code>
                  <span className="mono muted">
                    {entity.rows.toLocaleString()} · {entity.pk}
                  </span>
                </summary>
                <div className="chip-row" style={{ marginTop: '0.65rem' }}>
                  {entity.fields.map((f) => (
                    <span key={f} className="badge">
                      {f}
                    </span>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="tray panel">
          <p className="section-label">Validation</p>
          <h2 className="page-h2">Quality checks</h2>
          <div className="stack" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
            {QUALITY_CHECKS.map((q) => (
              <div key={q.id} className="card-solid block" style={{ display: 'flex', gap: 10 }}>
                <span style={{ marginTop: 2 }}>{qcIcon(q.status)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: '0.88rem' }}>{q.name}</strong>
                    <Badge
                      variant={
                        q.status === 'pass' ? 'success' : q.status === 'warn' ? 'warning' : 'danger'
                      }
                    >
                      {q.status}
                    </Badge>
                  </div>
                  <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>
                    {q.detail}
                  </p>
                  <p className="mono muted" style={{ margin: '0.35rem 0 0' }}>
                    {q.entity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="tray panel">
        <p className="section-label">Logs</p>
        <h2 className="page-h2">Error log</h2>
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
    </div>
  )
}
