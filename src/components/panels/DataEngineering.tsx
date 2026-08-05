import {
  DATA_MODEL,
  LAST_REFRESH,
  PIPELINE_ERRORS,
  PIPELINE_RUNS,
  QUALITY_CHECKS,
} from '../../data/mockData'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { PipelineStatus, QualityCheck } from '../../types'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
  Database,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../../lib/utils'

function statusBadge(status: PipelineStatus) {
  const map: Record<PipelineStatus, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
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
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500" />
  return <XCircle className="h-4 w-4 text-rose-500" />
}

export function DataEngineering() {
  const lastRefresh = formatDistanceToNow(new Date(LAST_REFRESH), { addSuffix: true })

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Data Engineering
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Data model, pipeline health, quality checks, and error log.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
          <RefreshCw className="h-4 w-4 text-sky-500" aria-hidden />
          <span className="text-slate-500">Last refresh</span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{lastRefresh}</span>
        </div>
      </div>

      {/* Pipeline status cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PIPELINE_RUNS.map((run) => (
          <Card key={run.id} padding className="relative overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {run.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {run.recordsProcessed.toLocaleString()} records
                  {run.errorCount > 0 && (
                    <span className="ml-2 text-amber-600">· {run.errorCount} issues</span>
                  )}
                </p>
              </div>
              {statusBadge(run.status)}
            </div>
            {run.message && (
              <p className="mt-2 line-clamp-2 text-xs text-slate-500">{run.message}</p>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              {run.status === 'running' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {new Date(run.startedAt).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Data model" subtitle="Entity catalog — ready for API wiring">
          <div className="space-y-2">
            {DATA_MODEL.map((entity) => (
              <details
                key={entity.entity}
                className="group rounded-lg border border-slate-100 dark:border-slate-800"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                    <span className="font-mono">{entity.entity}</span>
                  </span>
                  <span className="text-xs font-normal text-slate-400">
                    {entity.rows.toLocaleString()} rows · pk: {entity.pk}
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                  <div className="flex flex-wrap gap-1.5">
                    {entity.fields.map((f) => (
                      <code
                        key={f}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {f}
                      </code>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </Card>

        <Card title="Quality checks" subtitle="Automated data validation">
          <ul className="space-y-2">
            {QUALITY_CHECKS.map((q) => (
              <li
                key={q.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3',
                  q.status === 'pass' && 'border-emerald-200/60 dark:border-emerald-900/40',
                  q.status === 'warn' && 'border-amber-200/60 dark:border-amber-900/40',
                  q.status === 'fail' && 'border-rose-200/60 dark:border-rose-900/40'
                )}
              >
                <span className="mt-0.5">{qcIcon(q.status)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{q.name}</p>
                    <Badge
                      variant={
                        q.status === 'pass' ? 'success' : q.status === 'warn' ? 'warning' : 'danger'
                      }
                    >
                      {q.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{q.detail}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">
                    {q.entity} · {new Date(q.lastRun).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Error log" subtitle="Recent pipeline issues">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Entity</th>
                <th className="px-3 py-2">Run</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE_ERRORS.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      variant={
                        e.severity === 'error'
                          ? 'danger'
                          : e.severity === 'warning'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {e.severity}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{e.entity}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{e.runId}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
