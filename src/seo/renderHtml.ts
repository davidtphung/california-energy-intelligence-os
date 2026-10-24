/**
 * Static HTML, robots.txt, sitemap.xml, and llms.txt.
 * Build-only. The client imports pages.ts, not this file.
 */

import { RELATED_PAPERS } from '../data/gasThesisPapers'
import { US_STATES } from '../data/usStates'
import {
  HASH_TO_PATH,
  NAV_ITEMS,
  OG_IMAGE,
  ORIGIN,
  allPages,
  canonicalUrl,
  cadenceParagraphs,
  hashRedirectScript,
  jsonLd,
  pageForPath,
  resolvePath,
  type Page,
} from './pages'

export { allPages }

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderHead(page: Page): string {
  const url = canonicalUrl(page.path)
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  const image = escapeHtml(OG_IMAGE)
  const ld = JSON.stringify(jsonLd(page)).replace(/</g, '\\u003c')
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${title}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${title}" />`,
    `<link rel="alternate" type="text/plain" href="${ORIGIN}/llms.txt" title="LLMs.txt" />`,
    `<script type="application/ld+json" id="eis-jsonld">${ld}</script>`,
  ].join('\n')
}

function linkList(pages: Page[]): string {
  return pages
    .map(
      (page) =>
        `<li><a href="${escapeHtml(page.path)}">${escapeHtml(page.h1)}</a></li>`,
    )
    .join('\n')
}

function renderCrawl(page: Page): string {
  const sections = allPages().filter((item) => !item.abbr && item.path !== page.path)
  const stateLinks =
    page.path === '/states'
      ? `<h2>State and territory pages</h2>
<ul>
${US_STATES.map((state) => `<li><a href="/states/${state.abbr.toLowerCase()}">${escapeHtml(state.name)} (${escapeHtml(state.abbr)})</a></li>`).join('\n')}
</ul>`
      : ''
  return `<article class="crawl-doc">
<p>Energy Intelligence System</p>
<h1>${escapeHtml(page.h1)}</h1>
<p>${escapeHtml(page.summary)}</p>
<h2>Truth class</h2>
<p>${escapeHtml(page.truthNote)}</p>
<h2>Key figures</h2>
${page.figureParas.map((para) => `<p>${escapeHtml(para)}</p>`).join('\n')}
<h2>Sources</h2>
<ul>
${page.sources.map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.name)}</a>. ${escapeHtml(source.note)}</li>`).join('\n')}
</ul>
<h2>Pages</h2>
<ul>
${linkList(sections)}
</ul>
${stateLinks}
<p>Machine-readable notes: <a href="/llms.txt">llms.txt</a>, <a href="/llms-full.txt">llms-full.txt</a>, <a href="/sitemap.xml">sitemap.xml</a>, <a href="/api/key-figures">key figures</a>.</p>
<p>Canonical URL: ${escapeHtml(canonicalUrl(page.path))}</p>
</article>`
}

const HEAD_RE = /<!--EIS_HEAD_START-->[\s\S]*?<!--EIS_HEAD_END-->/
const CRAWL_RE = /<!--EIS_CRAWL-->[\s\S]*?<!--\/EIS_CRAWL-->/

export function applyPage(html: string, page: Page): string {
  if (!HEAD_RE.test(html) || !CRAWL_RE.test(html)) {
    throw new Error('index.html is missing EIS head or crawl markers')
  }
  return html
    .replace(HEAD_RE, `<!--EIS_HEAD_START-->\n${renderHead(page)}\n<!--EIS_HEAD_END-->`)
    .replace(CRAWL_RE, `<!--EIS_CRAWL-->\n${renderCrawl(page)}\n<!--/EIS_CRAWL-->`)
}

export function injectIndexHtml(html: string): string {
  const home = pageForPath('/')
  if (!home) throw new Error('missing home page')
  let out = applyPage(html, home)
  if (!out.includes('id="eis-hash-redirect"')) throw new Error('missing hash redirect slot')
  out = out.replace(
    /<script id="eis-hash-redirect">[\s\S]*?<\/script>/,
    `<script id="eis-hash-redirect">\n${hashRedirectScript()}\n</script>`,
  )
  return out
}

export function redirectPath(pathname: string): string | null {
  const current = pathname.split('?')[0] || '/'
  const match = resolvePath(current)
  const bare = current.length > 1 ? current.replace(/\/+$/, '') : current
  const dest = match.redirectTo ?? (bare !== current && match.page ? match.path : null)
  if (!dest || dest === current) return null
  return dest
}

const BOTS: { agent: string; note: string }[] = [
  { agent: 'Googlebot', note: 'Google Search.' },
  { agent: 'Bingbot', note: 'Microsoft Bing.' },
  { agent: 'OAI-SearchBot', note: 'OpenAI search. https://developers.openai.com/api/docs/bots' },
  { agent: 'ChatGPT-User', note: 'OpenAI user-triggered fetch. https://developers.openai.com/api/docs/bots' },
  { agent: 'GPTBot', note: 'OpenAI training crawler. https://developers.openai.com/api/docs/bots' },
  {
    agent: 'ClaudeBot',
    note: 'Anthropic training crawler. https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler',
  },
  { agent: 'Claude-User', note: 'Anthropic user-triggered fetch.' },
  { agent: 'Claude-SearchBot', note: 'Anthropic search crawler.' },
  { agent: 'PerplexityBot', note: 'Perplexity search. https://docs.perplexity.ai/docs/resources/perplexity-crawlers' },
  { agent: 'Perplexity-User', note: 'Perplexity user-triggered fetch.' },
  { agent: 'xAI-SearchBot', note: 'Reported Grok search token. xAI has not published a crawler list.' },
  { agent: 'GrokBot', note: 'Reported Grok crawler token. xAI has not published a crawler list.' },
  { agent: 'xAI-Grok', note: 'Reported Grok token. xAI has not published a crawler list.' },
]

export function renderRobots(): string {
  const groups = BOTS.map(
    (bot) => `# ${bot.note}\nUser-agent: ${bot.agent}\nAllow: /\n`,
  ).join('\n')
  return `# Energy Intelligence System
# ${ORIGIN}
# Checked 2026-10-24.
# OpenAI: OAI-SearchBot, ChatGPT-User, GPTBot.
# Anthropic: ClaudeBot, Claude-User, Claude-SearchBot.
# Perplexity: PerplexityBot, Perplexity-User.
# xAI had no official crawler user-agent page (docs.x.ai/docs/guides/bots returned 404).
# xAI-SearchBot, GrokBot, and xAI-Grok are allowed because those tokens are the ones public crawler lists report for Grok.
# User-agent * allows any other crawler, including Google-Extended.

User-agent: *
Allow: /

${groups}
Sitemap: ${ORIGIN}/sitemap.xml
`
}

export function renderSitemap(): string {
  const urls = allPages()
    .filter((page) => page.index)
    .map((page) => `  <url><loc>${canonicalUrl(page.path)}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function sectionLines(): string {
  return allPages()
    .filter((page) => !page.abbr)
    .map((page) => `- [${page.h1}](${canonicalUrl(page.path)}): ${page.description}`)
    .join('\n')
}

export function renderLlms(): string {
  return `# Energy Intelligence System

> EIS is a US electricity workspace by David T Phung at ${ORIGIN}. LIVE numbers come from a current CAISO file. Catalog charts are SAMPLE and are not official statistics.

EIS is map-first. Path URLs such as /map and /about are the canonical pages. Older hash URLs such as #map, #usa, #assets, and #fuels redirect to those paths.

Truth classes:

- LIVE: a value parsed from a current public file, with a source URL and a timestamp.
- SAMPLE: an educational figure drawn for the interface. Cite it only with the SAMPLE label.
- Catalog: a name, link, or tag shipped with the site. Numeric fields inside the state, plant, demand, balance, and fuel catalogs are SAMPLE.

## Sections

${sectionLines()}

## Data

- [Key figures](${ORIGIN}/api/key-figures): LIVE JSON. CAISO Today's Outlook values parsed at request time, plus Open-Meteo context for 37N, 120W. SAMPLE catalogs are excluded. Missing parses are omitted.
- [CAISO Today's Outlook](https://www.caiso.com/todays-outlook): upstream live feed.
- [EIA Open Data](https://www.eia.gov/opendata/): public-domain US government data. EIS HTML does not embed an EIA table.
- [Open-Meteo license](https://open-meteo.com/en/license): CC BY 4.0.

## Update cadence

${cadenceParagraphs().map((line) => `- ${line}`).join('\n')}

## Also

- [Full notes](${ORIGIN}/llms-full.txt): sources, state names, and the thesis reading list.
- [Sitemap](${ORIGIN}/sitemap.xml): every indexable path.
`
}

function bibliography(): string[] {
  const lines: string[] = []
  const seen = new Set<string>()
  const add = (title: string, byline: string, when: string, url: string) => {
    if (!title || !url || seen.has(url)) return
    seen.add(url)
    lines.push(`- ${title}. ${byline}. ${when}. ${url}`)
  }
  for (const paper of RELATED_PAPERS) {
    add(paper.title, `${paper.authors}. ${paper.org}`, String(paper.year), paper.url)
  }
  return lines
}

export function renderLlmsFull(): string {
  const states = US_STATES.map((state) => `${state.name} (${state.abbr})`).join(', ')
  return `# Energy Intelligence System

> Full notes for answer engines. Canonical site: ${ORIGIN}. Author: David T Phung (https://x.com/davidtphung).

## What EIS is

EIS is a browser workspace for US electricity. The interactive map is the product. These HTML pages exist so a fetch with JavaScript disabled still returns a heading, a plain-language summary, the truth class, and the sources.

EIS is not a utility, an ISO, or a statistics agency.

## Truth classes

LIVE means the number was parsed from a public file at fetch time. The endpoint ${ORIGIN}/api/key-figures returns those numbers. Each figure includes the source URL. It includes the timestamp printed on the file when CAISO or Open-Meteo sent one, and it always includes the time EIS fetched it. If a column does not parse, that figure is absent.

SAMPLE means the figure was drawn so the interface has a shape. Demand paths, balance paths, scenario outputs, fossil series, consistency scores, the pipeline log, and the fleet numbers on state and plant screens are SAMPLE. Do not cite them as live measurements or as EIA statistics.

Catalog means a stable name or link: a state name, a paper title, a source URL, a simplified grid tag. A catalog name is not a measurement. On this version, numeric columns that sit next to those names are SAMPLE.

## Update cadence

${cadenceParagraphs().map((line) => `- ${line}`).join('\n')}

The key-figures endpoint may be cached for 30 seconds. The timestamp on each figure is the authority for when it was fetched.

## Sections

${allPages()
  .filter((page) => !page.abbr)
  .map((page) => `### ${page.h1}\n\n${page.summary}\n\n${page.truthNote}\n\n${canonicalUrl(page.path)}`)
  .join('\n\n')}

## Sources

${allPages()
  .find((page) => page.path === '/about/sources')!
  .sources.map((source) => `- ${source.name}: ${source.url}. ${source.note}`)
  .join('\n')}

## State and territory names

${states}.

Each name has a page at ${ORIGIN}/states/{lowercase abbreviation}. Those pages do not print fleet figures.

## Thesis reading list

Titles, authors, organizations, years, and URLs as stored in the EIS thesis catalog. This list does not repeat the papers' figures. Cite the linked document.

${bibliography().join('\n')}

## What to cite

For a live California grid number, cite ${ORIGIN}/api/key-figures and the CAISO source URL on that figure, with both timestamps. For a weather context value, cite Open-Meteo and CC BY 4.0. For a catalog fact, cite the page URL and say the numeric fields are SAMPLE.
`
}

export function staticFile(pathname: string): { type: string; body: string } | null {
  if (pathname === '/robots.txt') return { type: 'text/plain; charset=utf-8', body: renderRobots() }
  if (pathname === '/sitemap.xml') return { type: 'application/xml; charset=utf-8', body: renderSitemap() }
  if (pathname === '/llms.txt') return { type: 'text/plain; charset=utf-8', body: renderLlms() }
  if (pathname === '/llms-full.txt') return { type: 'text/plain; charset=utf-8', body: renderLlmsFull() }
  return null
}

const UNIT_RE = /\d[\d,]*(?:\.\d+)?\s*(MW|GW|TWh|MWh|Bcf|kWh|mTCO2)\b/

function assertClean(label: string, text: string) {
  if (text.includes('\u2014') || text.includes('\u2013')) {
    throw new Error(`${label} contains an en dash or em dash`)
  }
  if (text.includes('vercel.app')) throw new Error(`${label} still points at vercel.app`)
  if (text.includes('FAQPage')) throw new Error(`${label} includes FAQPage`)
  if (UNIT_RE.test(text)) throw new Error(`${label} contains a numeric unit that must not be frozen into crawl text`)
}

export function assertPublishedCopy() {
  const pages = allPages()
  if (pages.length < 20) throw new Error('expected state pages in the catalog')
  for (const page of pages) {
    const fragment = `${renderHead(page)}\n${renderCrawl(page)}`
    const text = fragment.replace(/<[^>]+>/g, ' ')
    assertClean(page.path, text)
    if (!text.includes('SAMPLE')) throw new Error(`${page.path} does not label SAMPLE`)
    if (!fragment.includes(`<h1>${escapeHtml(page.h1)}</h1>`)) throw new Error(`${page.path} missing h1`)
    if (!fragment.includes(canonicalUrl(page.path))) throw new Error(`${page.path} missing canonical`)
    const data = jsonLd(page)
    if (data['@context'] !== 'https://schema.org') throw new Error(`${page.path} JSON-LD context`)
    const types = data['@graph'].map((node) => (node as { '@type': string })['@type'])
    for (const type of ['WebSite', 'Organization', 'Person', 'WebPage']) {
      if (!types.includes(type)) throw new Error(`${page.path} JSON-LD missing ${type}`)
    }
    if (types.includes('FAQPage')) throw new Error(`${page.path} has FAQPage`)
    if (page.datasets) {
      const sets = data['@graph'].filter((node) => (node as { '@type': string })['@type'] === 'Dataset')
      if (sets.length < 4) throw new Error(`${page.path} missing datasets`)
      for (const node of sets) {
        const dataset = node as { license?: string; url?: string; name?: string }
        if (!dataset.license?.startsWith('https://') || !dataset.url?.startsWith('https://')) {
          throw new Error(`dataset ${dataset.name} missing license or url`)
        }
      }
    }
  }
  const robots = renderRobots()
  assertClean('robots', robots)
  for (const bot of BOTS) {
    if (!robots.includes(`User-agent: ${bot.agent}\nAllow: /`)) {
      throw new Error(`robots.txt missing ${bot.agent}`)
    }
  }
  const sitemap = renderSitemap()
  assertClean('sitemap', sitemap)
  for (const path of ['/', '/map', '/demand', '/balance', '/states', '/portfolios', '/fossil', '/thesis', '/about', '/states/ca']) {
    const loc = `<loc>${canonicalUrl(path)}</loc>`
    if (!sitemap.includes(loc)) throw new Error(`sitemap missing ${path}`)
  }
  const llms = renderLlms()
  const full = renderLlmsFull()
  assertClean('llms.txt', llms)
  assertClean('llms-full.txt', full)
  for (const word of ['LIVE', 'SAMPLE', 'Catalog']) {
    if (!llms.includes(word)) throw new Error(`llms.txt missing ${word}`)
  }
  if (!full.includes('Letter III: Got Gas')) throw new Error('llms-full missing thesis title')
  const script = hashRedirectScript()
  if (!script.includes('"/states"')) throw new Error('hash script missing states')
  if (HASH_TO_PATH.usa !== '/states' || HASH_TO_PATH.assets !== '/portfolios' || HASH_TO_PATH.fuels !== '/fossil') {
    throw new Error('stale hash aliases')
  }
  if (HASH_TO_PATH.timeline) throw new Error('timeline must wait for the timeline view')
  const shell = `<!doctype html><html><head><!--EIS_HEAD_START--><!--EIS_HEAD_END--><script id="eis-hash-redirect"></script></head><body><div id="root"><!--EIS_CRAWL--><!--/EIS_CRAWL--></div></body></html>`
  const homeHtml = injectIndexHtml(shell)
  if (!homeHtml.includes('https://eis.davidtphung.com/') || !homeHtml.includes('location.replace')) {
    throw new Error('home html injection failed')
  }
  if (!NAV_ITEMS.some((item) => item.path === '/map')) throw new Error('nav missing map')
}

export function renderPageHtml(shell: string, page: Page): string {
  return applyPage(shell, page)
}
