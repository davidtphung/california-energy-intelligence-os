import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const SESSION_KEY = 'eis-view-counted'

export interface ViewStats {
  views: number
  counted: number
  baseline: number
  hit: boolean
}

interface ViewCounterContextValue {
  stats: ViewStats | null
  error: string | null
}

const ViewCounterContext = createContext<ViewCounterContextValue>({
  stats: null,
  error: null,
})

export function ViewCounterProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<ViewStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let shouldHit = true
    try {
      shouldHit = sessionStorage.getItem(SESSION_KEY) === null
    } catch {
      shouldHit = true
    }

    const url = shouldHit ? '/api/views?hit=1' : '/api/views'
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: ViewStats) => {
        if (cancelled) return
        if (shouldHit) {
          try {
            sessionStorage.setItem(SESSION_KEY, '1')
          } catch {
            /* ignore */
          }
        }
        setStats({
          views: Number(data.views) || 0,
          counted: Number(data.counted) || 0,
          baseline: Number(data.baseline) || 0,
          hit: Boolean(data.hit),
        })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'views failed')
        setStats(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ViewCounterContext.Provider value={{ stats, error }}>
      {children}
    </ViewCounterContext.Provider>
  )
}

export function useViewCounter() {
  return useContext(ViewCounterContext)
}
