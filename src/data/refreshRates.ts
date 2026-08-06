/**
 * Single source of truth for how often EIS refreshes data.
 * Keep UI copy, hooks, and About in sync with these values.
 */

export const REFRESH = {
  /** Simulated national map stream (nodes / flow / density) */
  mapStreamMs: 800,
  /** Real CAISO Today's Outlook + weather pull while tab is visible */
  caisoLiveMs: 15_000,
  /** Back off when the browser tab is hidden */
  caisoHiddenMs: 90_000,
  /** Edge CDN max-age for /api/live/* (vercel.json must match) */
  edgeSMaxAgeSec: 10,
  /** Historical / forecast scrub playback step */
  scrubPlaybackMs: 400,
  /**
   * Static catalogs (plants, demand forecast, fuels, policy, thesis):
   * baked at build / deploy. Not live.
   */
  catalogMode: 'build' as const,
} as const

export function formatRefreshHuman(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)} s`
  return `${(ms / 60_000).toFixed(ms % 60_000 === 0 ? 0 : 1)} min`
}

/** Age string like "just now" / "12s ago" / "3m ago" */
export function ageLabel(isoOrMs: string | number | null | undefined, nowMs = Date.now()): string {
  if (isoOrMs == null) return 'never'
  const t = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs)
  if (!Number.isFinite(t)) return 'unknown'
  const sec = Math.max(0, Math.round((nowMs - t) / 1000))
  if (sec < 3) return 'just now'
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s ago`
  return `${Math.floor(sec / 3600)}h ago`
}

export const REFRESH_COPY = {
  mapStream: `Map stream every ${formatRefreshHuman(REFRESH.mapStreamMs)} (simulated national graph)`,
  caiso: `CAISO live pull every ${formatRefreshHuman(REFRESH.caisoLiveMs)} when tab is open`,
  caisoHidden: `CAISO backs off to ${formatRefreshHuman(REFRESH.caisoHiddenMs)} when tab is hidden`,
  edge: `Live proxy edge cache ≤${REFRESH.edgeSMaxAgeSec}s`,
  catalog: 'Demand / USA / Assets / Fuels / Thesis update on deploy (not a live feed)',
} as const
