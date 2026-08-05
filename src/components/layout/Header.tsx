import {
  Menu,
  Moon,
  Sun,
  Download,
  Filter,
  User,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import type { AppMode, Technology, CARegion } from '../../types'
import { TECH_LABELS, exportJson } from '../../lib/utils'
import {
  getCapacityByTech,
  getGenerationBySource,
  getKPIs,
  getHourlySeries,
} from '../../data/mockData'

const MODES: { id: AppMode; label: string }[] = [
  { id: 'analyst', label: 'Analyst' },
  { id: 'planner', label: 'Planner' },
  { id: 'engineer', label: 'Engineer' },
  { id: 'developer', label: 'Developer' },
]

export function Header() {
  const {
    theme,
    toggleTheme,
    mode,
    setMode,
    setSidebarOpen,
    filters,
    setFilters,
    scenarios,
    drilldown,
    setDrilldown,
  } = useApp()

  const handleExport = () => {
    exportJson(
      {
        exportedAt: new Date().toISOString(),
        filters,
        kpis: getKPIs(filters),
        capacity: getCapacityByTech(filters),
        generation: getGenerationBySource(filters),
        hourly: getHourlySeries(filters),
      },
      `ceios-export-${filters.year}.json`
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 glass dark:border-slate-800">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                California Energy Intelligence OS
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Research · Planning · Data Engineering · API-ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 md:flex"
              role="group"
              aria-label="User mode"
            >
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    mode === m.id
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                  aria-pressed={mode === m.id}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <Select
              className="md:hidden w-[7.5rem]"
              aria-label="User mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as AppMode)}
              options={MODES.map((m) => ({ value: m.id, label: m.label }))}
            />

            <Button
              variant="outline"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={handleExport}
              className="hidden sm:inline-flex"
            >
              Export
            </Button>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:flex">
              <User className="h-4 w-4" aria-hidden />
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div className="mr-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Filters
          </div>
          <Select
            label="Year"
            value={filters.year}
            onChange={(e) => setFilters({ year: Number(e.target.value) })}
            options={[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => ({
              value: y,
              label: String(y),
            }))}
          />
          <Select
            label="Month"
            value={filters.month}
            onChange={(e) =>
              setFilters({
                month: e.target.value === 'all' ? 'all' : Number(e.target.value),
              })
            }
            options={[
              { value: 'all', label: 'All months' },
              ...Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(2000, i).toLocaleString('en', { month: 'short' }),
              })),
            ]}
          />
          <Select
            label="Technology"
            value={filters.technology}
            onChange={(e) =>
              setFilters({ technology: e.target.value as Technology | 'all' })
            }
            options={[
              { value: 'all', label: 'All tech' },
              ...Object.entries(TECH_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          <Select
            label="Region"
            value={filters.region}
            onChange={(e) => setFilters({ region: e.target.value as CARegion | 'all' })}
            options={[
              { value: 'all', label: 'Statewide' },
              'Northern CA',
              'Bay Area',
              'Central Valley',
              'Central Coast',
              'Southern CA',
              'Desert / Inland Empire',
            ].map((r) =>
              typeof r === 'string' ? { value: r, label: r } : r
            )}
          />
          <Select
            label="Scenario"
            value={filters.scenarioId}
            onChange={(e) => setFilters({ scenarioId: e.target.value })}
            options={scenarios.map((s) => ({ value: s.id, label: s.name }))}
          />
          {drilldown && (
            <Badge variant="info" className="mb-0.5 ml-auto">
              Drilldown: {drilldown}
              <button
                type="button"
                className="ml-1.5 underline"
                onClick={() => setDrilldown(null)}
              >
                clear
              </button>
            </Badge>
          )}
        </div>
      </div>
    </header>
  )
}
