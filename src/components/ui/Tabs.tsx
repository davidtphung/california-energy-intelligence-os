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
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={cn('seg', tab.id === active && 'active')}
        >
          {tab.label}
          {tab.count != null ? ` · ${tab.count}` : ''}
        </button>
      ))}
    </div>
  )
}
