import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-x-hidden p-3 sm:p-5 lg:p-6"
          tabIndex={-1}
        >
          {children}
        </main>
        <footer className="border-t border-slate-200 px-3 py-3 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-5 lg:px-6">
          Built by{' '}
          <a
            href="https://x.com/davidtphung"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 underline-offset-2 transition-colors hover:text-sky-500 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
          >
            David T Phung
          </a>
        </footer>
      </div>
    </div>
  )
}
