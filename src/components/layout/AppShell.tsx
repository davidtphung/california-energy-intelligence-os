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
import { ViewCounter } from '../ViewCounter'

/** Primary modes only. Policy / Scenario / Dev stay on hash. */
const NAV: { id: AppView; label: string; hash: string }[] = [
  { id: 'map', label: 'Map', hash: 'map' },
  { id: 'demand', label: 'Demand', hash: 'demand' },
  { id: 'balance', label: 'Balance', hash: 'balance' },
  { id: 'states', label: 'USA', hash: 'states' },
  { id: 'portfolios', label: 'Assets', hash: 'portfolios' },
  { id: 'fossil', label: 'Fuels', hash: 'fossil' },
  { id: 'thesis', label: 'Thesis', hash: 'thesis' },
  { id: 'about', label: 'About', hash: 'about' },
]

const HASH_ALIASES: Record<string, AppView> = {
  overview: 'map',
  gas: 'fossil',
  consistency: 'consistency',
  research: 'thesis',
  data: 'data-engineering',
  dev: 'developer',
  map: 'map',
  demand: 'demand',
  balance: 'balance',
  sources: 'balance',
  about: 'about',
  'about/donate': 'about',
  'about/how': 'about',
  'about/sources': 'about',
  thesis: 'thesis',
  policy: 'policy',
  scenario: 'scenarios',
  scenarios: 'scenarios',
}

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
  const { theme, toggleTheme, view, setView, filters, openStateDetail } = useApp()

  const go = (id: AppView, hash: string) => {
    setView(id)
    window.history.replaceState(null, '', `#${hash}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace('#', '') || 'map'
      if (raw.startsWith('state/')) {
        const abbr = raw.slice('state/'.length).split(/[/?#]/)[0]
        if (abbr && abbr.length >= 2) {
          openStateDetail(abbr)
          return
        }
      }
      if (raw in HASH_ALIASES) {
        setView(HASH_ALIASES[raw])
        return
      }
      const match = NAV.find((n) => n.hash === raw)
      if (match) setView(match.id)
      else if (raw === 'policy') setView('policy')
      else if (raw === 'scenario' || raw === 'scenarios') setView('scenarios')
      else if (raw === 'consistency') setView('consistency')
      else if (raw === 'research') setView('research')
      else if (raw === 'data') setView('data-engineering')
      else if (raw === 'dev') setView('developer')
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [setView, openStateDetail])

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
        <button type="button" className="brand" onClick={() => go('map', 'map')}>
          <span className="brand-mark">EIS</span>
          <span className="brand-dot">Energy Intelligence System</span>
        </button>

        <ul className="menu-items">
          {NAV.map((item) => {
            const active =
              view === item.id ||
              (view === 'overview' && item.id === 'map') ||
              (view === 'state-detail' && item.id === 'states') ||
              (view === 'gas' && item.id === 'fossil')
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={active ? 'active' : undefined}
                  onClick={() => go(item.id, item.hash)}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </button>
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
          <br />
          <a href="https://x.ai/build" target="_blank" rel="noopener noreferrer">
            Grok Build 4.6
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
          <span className="site-credit-sep" aria-hidden>
            ·
          </span>
          <a href="https://x.ai/build" target="_blank" rel="noopener noreferrer">
            Grok Build 4.6
          </a>
        </footer>
      </div>
    </div>
  )
}
