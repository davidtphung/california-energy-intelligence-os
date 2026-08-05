import { cn } from '../../lib/utils'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 sm:text-sm',
              isActive
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                  isActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
