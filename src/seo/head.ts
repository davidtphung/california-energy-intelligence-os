import { OG_IMAGE, canonicalUrl, jsonLd, type Page } from './pages'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const found = document.head.querySelector(`meta[${attr}="${key}"]`)
  const el = found instanceof HTMLMetaElement ? found : document.createElement('meta')
  if (!(found instanceof HTMLMetaElement)) {
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  const found = document.head.querySelector(`link[rel="${rel}"]`)
  const el = found instanceof HTMLLinkElement ? found : document.createElement('link')
  if (!(found instanceof HTMLLinkElement)) {
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export function applyHead(page: Page) {
  const url = canonicalUrl(page.path)
  document.title = page.title
  upsertMeta('name', 'description', page.description)
  upsertMeta('name', 'robots', 'index, follow')
  upsertLink('canonical', url)
  upsertMeta('property', 'og:title', page.title)
  upsertMeta('property', 'og:description', page.description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', OG_IMAGE)
  upsertMeta('property', 'og:image:alt', page.title)
  upsertMeta('name', 'twitter:title', page.title)
  upsertMeta('name', 'twitter:description', page.description)
  upsertMeta('name', 'twitter:image', OG_IMAGE)
  upsertMeta('name', 'twitter:image:alt', page.title)
  const existing = document.getElementById('eis-jsonld')
  const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script')
  if (script.parentElement == null) {
    script.id = 'eis-jsonld'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(jsonLd(page))
}
