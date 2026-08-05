import {
  LayoutDashboard,
  GitBranch,
  BookOpen,
  Database,
  Code2,
  Zap,
  X,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { AppView } from '../../types'
import { cn } from '../../lib/utils'

const NAV: { id: AppView; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'System KPIs & charts' },
  { id: 'scenarios', label: 'Scenario Planner', icon: GitBranch, desc: '2030-2045 pathways' },
  { id: 'research', label: 'Research', icon: BookOpen, desc: 'Sources, notes, citations' },
  { id: 'data-engineering', label: 'Data Engineering', icon: Database, desc: 'Pipelines & quality' },
  { id: 'developer', label: 'Developer', icon: Code2, desc: 'Config, metrics, export' },
]

export function Sidebar() {
  const { view, setView, sidebarOpen, setSidebarOpen, mode } = useApp()

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
      {NAV.map((item) => {
        const Icon = item.icon
        const active = view === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setView(item.id)
              setSidebarOpen(false)
            }}
            className={cn(
              'group flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150',
              active
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                active ? 'text-white' : 'text-slate-400 group-hover:text-sky-500'
              )}
              aria-hidden
            />
            <span>
              <span className="block text-sm font-semibold">{item.label}</span>
              <span
                className={cn(
                  'block text-[11px]',
                  active ? 'text-sky-100' : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {item.desc}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg shadow-sky-500/20">
            <Zap className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Energy Intelligence System
            </p>
            <p className="truncate text-[11px] text-slate-500">California · {mode} mode</p>
          </div>
        </div>
        {nav}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <p className="px-2 text-[10px] leading-relaxed text-slate-400">
            Sample data for research & planning. Connect live CEC / CAISO / EIA APIs in production.
          </p>
          <p className="mt-2 px-2 text-[11px] text-slate-500 dark:text-slate-400">
            Built by{' '}
            <a
              href="https://x.com/davidtphung"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky-600 underline-offset-2 transition-colors hover:text-sky-500 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
            >
              David T Phung
            </a>
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity',
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-950',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-sky-500" aria-hidden />
              <span className="text-sm font-bold">EIS</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {nav}
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <p className="px-2 text-[11px] text-slate-500 dark:text-slate-400">
              Built by{' '}
              <a
                href="https://x.com/davidtphung"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
              >
                David T Phung
              </a>
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
