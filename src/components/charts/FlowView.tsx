import type { TransmissionFlow } from '../../types'
import { cn } from '../../lib/utils'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'

interface Props {
  flows: TransmissionFlow[]
}

export function FlowView({ flows }: Props) {
  const { setDrilldown } = useApp()
  const maxMw = Math.max(...flows.map((f) => f.mw))

  return (
    <div className="space-y-2" role="list" aria-label="Transmission flows">
      {flows.map((flow) => {
        const widthPct = Math.max(12, (flow.mw / maxMw) * 100)
        return (
          <button
            key={flow.id}
            type="button"
            role="listitem"
            onClick={() => setDrilldown(`flow:${flow.path}`)}
            className="group flex w-full flex-col gap-1.5 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                <span className="truncate">{flow.fromRegion}</span>
                {flow.direction === 'internal' ? (
                  <ArrowLeftRight className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                ) : (
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                )}
                <span className="truncate">{flow.toRegion}</span>
              </span>
              <span className="shrink-0 font-mono text-slate-600 dark:text-slate-300">
                {(flow.mw / 1000).toFixed(1)} GW
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  flow.direction === 'import' && 'bg-sky-500',
                  flow.direction === 'export' && 'bg-violet-500',
                  flow.direction === 'internal' && 'bg-emerald-500'
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{flow.path}</span>
              <span className="capitalize">{flow.direction}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
