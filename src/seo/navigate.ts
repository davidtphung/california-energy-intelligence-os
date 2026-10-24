import { hashToPath } from './pages'

export function navigate(to: string, mode: 'push' | 'replace' = 'push') {
  const url = new URL(to, window.location.origin)
  const next = url.pathname + url.search
  const current = window.location.pathname + window.location.search
  if (current !== next || window.location.hash) {
    const method = mode === 'replace' ? 'replaceState' : 'pushState'
    window.history[method](null, '', next)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function onSameOriginClick(event: {
  defaultPrevented: boolean
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  currentTarget: EventTarget | null
  preventDefault(): void
}) {
  if (event.defaultPrevented) return
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = event.currentTarget
  if (!(anchor instanceof HTMLAnchorElement)) return
  const url = new URL(anchor.href, window.location.origin)
  if (url.origin !== window.location.origin) return
  if (url.hash && !hashToPath(url.hash)) return
  event.preventDefault()
  navigate(url.pathname + url.search)
}
