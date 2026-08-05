import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppMode,
  AppView,
  Filters,
  Note,
  Scenario,
  ScenarioAssumptions,
} from '../types'
import {
  NOTES as INITIAL_NOTES,
  PRESET_SCENARIOS,
  buildScenario,
  recomputeScenario,
} from '../data/mockData'

interface AppContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  mode: AppMode
  setMode: (m: AppMode) => void
  view: AppView
  setView: (v: AppView) => void
  /** Two-letter state / PR abbr when viewing dedicated state page */
  selectedStateAbbr: string | null
  /** Open dedicated state detail page (hash #state/CA) */
  openStateDetail: (abbr: string) => void
  filters: Filters
  setFilters: (f: Partial<Filters>) => void
  scenarios: Scenario[]
  activeScenario: Scenario
  setActiveScenarioId: (id: string) => void
  updateAssumptions: (a: Partial<ScenarioAssumptions>) => void
  saveScenarioPreset: (name: string, description?: string) => void
  notes: Note[]
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  sidebarOpen: boolean
  setSidebarOpen: (o: boolean) => void
  drilldown: string | null
  setDrilldown: (d: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const defaultFilters: Filters = {
  year: 2025,
  month: 'all',
  technology: 'all',
  region: 'all',
  scenarioId: 'base',
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored =
      (localStorage.getItem('eis-theme') as 'light' | 'dark' | null) ||
      (localStorage.getItem('ceios-theme') as 'light' | 'dark' | null)
    if (stored) return stored
    return 'light'
  })
  const [mode, setMode] = useState<AppMode>('analyst')
  const [view, setView] = useState<AppView>('map')
  const [selectedStateAbbr, setSelectedStateAbbr] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<Filters>(defaultFilters)
  const [scenarios, setScenarios] = useState<Scenario[]>(PRESET_SCENARIOS)
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [drilldown, setDrilldown] = useState<string | null>(null)

  const openStateDetail = useCallback((abbr: string) => {
    const a = abbr.toUpperCase()
    setSelectedStateAbbr(a)
    setView('state-detail')
    setDrilldown(`state:${a}`)
    window.history.replaceState(null, '', `#state/${a}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('eis-theme', theme)
    const color = theme === 'dark' ? '#000000' : '#ffffff'
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((el) => el.setAttribute('content', color))
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const setFilters = useCallback((f: Partial<Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }))
  }, [])

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === filters.scenarioId) ?? scenarios[0],
    [scenarios, filters.scenarioId]
  )

  const setActiveScenarioId = useCallback((id: string) => {
    setFiltersState((prev) => ({ ...prev, scenarioId: id }))
  }, [])

  const updateAssumptions = useCallback(
    (partial: Partial<ScenarioAssumptions>) => {
      setScenarios((prev) => {
        const current = prev.find((s) => s.id === filters.scenarioId)
        if (!current) return prev

        const nextAssumptions = { ...current.assumptions, ...partial }

        if (current.isPreset) {
          const cloned = buildScenario(
            `${current.name} (edited)`,
            nextAssumptions,
            current.description
          )
          // Schedule filter update after state commit
          queueMicrotask(() => {
            setFiltersState((f) => ({ ...f, scenarioId: cloned.id }))
          })
          return [...prev, cloned]
        }

        return prev.map((s) =>
          s.id === current.id ? recomputeScenario(s, nextAssumptions) : s
        )
      })
    },
    [filters.scenarioId]
  )

  const saveScenarioPreset = useCallback(
    (name: string, description = 'Saved scenario preset') => {
      const base = scenarios.find((s) => s.id === filters.scenarioId) ?? scenarios[0]
      const saved = buildScenario(name, base.assumptions, description)
      setScenarios((prev) => [...prev, saved])
      setFiltersState((f) => ({ ...f, scenarioId: saved.id }))
    },
    [scenarios, filters.scenarioId]
  )

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    setNotes((prev) => [
      {
        ...note,
        id: `n-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ])
  }, [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      mode,
      setMode,
      view,
      setView,
      selectedStateAbbr,
      openStateDetail,
      filters,
      setFilters,
      scenarios,
      activeScenario,
      setActiveScenarioId,
      updateAssumptions,
      saveScenarioPreset,
      notes,
      addNote,
      sidebarOpen,
      setSidebarOpen,
      drilldown,
      setDrilldown,
    }),
    [
      theme,
      toggleTheme,
      mode,
      view,
      selectedStateAbbr,
      openStateDetail,
      filters,
      setFilters,
      scenarios,
      activeScenario,
      setActiveScenarioId,
      updateAssumptions,
      saveScenarioPreset,
      notes,
      addNote,
      sidebarOpen,
      drilldown,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
