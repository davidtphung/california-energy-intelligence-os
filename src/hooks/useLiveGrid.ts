import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAllLiveSources, type LiveBundle } from '../data/liveSources'
import { REFRESH } from '../data/refreshRates'

export const LIVE_REFRESH_MS = REFRESH.caisoLiveMs
export const LIVE_HIDDEN_MS = REFRESH.caisoHiddenMs

export function useLiveGrid(enabled = true) {
  const [data, setData] = useState<LiveBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastOk, setLastOk] = useState<string | null>(null)
  const [ageTick, setAgeTick] = useState(0)
  const mounted = useRef(true)
  const inFlight = useRef(false)
  const timerRef = useRef<number | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled || inFlight.current) return
    inFlight.current = true
    setLoading(true)
    setError(null)
    try {
      const bundle = await fetchAllLiveSources()
      if (!mounted.current) return
      setData(bundle)
      setLastOk(bundle.fetchedAt)
      const hardFail = bundle.sources.filter((s) => s.status === 'error' && s.organization === 'CAISO')
      if (!bundle.caiso && hardFail.length) {
        setError(`CAISO live pull failed (${hardFail.length} endpoints). Showing last good or empty.`)
      }
    } catch (e) {
      if (!mounted.current) return
      setError(e instanceof Error ? e.message : 'Live fetch failed')
    } finally {
      inFlight.current = false
      if (mounted.current) setLoading(false)
    }
  }, [enabled])

  const schedule = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (!enabled) return
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
    const ms = hidden ? LIVE_HIDDEN_MS : LIVE_REFRESH_MS
    timerRef.current = window.setInterval(() => void refresh(), ms)
  }, [enabled, refresh])

  useEffect(() => {
    mounted.current = true
    void refresh()
    schedule()

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
      schedule()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      mounted.current = false
      document.removeEventListener('visibilitychange', onVis)
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [refresh, schedule])

  // Tick once/sec so "Xs ago" stays current without re-fetching
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setAgeTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [enabled])

  return {
    data,
    loading,
    error,
    lastOk,
    ageTick,
    refreshIntervalMs: LIVE_REFRESH_MS,
    refresh,
  }
}
