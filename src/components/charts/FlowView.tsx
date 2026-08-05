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
    <div className="stack" style={{ gap: '0.45rem' }} role="list" aria-label="Transmission flows">
      {flows.map((flow) => {
        const widthPct = Math.max(12, (flow.mw / maxMw) * 100)
        return (
          <button
            key={flow.id}
            type="button"
            role="listitem"
            onClick={() => setDrilldown(`flow:${flow.path}`)}
            className="card-solid block"
            style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontWeight: 500 }}>
                <span className="truncate">{flow.fromRegion}</span>
                {flow.direction === 'internal' ? (
                  <ArrowLeftRight className="h-3 w-3 shrink-0 muted" aria-hidden />
                ) : (
                  <ArrowRight className="h-3 w-3 shrink-0 muted" aria-hidden />
                )}
                <span className="truncate">{flow.toRegion}</span>
              </span>
              <span className="mono" style={{ flexShrink: 0 }}>
                {(flow.mw / 1000).toFixed(1)} GW
              </span>
            </div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <div
                className={cn('progress-fill')}
                style={{
                  width: `${widthPct}%`,
                  background:
                    flow.direction === 'import'
                      ? 'var(--sky)'
                      : flow.direction === 'export'
                        ? '#a78bfa'
                        : 'var(--emerald)',
                }}
              />
            </div>
            <div className="mono muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
              <span>{flow.path}</span>
              <span style={{ textTransform: 'capitalize' }}>{flow.direction}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
