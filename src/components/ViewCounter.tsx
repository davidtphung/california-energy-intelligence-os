import { useViewCounter } from '../hooks/useViewCounter'

export function ViewCounter({ compact = false }: { compact?: boolean }) {
  const { stats, error } = useViewCounter()

  if (error && !stats) {
    return (
      <span className="view-counter is-muted" title="View counter unavailable">
        Views n/a
      </span>
    )
  }

  if (!stats) {
    return (
      <span className="view-counter is-loading" aria-busy="true">
        Views …
      </span>
    )
  }

  const label = stats.views.toLocaleString()
  const title =
    stats.baseline > 0
      ? `${stats.counted.toLocaleString()} measured visits (once per browser session) + ${stats.baseline.toLocaleString()} baseline`
      : 'Real visits counted once per browser session'

  if (compact) {
    return (
      <span className="view-counter" title={title}>
        <span className="view-counter-num mono">{label}</span>
        <span className="view-counter-unit"> views</span>
      </span>
    )
  }

  return (
    <span className="view-counter" title={title}>
      <span className="view-counter-label">Views</span>{' '}
      <span className="view-counter-num mono">{label}</span>
      <span className="view-counter-hint"> · once / session</span>
    </span>
  )
}
