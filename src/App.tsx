import { AppProvider, useApp } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { OverviewDashboard } from './components/panels/OverviewDashboard'
import { ScenarioPlanner } from './components/panels/ScenarioPlanner'
import { ResearchWorkspace } from './components/panels/ResearchWorkspace'
import { DataEngineering } from './components/panels/DataEngineering'
import { DeveloperPanel } from './components/panels/DeveloperPanel'

function ViewRouter() {
  const { view } = useApp()

  switch (view) {
    case 'overview':
      return <OverviewDashboard />
    case 'scenarios':
      return <ScenarioPlanner />
    case 'research':
      return <ResearchWorkspace />
    case 'data-engineering':
      return <DataEngineering />
    case 'developer':
      return <DeveloperPanel />
    default:
      return <OverviewDashboard />
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <ViewRouter />
      </AppShell>
    </AppProvider>
  )
}
