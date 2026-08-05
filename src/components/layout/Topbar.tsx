import { Moon, Sun, Download } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { AppView } from '../../types'
import {
  getCapacityByTech,
  getGenerationBySource,
  getHourlySeries,
  getKPIs,
} from '../../data/mockData'
import { exportJson } from '../../lib/utils'

const NAV: { id: AppView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'scenarios', label: 'Scenario' },
  { id: 'research', label: 'Research' },
  { id: 'data-engineering', label: 'Data' },
  { id: 'developer', label: 'Dev' },
]

export function Topbar() {
  const { theme, toggleTheme, view, setView, filters, setMode } = useApp()

  const go = (id: AppView) => {
    setView(id)
    if (id === 'scenarios') setMode('planner')
    else if (id === 'data-engineering') setMode('engineer')
    else if (id === 'developer') setMode('developer')
    else setMode('analyst')
  }

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
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => go('overview')}>
            <span className="brand-mark" aria-hidden>
              CE
            </span>
            <span className="brand-text">
              <span className="brand-name">Energy Intelligence OS</span>
              <span className="brand-sub">California electricity systems</span>
            </span>
          </button>

          <nav className="nav" aria-label="Primary">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-link${view === item.id ? ' active' : ''}`}
                onClick={() => go(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="topbar-actions">
            <span className="badge badge-demo">Live demo</span>
            <button type="button" className="btn btn-sm" onClick={handleExport} title="Export JSON">
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title="Theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="mobile-nav" aria-label="Mobile primary">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`seg${view === item.id ? ' active' : ''}`}
            onClick={() => go(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </>
  )
}
