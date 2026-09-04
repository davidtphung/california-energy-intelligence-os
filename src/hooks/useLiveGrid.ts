import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAllLiveSources, type LiveBundle } from '../data/liveSources'
import { CAISO_STALE_AFTER_MS, caisoMode, type LiveFailMode } from '../data/truthClasses'
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
  const lastGoodRef = useRef<LiveBundle | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled || inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const bundle = await fetchAllLiveSources()
      if (!mounted.current) return

      if (bundle.caisoParseOk && bundle.caiso?.currentDemandMw != null) {
        lastGoodRef.current = bundle
        setData(bundle)
        setLastOk(bundle.fetchedAt)
        setError(null)
      } else {
        const lastGood = lastGoodRef.current
        if (lastGood?.caiso) {
          const staleSources = bundle.sources.map((s) =>
            s.organization === 'CAISO' && s.id.startsWith('caiso-') && s.status === 'ok'
              ? { ...s, status: 'stale' as const, message: 'Showing last good; this pull failed parse' }
              : s
          )
          setData({
            ...bundle,
            caiso: lastGood.caiso,
            weather: bundle.weather ?? lastGood.weather,
            sources: staleSources,
            caisoParseOk: false,
            caisoFail: bundle.caisoFail ?? 'CAISO parse failed; showing last good',
          })
          setError(bundle.caisoFail ?? 'CAISO parse failed. Showing last good.')
        } else {
          setData(bundle)
          setError(bundle.caisoFail ?? 'CAISO live pull failed. No last-good snapshot.')
        }
      }
    } catch (e) {
      if (!mounted.current) return
      const lastGood = lastGoodRef.current
      const message = e instanceof Error ? e.message : 'Live fetch failed'
      if (lastGood?.caiso) {
        setData({
          ...lastGood,
          fetchedAt: new Date().toISOString(),
          caisoParseOk: false,
          caisoFail: `${message}; showing last good`,
        })
        setError(`${message}. Showing last good.`)
      } else {
        setError(message)
      }
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

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setAgeTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [enabled])

  const demandMw = data?.caiso?.currentDemandMw ?? null
  const mode: LiveFailMode = caisoMode({
    loading,
    error,
    demandMw,
    lastOk,
  })
  const staleByAge =
    lastOk != null && Date.now() - Date.parse(lastOk) > CAISO_STALE_AFTER_MS
  const failMode: LiveFailMode =
    mode === 'ok' && staleByAge ? 'stale' : mode

  return {
    data,
    loading,
    error,
    lastOk,
    ageTick,
    refreshIntervalMs: LIVE_REFRESH_MS,
    refresh,
    failMode,
    lastGood: lastGoodRef.current,
    hasLastGood: lastGoodRef.current?.caiso?.currentDemandMw != null,
  }
}
