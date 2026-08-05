import type { TransmissionFlow } from '../../types'
import { useApp } from '../../context/AppContext'

interface Props {
  flows: TransmissionFlow[]
}

export function FlowView({ flows }: Props) {
  const { setDrilldown } = useApp()
  const maxMw = Math.max(...flows.map((f) => f.mw))

  return (
    <div role="list" aria-label="Transmission flows">
      {flows.map((flow) => {
        const widthPct = Math.max(8, (flow.mw / maxMw) * 100)
        return (
          <button
            key={flow.id}
            type="button"
            role="listitem"
            onClick={() => setDrilldown(`flow:${flow.path}`)}
            className="share-row"
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--highlight)' }}>
                {flow.fromRegion} to {flow.toRegion}
              </span>
              <span className="mono" style={{ color: 'var(--highlight)' }}>
                {(flow.mw / 1000).toFixed(1)} GW
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${widthPct}%` }} />
            </div>
            <div className="mono muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{flow.path}</span>
              <span style={{ textTransform: 'capitalize' }}>{flow.direction}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
