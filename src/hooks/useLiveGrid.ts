import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAllLiveSources, type LiveBundle } from '../data/liveSources'

const REFRESH_MS = 60_000

export function useLiveGrid(enabled = true) {
  const [data, setData] = useState<LiveBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastOk, setLastOk] = useState<string | null>(null)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    if (!enabled) return
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
      if (mounted.current) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    mounted.current = true
    void refresh()
    if (!enabled) return
    const id = window.setInterval(() => void refresh(), REFRESH_MS)
    return () => {
      mounted.current = false
      window.clearInterval(id)
    }
  }, [refresh, enabled])

  return { data, loading, error, lastOk, refresh }
}
