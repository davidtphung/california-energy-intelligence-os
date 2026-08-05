import type { ReactNode } from 'react'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="stars" aria-hidden="true" />
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <Topbar />
      <main id="main-content" className="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="footer">
        <p>
          California Energy Intelligence OS · sample CEC / CAISO / EIA–scale data ·{' '}
          Built by{' '}
          <a href="https://x.com/davidtphung" target="_blank" rel="noopener noreferrer">
            David T Phung
          </a>
        </p>
      </footer>
    </div>
  )
}
