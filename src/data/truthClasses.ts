/**
 * Three kinds of truth EIS shows on purpose.
 * Keep map chrome, About, and live badges aligned with these labels.
 */

export type TruthClass = 'live' | 'catalog' | 'scenario'

export const TRUTH_CLASS_LABEL: Record<TruthClass, string> = {
  live: 'LIVE',
  catalog: 'CATALOG',
  scenario: 'SCENARIO',
}

export const TRUTH_CLASS_ONE_LINER: Record<TruthClass, string> = {
  live: 'Measured feeds with timestamps. Fail loud: error / stale / last-good. Never a silent blank.',
  catalog: 'Curated rows with a public sourceUrl or EIA plant/generator ID and a vintage. Gaps stay EMPTY or UNCITED.',
  scenario: 'SAMPLE / PLANNING PATH. Method one-liner. Not AEO or IRP unless that case is cited.',
}

/** National graph and Demand / Balance / Future lenses */
export const SCENARIO_CHROME = 'SAMPLE / PLANNING PATH'

export const SCENARIO_METHOD =
  'Educational path scaled to public EIA / ISO ranges. Not a named AEO or IRP case.'

export const LIVE_FEEDS_LABEL = 'CAISO Today\'s Outlook + Open-Meteo'

/** Age after which a previously good CAISO snapshot is STALE */
export const CAISO_STALE_AFTER_MS = 90_000

export type LiveFailMode = 'ok' | 'loading' | 'error' | 'stale' | 'last-good'

export function liveFailLabel(mode: LiveFailMode): string {
  switch (mode) {
    case 'ok':
      return 'live'
    case 'loading':
      return 'loading'
    case 'error':
      return 'error'
    case 'stale':
      return 'stale'
    case 'last-good':
      return 'last-good'
  }
}

/**
 * Never return a silent em dash or blank that can read as zero.
 * Prefer last-good when present; otherwise error / stale / loading.
 */
export function failLoudNumber(
  value: number | null | undefined,
  opts: { mode: LiveFailMode; digits?: number; unit?: string }
): string {
  const digits = opts.digits ?? 2
  const unit = opts.unit ? ` ${opts.unit}` : ''
  if (value != null && Number.isFinite(value) && (opts.mode === 'ok' || opts.mode === 'last-good' || opts.mode === 'stale')) {
    const tag = opts.mode === 'ok' ? '' : `${liveFailLabel(opts.mode)} `
    return `${tag}${value.toFixed(digits)}${unit}`
  }
  if (opts.mode === 'loading') return `loading${unit}`
  if (opts.mode === 'stale') return `stale${unit}`
  if (opts.mode === 'last-good') return `last-good${unit}`
  return `error${unit}`
}

export function caisoMode(args: {
  loading: boolean
  error: string | null
  demandMw: number | null | undefined
  lastOk: string | null
  nowMs?: number
}): LiveFailMode {
  const now = args.nowMs ?? Date.now()
  const hasValue = args.demandMw != null && Number.isFinite(args.demandMw)
  if (hasValue && args.lastOk) {
    const t = Date.parse(args.lastOk)
    if (Number.isFinite(t) && now - t > CAISO_STALE_AFTER_MS) return 'stale'
    return 'ok'
  }
  if (hasValue) return 'last-good'
  if (args.loading && !args.lastOk) return 'loading'
  if (args.error) return 'error'
  if (args.lastOk) return 'stale'
  if (args.loading) return 'loading'
  return 'error'
}
