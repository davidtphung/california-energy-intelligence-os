import { useEffect, useState, type ReactNode } from 'react'
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

const NAV: { id: AppView; label: string; hash: string }[] = [
  { id: 'overview', label: 'Overview', hash: 'overview' },
  { id: 'portfolios', label: 'Portfolios', hash: 'portfolios' },
  { id: 'states', label: 'USA', hash: 'states' },
  { id: 'consistency', label: 'Consistency', hash: 'consistency' },
  { id: 'scenarios', label: 'Scenario', hash: 'scenario' },
  { id: 'research', label: 'Research', hash: 'research' },
  { id: 'data-engineering', label: 'Data', hash: 'data' },
  { id: 'developer', label: 'Dev', hash: 'dev' },
]

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span className="live-clock">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, view, setView, filters } = useApp()

  const go = (id: AppView, hash: string) => {
    setView(id)
    window.history.replaceState(null, '', `#${hash}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace('#', '')
      const match = NAV.find((n) => n.hash === h)
      if (match) setView(match.id)
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [setView])

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
    <div className="wrapper">
      <a href="#main-content" className="sr-only">
        Skip to content
      </a>

      <nav className="rail" aria-label="Primary">
        <button type="button" className="brand" onClick={() => go('overview', 'overview')}>
          <span className="brand-mark">CEI</span>
          <span className="brand-dot">OS</span>
        </button>

        <ul className="menu-items">
          {NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={view === item.id ? 'active' : undefined}
                onClick={() => go(item.id, item.hash)}
                aria-current={view === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="menu-actions">
          <button type="button" className="icon-btn" onClick={handleExport} title="Export JSON" aria-label="Export">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            title="Theme"
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="menu-meta">
          <LiveClock />
          <br />
          California
          <br />
          sample grid data
        </div>

        <div className="rail-credit">
          Built by{' '}
          <a href="https://x.com/davidtphung" target="_blank" rel="noopener noreferrer">
            David T Phung
          </a>
        </div>
      </nav>

      <div className="main-column">
        <main id="main-content" className="main" tabIndex={-1}>
          <div className="content">{children}</div>
        </main>
        <footer className="site-credit">
          Built by{' '}
          <a href="https://x.com/davidtphung" target="_blank" rel="noopener noreferrer">
            David T Phung
          </a>
        </footer>
      </div>
    </div>
  )
}
