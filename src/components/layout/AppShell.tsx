import { useEffect, useState, type ReactNode } from 'react'
import { Moon, Sun, Download } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  getCapacityByTech,
  getGenerationBySource,
  getHourlySeries,
  getKPIs,
} from '../../data/mockData'
import { exportJson } from '../../lib/utils'
import { applyHead } from '../../seo/head'
import { onSameOriginClick } from '../../seo/navigate'
import { NAV_ITEMS, pageForPath } from '../../seo/pages'
import { ViewCounter } from '../ViewCounter'

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
  const { theme, toggleTheme, view, pathname, filters } = useApp()

  useEffect(() => {
    const page = pageForPath(pathname)
    if (page) applyHead(page)
  }, [pathname])

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
      `eis-export-${filters.year}.json`
    )
  }

  return (
    <div className="wrapper">
      <a href="#main-content" className="sr-only">
        Skip to content
      </a>

      <nav className="rail" aria-label="Primary">
        <a href="/" className="brand" onClick={onSameOriginClick}>
          <span className="brand-mark">EIS</span>
          <span className="brand-dot">Energy Intelligence System</span>
        </a>

        <ul className="menu-items">
          {NAV_ITEMS.map((item) => {
            const active =
              view === item.view ||
              (view === 'overview' && item.view === 'map') ||
              (view === 'state-detail' && item.view === 'states') ||
              (view === 'gas' && item.view === 'fossil') ||
              (item.view === 'about' && pathname.startsWith('/about'))
            return (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={active ? 'active' : undefined}
                  onClick={onSameOriginClick}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.navLabel}
                </a>
              </li>
            )
          })}
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
          <ViewCounter compact />
          <br />
          Map · Demand · stream
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
          <ViewCounter />
          <span className="site-credit-sep" aria-hidden>
            ·
          </span>
          Built by{' '}
          <a href="https://x.com/davidtphung" target="_blank" rel="noopener noreferrer">
            David T Phung
          </a>
        </footer>
      </div>
    </div>
  )
}
