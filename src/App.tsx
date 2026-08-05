import { AppProvider, useApp } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { GridMapApp } from './components/grid/GridMapApp'
import { PortfoliosPanel } from './components/panels/PortfoliosPanel'
import { StatesCatalogPanel } from './components/panels/StatesCatalogPanel'
import { StateDetailPanel } from './components/panels/StateDetailPanel'
import { FossilFuelsPanel } from './components/panels/FossilFuelsPanel'
import { PolicyPanel } from './components/panels/PolicyPanel'
import { ConsistencyPanel } from './components/panels/ConsistencyPanel'
import { ScenarioPlanner } from './components/panels/ScenarioPlanner'
import { ResearchWorkspace } from './components/panels/ResearchWorkspace'
import { DataEngineering } from './components/panels/DataEngineering'
import { DeveloperPanel } from './components/panels/DeveloperPanel'

function ViewRouter() {
  const { view } = useApp()

  switch (view) {
    case 'map':
    case 'overview':
      return <GridMapApp />
    case 'portfolios':
      return <PortfoliosPanel />
    case 'states':
      return <StatesCatalogPanel />
    case 'state-detail':
      return <StateDetailPanel />
    case 'fossil':
    case 'gas':
      return <FossilFuelsPanel />
    case 'policy':
      return <PolicyPanel />
    case 'consistency':
      return <ConsistencyPanel />
    case 'scenarios':
      return <ScenarioPlanner />
    case 'research':
      return <ResearchWorkspace />
    case 'data-engineering':
      return <DataEngineering />
    case 'developer':
      return <DeveloperPanel />
    default:
      return <GridMapApp />
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
