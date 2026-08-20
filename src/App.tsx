import type React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { ViewCounterProvider } from './context/ViewCounterContext'
import { AppShell } from './components/layout/AppShell'
import { GridMapApp } from './components/grid/GridMapApp'
import { DemandForecastMap } from './components/grid/DemandForecastMap'
import { AllSourcesBalanceMap } from './components/grid/AllSourcesBalanceMap'
import { PortfoliosPanel } from './components/panels/PortfoliosPanel'
import { StatesCatalogPanel } from './components/panels/StatesCatalogPanel'
import { StateDetailPanel } from './components/panels/StateDetailPanel'
import { FuelsOutlookMap } from './components/grid/FuelsOutlookMap'
import { PolicyPanel } from './components/panels/PolicyPanel'
import { ConsistencyPanel } from './components/panels/ConsistencyPanel'
import { ScenarioPlanner } from './components/panels/ScenarioPlanner'
import { DataEngineering } from './components/panels/DataEngineering'
import { DeveloperPanel } from './components/panels/DeveloperPanel'
import { AboutPanel } from './components/panels/AboutPanel'
import { ThesisLibraryPanel } from './components/panels/ThesisLibraryPanel'

function ViewRouter() {
  const { view } = useApp()

  // key forces clean enter animation on route change
  let panel: React.ReactNode
  switch (view) {
    case 'map':
    case 'overview':
      panel = <GridMapApp />
      break
    case 'demand':
      panel = <DemandForecastMap />
      break
    case 'balance':
      panel = <AllSourcesBalanceMap />
      break
    case 'portfolios':
      panel = <PortfoliosPanel />
      break
    case 'states':
      panel = <StatesCatalogPanel />
      break
    case 'state-detail':
      panel = <StateDetailPanel />
      break
    case 'fossil':
    case 'gas':
      panel = <FuelsOutlookMap />
      break
    case 'policy':
      panel = <PolicyPanel />
      break
    case 'consistency':
      panel = <ConsistencyPanel />
      break
    case 'scenarios':
      panel = <ScenarioPlanner />
      break
    case 'research':
    case 'thesis':
      panel = <ThesisLibraryPanel />
      break
    case 'data-engineering':
      panel = <DataEngineering />
      break
    case 'developer':
      panel = <DeveloperPanel />
      break
    case 'about':
      panel = <AboutPanel />
      break
    default:
      panel = <GridMapApp />
  }
  return (
    <div key={view} className="view-enter fadein">
      {panel}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ViewCounterProvider>
        <AppShell>
          <ViewRouter />
        </AppShell>
      </ViewCounterProvider>
    </AppProvider>
  )
}
