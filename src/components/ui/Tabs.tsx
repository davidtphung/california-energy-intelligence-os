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
    <div role="tablist" className={cn('segmented', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn('seg', isActive && 'active')}
          >
            {tab.label}
            {tab.count != null && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
