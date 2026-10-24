/**
 * Crawl copy, routes, and JSON-LD for EIS.
 * Numeric grid figures stay out of this file. Live numbers belong in /api/key-figures.
 * Draft PR #3 adds #timeline. Do not publish /timeline until that view is on this branch.
 */

import { CRYPTO_METHODS, VENMO } from '../data/donate'
import { GOT_GAS_DIGEST } from '../data/gasThesisPapers'
import { REFRESH } from '../data/refreshRates'
import { US_STATES, stateByAbbr, type USStateEnergy } from '../data/usStates'
import type { AppView } from '../types'

export const ORIGIN = 'https://eis.davidtphung.com'
export const OG_IMAGE = `${ORIGIN}/og-image.png`

export type AboutTab = 'about' | 'how' | 'sources' | 'donate'

export interface SourceLink {
  name: string
  url: string
  note: string
}

export interface Crumb {
  name: string
  path: string
}

export interface Page {
  path: string
  view: AppView
  title: string
  description: string
  h1: string
  summary: string
  truthNote: string
  figureParas: string[]
  sources: SourceLink[]
  aboutTab?: AboutTab
  navLabel?: string
  nav?: boolean
  index: boolean
  hashes: string[]
  crumbs: Crumb[]
  datasets: boolean
  abbr?: string
}

export interface ResolvedRoute {
  view: AppView
  path: string
  redirectTo: string | null
  abbr: string | null
  aboutTab: AboutTab | null
  page: Page | null
}

const SAMPLE_WARN =
  'SAMPLE marks an educational figure drawn for the interface. Cite a SAMPLE figure only with that label. It is not a meter reading, an EIA table, or a utility filing.'

const LIVE_FIGURES = `Live California grid figures are left off these pages because they change through the day. Fetch ${ORIGIN}/api/key-figures. Each value there is parsed from the current file, with the source URL, the timestamp on the file when one is present, and the time EIS fetched it. A missed parse is omitted.`

const CADENCE = [
  `The national map animation refreshes every ${REFRESH.mapStreamMs} ms while the tab is open. That animation is SAMPLE.`,
  `CAISO Today's Outlook is fetched every ${REFRESH.caisoLiveMs / 1000} seconds while the tab is open, and every ${REFRESH.caisoHiddenMs / 1000} seconds while the tab is hidden.`,
  `The CAISO proxy at /api/live/caiso may be cached at the edge for ${REFRESH.edgeSMaxAgeSec} seconds.`,
  'Demand, balance, state, asset, fuel, policy, and thesis pages change when the site is deployed.',
]

export function cadenceParagraphs(): string[] {
  return CADENCE
}

const CAISO: SourceLink = {
  name: "CAISO Today's Outlook",
  url: 'https://www.caiso.com/todays-outlook',
  note: 'LIVE public CSV for demand, fuel mix, storage, and related series. CAISO publishes it for information. It is not billing data. Official market data is on OASIS, which this site does not fetch.',
}

const CAISO_TERMS: SourceLink = {
  name: 'CAISO privacy and terms',
  url: 'https://www.caiso.com/privacy-terms-of-use',
  note: 'Terms for the CAISO site.',
}

const OASIS: SourceLink = {
  name: 'CAISO OASIS',
  url: 'https://oasis.caiso.com/',
  note: 'Official CAISO market data. EIS does not fetch OASIS in this version.',
}

const EIA: SourceLink = {
  name: 'U.S. Energy Information Administration',
  url: 'https://www.eia.gov/',
  note: 'US government statistics. EIA works are in the public domain. Attribute EIA and keep the publication date when you reuse an EIA product. The charts in EIS are not an EIA extract.',
}

const EIA_LICENSE: SourceLink = {
  name: 'EIA copyrights and reuse',
  url: 'https://www.eia.gov/about/copyrights_reuse.php',
  note: 'Public-domain notice and attribution request.',
}

const EIA_OPEN: SourceLink = {
  name: 'EIA Open Data',
  url: 'https://www.eia.gov/opendata/',
  note: 'Optional hourly series. EIS uses it only when an API key is configured. This crawl text does not include those values.',
}

const EIA_860: SourceLink = {
  name: 'EIA-860',
  url: 'https://www.eia.gov/electricity/data/eia860/',
  note: 'Annual generator inventory. EIS plant and state figures are SAMPLE, not this file.',
}

const OPEN_METEO: SourceLink = {
  name: 'Open-Meteo',
  url: 'https://open-meteo.com/',
  note: 'LIVE weather at 37N, 120W, a Central Valley proxy. API data is CC BY 4.0. It is context for the map, not a grid meter.',
}

const OPEN_METEO_LICENSE: SourceLink = {
  name: 'Open-Meteo license',
  url: 'https://open-meteo.com/en/license',
  note: 'CC BY 4.0. Citation: Zippenfenig, P. (2023). Open-Meteo.com Weather API. https://doi.org/10.5281/zenodo.7970649',
}

const FERC: SourceLink = {
  name: 'FERC',
  url: 'https://www.ferc.gov/',
  note: 'Federal Energy Regulatory Commission. Policy notes in EIS are summaries.',
}

const NERC: SourceLink = {
  name: 'NERC',
  url: 'https://www.nerc.com/',
  note: 'North American Electric Reliability Corporation. Grid zones in EIS are schematic.',
}

const CORE_SOURCES = [CAISO, CAISO_TERMS, OASIS, EIA, EIA_LICENSE, EIA_OPEN, EIA_860, OPEN_METEO, OPEN_METEO_LICENSE]

function crumbs(...items: Crumb[]): Crumb[] {
  return [{ name: 'EIS', path: '/' }, ...items]
}

function base(partial: Omit<Page, 'crumbs' | 'datasets' | 'index'> & { crumbs?: Crumb[]; datasets?: boolean; index?: boolean }): Page {
  const tail = partial.crumbs ?? (partial.path === '/' ? [{ name: 'EIS', path: '/' }] : crumbs({ name: partial.h1, path: partial.path }))
  return {
    ...partial,
    crumbs: tail,
    datasets: partial.datasets ?? false,
    index: partial.index ?? true,
  }
}

const ROUTES: Page[] = [
  base({
    path: '/',
    view: 'map',
    title: 'EIS · Energy Intelligence System',
    description: 'Energy Intelligence System by David T Phung. A US electricity map, a live CAISO feed, and SAMPLE catalogs.',
    h1: 'Energy Intelligence System',
    summary:
      'EIS is a browser workspace for US electricity, built by David T Phung. The map is the center. A live pull from CAISO Today\'s Outlook sits beside catalogs for demand, supply balance, states, plants, fuels, and a thesis library.',
    truthNote: `Three labels matter. LIVE means a value parsed from a current public file. SAMPLE means an educational interface figure. Catalog means a name, link, or tag baked in at deploy. Numeric fields in the state, plant, demand, balance, and fuel catalogs are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: [LIVE_FIGURES, ...CADENCE],
    sources: CORE_SOURCES,
    hashes: [],
    datasets: true,
  }),
  base({
    path: '/map',
    view: 'map',
    nav: true,
    navLabel: 'Map',
    title: 'Live grid map · EIS',
    description: 'US electricity map. CAISO Today\'s Outlook is live. The national grid animation is SAMPLE.',
    h1: 'Live grid map',
    summary:
      'The map draws a national graph and a California feed. The moving national stream is a SAMPLE animation in the browser. It is not SCADA. When the fetch works, California demand and fuel mix come from CAISO Today\'s Outlook.',
    truthNote: `The CAISO pull is LIVE. The national animation, intertie flows, and catalog overlays on the map are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: [LIVE_FIGURES, CADENCE[0], CADENCE[1]],
    sources: [CAISO, CAISO_TERMS, OASIS, OPEN_METEO, OPEN_METEO_LICENSE],
    hashes: ['map'],
    datasets: true,
  }),
  base({
    path: '/demand',
    view: 'demand',
    nav: true,
    navLabel: 'Demand',
    title: 'Demand · EIS',
    description: 'SAMPLE demand paths for data centers, population, and industry. Not an EIA forecast or a utility plan.',
    h1: 'Demand drivers',
    summary:
      'Demand charts SAMPLE paths for data centers, population growth, and industrial load, plus a SAMPLE split of private and public capital. The paths are a study tool. They are not the EIA Annual Energy Outlook and not a utility resource plan.',
    truthNote: `Every figure on this section is SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['No demand figures are printed here.', LIVE_FIGURES],
    sources: [EIA, EIA_LICENSE, EIA_OPEN],
    hashes: ['demand'],
  }),
  base({
    path: '/balance',
    view: 'balance',
    nav: true,
    navLabel: 'Balance',
    title: 'All-source balance · EIS',
    description: 'SAMPLE supply and deficit paths for ten electricity sources. Not an official resource plan.',
    h1: 'All-source balance',
    summary:
      'Balance shows production, a firm-capacity contribution, demand, and deficits for gas, coal, nuclear, oil, solar, wind, hydro, batteries, geothermal, and biomass. The timelines are a SAMPLE path tied to the same demand drivers.',
    truthNote: `Every figure on this section is SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['No balance figures are printed here.', LIVE_FIGURES],
    sources: [EIA, EIA_LICENSE],
    hashes: ['balance', 'sources'],
  }),
  base({
    path: '/states',
    view: 'states',
    nav: true,
    navLabel: 'USA',
    title: 'US states · EIS',
    description: 'State electricity catalog. Fleet numbers in the app are SAMPLE and are omitted on this page.',
    h1: 'US state catalog',
    summary: `The catalog has ${US_STATES.length} rows: states and territories used by the map. Each row in the app carries a SAMPLE fleet profile. This page lists names and links only.`,
    truthNote: `Names and simplified grid tags are catalog labels. Capacity, generation, peak, and fuel share in the app are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['Fleet figures are omitted for every state.', LIVE_FIGURES],
    sources: [EIA, EIA_860, EIA_LICENSE, NERC, FERC],
    hashes: ['states', 'usa'],
  }),
  base({
    path: '/portfolios',
    view: 'portfolios',
    nav: true,
    navLabel: 'Assets',
    title: 'Assets · EIS',
    description: 'Plant and portfolio browser. Capacity figures in the app are SAMPLE and are omitted here.',
    h1: 'Asset portfolios',
    summary:
      'Assets is a browser of portfolios and plants: utilities, community choice, public power, and generators. The interactive page shows SAMPLE capacity and output so the map has something to draw.',
    truthNote: `Portfolio and plant megawatt fields in the app are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['No plant capacities are printed here.', LIVE_FIGURES],
    sources: [EIA, EIA_860, EIA_LICENSE],
    hashes: ['portfolios', 'assets'],
  }),
  base({
    path: '/fossil',
    view: 'fossil',
    nav: true,
    navLabel: 'Fuels',
    title: 'Fuels · EIS',
    description: 'SAMPLE oil, gas, coal, and petroleum series for study. Not an EIA data extract.',
    h1: 'Fossil fuels',
    summary:
      'Fuels tracks crude oil, natural gas, coal, and petroleum products with educational series shaped like public history. The method note in the app calls them EIA-scale samples. They are not a downloaded EIA table.',
    truthNote: `Every production, trade, and capacity figure on this section is SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['No fuel quantities are printed here.', LIVE_FIGURES],
    sources: [EIA, EIA_LICENSE, EIA_OPEN],
    hashes: ['fossil', 'fuels', 'gas'],
  }),
  base({
    path: '/thesis',
    view: 'thesis',
    nav: true,
    navLabel: 'Thesis',
    title: 'Thesis library · EIS',
    description: `Reading list on gas deliverability and data-center load, including ${GOT_GAS_DIGEST.title}.`,
    h1: 'Thesis library',
    summary: `Thesis is a reading library. It leads with ${GOT_GAS_DIGEST.title} by ${GOT_GAS_DIGEST.authors} (${GOT_GAS_DIGEST.org}, ${GOT_GAS_DIGEST.date}). Related reports are linked beside it. An EIS digest is a reading note. Cite the linked document for any claim.`,
    truthNote: `Paper titles and links are catalog entries. Figures inside a digest are the paper's claims as copied into EIS, and they are omitted from this page. ${SAMPLE_WARN}`,
    figureParas: [
      'No paper figures are printed here. Titles, authors, years, and URLs are listed in /llms-full.txt.',
      LIVE_FIGURES,
    ],
    sources: [
      {
        name: GOT_GAS_DIGEST.title,
        url: GOT_GAS_DIGEST.url,
        note: `${GOT_GAS_DIGEST.authors}, ${GOT_GAS_DIGEST.org}, ${GOT_GAS_DIGEST.date}.`,
      },
      EIA,
    ],
    hashes: ['thesis', 'research'],
  }),
  base({
    path: '/about',
    view: 'about',
    nav: true,
    navLabel: 'About',
    aboutTab: 'about',
    title: 'About · EIS',
    description: 'What Energy Intelligence System is, who built it, and which figures are live or sample.',
    h1: 'About EIS',
    summary:
      'EIS is an independent energy workspace built by David T Phung. It is not a utility, an ISO, or a statistics agency. Live grid numbers come from public CAISO files. Most other charts are samples for study.',
    truthNote: `Read LIVE, SAMPLE, and catalog as separate kinds of statement. ${SAMPLE_WARN}`,
    figureParas: [LIVE_FIGURES, ...CADENCE],
    sources: CORE_SOURCES,
    hashes: ['about'],
    datasets: true,
    crumbs: crumbs({ name: 'About', path: '/about' }),
  }),
  base({
    path: '/about/how',
    view: 'about',
    aboutTab: 'how',
    title: 'How EIS works · EIS',
    description: 'How the map, demand, balance, and catalogs fit together, and which parts are live or sample.',
    h1: 'How EIS works',
    summary:
      'Start on the map. Demand, balance, states, assets, fuels, and thesis are separate sections. Policy and scenarios are included. Old hash links such as #map, #usa, #assets, and #fuels redirect to these paths.',
    truthNote: `The CAISO fetch is LIVE. The map animation and the planning charts are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: [LIVE_FIGURES, ...CADENCE],
    sources: [CAISO, EIA],
    hashes: ['about/how'],
    crumbs: crumbs({ name: 'About', path: '/about' }, { name: 'How it works', path: '/about/how' }),
  }),
  base({
    path: '/about/sources',
    view: 'about',
    aboutTab: 'sources',
    title: 'Sources · EIS',
    description: 'Sources behind EIS: CAISO Today\'s Outlook, EIA, Open-Meteo, and SAMPLE catalogs.',
    h1: 'Sources and methods',
    summary:
      'EIS mixes one live California feed, a weather proxy, and catalogs that ship with the site. The catalogs are scaled for the interface. They are not a republication of EIA-860 or an ISO filing.',
    truthNote: `Use the source URL on a LIVE figure. Treat catalog numbers as SAMPLE. ${SAMPLE_WARN}`,
    figureParas: [LIVE_FIGURES, ...CADENCE],
    sources: [...CORE_SOURCES, FERC, NERC],
    hashes: ['about/sources'],
    datasets: true,
    crumbs: crumbs({ name: 'About', path: '/about' }, { name: 'Sources', path: '/about/sources' }),
  }),
  base({
    path: '/about/donate',
    view: 'about',
    aboutTab: 'donate',
    title: 'Donate · EIS',
    description: 'Support Energy Intelligence System. No ads and no paywall.',
    h1: 'Donate',
    summary:
      'EIS is independent software with no ads and no paywall. Contributions are voluntary. Check every address on this page before sending funds. Crypto transfers cannot be reversed. EIS is not a 501(c)(3), so contributions are not tax deductible.',
    truthNote: `This page has no grid figures. Elsewhere on the site, cite SAMPLE figures only with that label. ${SAMPLE_WARN}`,
    figureParas: [
      `Venmo ${VENMO.handle}: ${VENMO.url}`,
      ...CRYPTO_METHODS.map((method) => `${method.name} on ${method.network}: ${method.address}`),
    ],
    sources: [{ name: 'David T Phung on X', url: 'https://x.com/davidtphung', note: 'Questions and feedback.' }],
    hashes: ['about/donate'],
    crumbs: crumbs({ name: 'About', path: '/about' }, { name: 'Donate', path: '/about/donate' }),
  }),
  base({
    path: '/policy',
    view: 'policy',
    title: 'Policy · EIS',
    description: 'Policy timeline summaries for study. Confirm legal claims on the official source.',
    h1: 'Policy notes',
    summary:
      'Policy is a reading timeline of energy statutes, rules, and proceedings. The entries are summaries for orientation. The statute, the order, or the docket is the authority.',
    truthNote: `This page prints no measured grid figures. ${SAMPLE_WARN}`,
    figureParas: ['No policy percentages or targets are printed here.', LIVE_FIGURES],
    sources: [FERC, NERC, EIA],
    hashes: ['policy'],
  }),
  base({
    path: '/scenarios',
    view: 'scenarios',
    title: 'Scenarios · EIS',
    description: 'SAMPLE planning cases for electricity buildout. Not an integrated resource plan.',
    h1: 'Scenario planner',
    summary:
      'The scenario planner adjusts demand, buildout, retirements, and imports and shows SAMPLE results for the 2030, 2035, and 2045 labels. Those results are a sandbox. They are not an integrated resource plan.',
    truthNote: `Scenario outputs are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['No scenario outputs are printed here.', LIVE_FIGURES],
    sources: [EIA],
    hashes: ['scenarios', 'scenario'],
  }),
  base({
    path: '/consistency',
    view: 'consistency',
    title: 'Source consistency · EIS',
    description: 'SAMPLE consistency ranges for California energy sources. Not a measured snapshot.',
    h1: 'Source consistency',
    summary:
      'Consistency compares planning ranges for California sources: firmness, capacity factor bands, seasonal swing, and forecast skill. The scores are a study scale inside EIS.',
    truthNote: `Consistency scores are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['No scores are printed here.', LIVE_FIGURES],
    sources: [CAISO, EIA],
    hashes: ['consistency'],
  }),
  base({
    path: '/data',
    view: 'data-engineering',
    title: 'Data · EIS',
    description: 'Live CAISO source health and a SAMPLE pipeline log.',
    h1: 'Data',
    summary:
      'The data section shows whether the live fetches are reaching CAISO and Open-Meteo, plus a SAMPLE pipeline log and entity list. The log is an interface fixture. It is not an operations record.',
    truthNote: `Source health on the interactive page follows the live fetch. The pipeline table is SAMPLE. ${SAMPLE_WARN}`,
    figureParas: [LIVE_FIGURES, CADENCE[1], CADENCE[2]],
    sources: [CAISO, OPEN_METEO, EIA_OPEN],
    hashes: ['data'],
    datasets: true,
  }),
  base({
    path: '/developer',
    view: 'developer',
    title: 'Developer · EIS',
    description: 'Scenario assumption editor. The numbers it produces are SAMPLE.',
    h1: 'Developer',
    summary:
      'The developer panel edits scenario assumptions and shows the SAMPLE tables those assumptions produce. Exports from this panel carry the same SAMPLE figures.',
    truthNote: `Developer outputs are SAMPLE. ${SAMPLE_WARN}`,
    figureParas: ['No developer outputs are printed here.', LIVE_FIGURES],
    sources: [EIA, CAISO],
    hashes: ['dev', 'developer'],
  }),
]

const PATH_ALIASES: Record<string, string> = {
  '/usa': '/states',
  '/assets': '/portfolios',
  '/fuels': '/fossil',
  '/gas': '/fossil',
  '/sources': '/balance',
  '/overview': '/map',
  '/research': '/thesis',
  '/scenario': '/scenarios',
  '/dev': '/developer',
}

const EXTRA_HASHES: Record<string, string> = {
  usa: '/states',
  assets: '/portfolios',
  fuels: '/fossil',
  gas: '/fossil',
  sources: '/balance',
  overview: '/map',
  research: '/thesis',
  scenario: '/scenarios',
  scenarios: '/scenarios',
  dev: '/developer',
  developer: '/developer',
  data: '/data',
}

function statePage(state: USStateEnergy): Page {
  const path = `/states/${state.abbr.toLowerCase()}`
  const california =
    state.abbr === 'CA'
      ? ' Live CAISO demand for California is a separate feed. Use /api/key-figures. This catalog row is still SAMPLE.'
      : ''
  return base({
    path,
    view: 'state-detail',
    title: `${state.name} electricity catalog · EIS`,
    description: `${state.name} (${state.abbr}) in the EIS state catalog. Fleet figures are SAMPLE and are omitted on this page.`,
    h1: `${state.name} electricity catalog`,
    summary: `${state.name} (${state.abbr}) is a row in the EIS state catalog. The region label is ${state.region}. The balancing-area tag is ${state.grid}. Those tags are simplified labels for the map, not a service-territory file.`,
    truthNote: `Capacity, generation, peak, and fuel-mix figures for ${state.name} inside the app are SAMPLE and are omitted here.${california} ${SAMPLE_WARN}`,
    figureParas: [`No fleet figures are printed for ${state.name}.`, LIVE_FIGURES],
    sources: state.abbr === 'CA' ? [CAISO, EIA, EIA_860, EIA_LICENSE] : [EIA, EIA_860, EIA_LICENSE],
    hashes: [],
    abbr: state.abbr,
    crumbs: crumbs({ name: 'States', path: '/states' }, { name: state.name, path }),
  })
}

let pageCache: Page[] | null = null

export function allPages(): Page[] {
  if (!pageCache) pageCache = [...ROUTES, ...US_STATES.map(statePage)]
  return pageCache
}

export const NAV_ITEMS = ROUTES.filter((page) => page.nav)

const PAGE_BY_PATH = new Map(ROUTES.map((page) => [page.path, page]))

export const HASH_TO_PATH: Record<string, string> = { ...EXTRA_HASHES }
for (const page of ROUTES) {
  for (const hash of page.hashes) HASH_TO_PATH[hash.toLowerCase()] = page.path
}

export function canonicalUrl(path: string): string {
  return path === '/' ? `${ORIGIN}/` : `${ORIGIN}${path}`
}

export function normalizePath(pathname: string): string {
  const raw = (pathname || '/').split('?')[0] || '/'
  if (raw.length > 1 && raw.endsWith('/')) return raw.replace(/\/+$/, '') || '/'
  return raw || '/'
}

function unknown(path: string): ResolvedRoute {
  return { view: 'map', path, redirectTo: null, abbr: null, aboutTab: null, page: null }
}

function fromPage(page: Page, redirectTo: string | null): ResolvedRoute {
  return {
    view: page.view,
    path: page.path,
    redirectTo,
    abbr: page.abbr ?? null,
    aboutTab: page.aboutTab ?? null,
    page,
  }
}

export function resolvePath(pathname: string): ResolvedRoute {
  const path = normalizePath(pathname)
  const lower = path.toLowerCase()
  const alias = PATH_ALIASES[lower]
  if (alias) {
    const dest = resolvePath(alias)
    return { ...dest, redirectTo: dest.path }
  }
  const legacy = lower.match(/^\/state\/([a-z]{2})$/)
  if (legacy && stateByAbbr(legacy[1])) {
    const dest = resolvePath(`/states/${legacy[1]}`)
    return { ...dest, redirectTo: dest.path }
  }
  const state = path.match(/^\/states\/([A-Za-z]{2})$/)
  if (state) {
    const row = stateByAbbr(state[1])
    if (!row) return unknown(path)
    const page = allPages().find((item) => item.path === `/states/${row.abbr.toLowerCase()}`)
    if (!page) return unknown(path)
    return fromPage(page, path === page.path ? null : page.path)
  }
  const direct = PAGE_BY_PATH.get(path) ?? PAGE_BY_PATH.get(lower)
  if (direct) return fromPage(direct, path === direct.path ? null : direct.path)
  return unknown(path)
}

export function pageForPath(pathname: string): Page | null {
  return resolvePath(pathname).page
}

export function hashToPath(hash: string): string | null {
  const raw = hash.replace(/^#/, '').trim()
  if (!raw) return null
  let key = raw.split('?')[0].split('#')[0]
  try {
    key = decodeURIComponent(key)
  } catch {
    /* keep the raw key */
  }
  const lower = key.toLowerCase()
  if (lower.startsWith('state/')) {
    const abbr = lower.slice('state/'.length).split('/')[0]
    if (/^[a-z]{2}$/.test(abbr) && stateByAbbr(abbr)) return `/states/${abbr}`
    return null
  }
  return HASH_TO_PATH[lower] ?? null
}

export function pathForView(view: AppView): string {
  const paths: Partial<Record<AppView, string>> = {
    map: '/map',
    overview: '/map',
    demand: '/demand',
    balance: '/balance',
    states: '/states',
    'state-detail': '/states',
    portfolios: '/portfolios',
    fossil: '/fossil',
    gas: '/fossil',
    thesis: '/thesis',
    research: '/thesis',
    about: '/about',
    policy: '/policy',
    scenarios: '/scenarios',
    consistency: '/consistency',
    'data-engineering': '/data',
    developer: '/developer',
  }
  return paths[view] ?? '/map'
}

export function aboutTabFromPath(pathname: string): AboutTab {
  return resolvePath(pathname).aboutTab ?? 'about'
}

export function hashRedirectScript(): string {
  const payload = JSON.stringify({
    aliases: HASH_TO_PATH,
    abbrs: US_STATES.map((state) => state.abbr.toLowerCase()),
  }).replace(/</g, '\\u003c')
  return `(function () {
  var data = ${payload};
  var raw = (location.hash || '').replace(/^#/, '');
  if (!raw) return;
  var key = raw.split('?')[0];
  try { key = decodeURIComponent(key); } catch (e) {}
  var lower = key.toLowerCase();
  var path = data.aliases[lower] || null;
  if (!path && lower.indexOf('state/') === 0) {
    var abbr = lower.slice(6).split('/')[0];
    if (data.abbrs.indexOf(abbr) !== -1) path = '/states/' + abbr;
  }
  if (!path) return;
  var current = location.pathname.replace(/\\/+$/, '') || '/';
  if (current === path) return;
  location.replace(path + location.search);
})();`
}

export interface DatasetNode {
  '@type': 'Dataset'
  '@id': string
  name: string
  description: string
  url: string
  license: string
  isAccessibleForFree: true
  creator: { '@type': string; name: string; url: string; alternateName?: string }
  distribution?: { '@type': 'DataDownload'; encodingFormat: string; contentUrl: string }[]
}

export function datasets(): DatasetNode[] {
  return [
    {
      '@type': 'Dataset',
      '@id': `${ORIGIN}/#dataset-caiso-outlook`,
      name: "CAISO Today's Outlook",
      description:
        "Public CSV feeds behind the California ISO Today's Outlook dashboard: system status, demand, fuel source, storage, and net demand. CAISO publishes them for information. They are not billing values and not OASIS market settlements. EIS parses them live and does not freeze a number into the HTML.",
      url: 'https://www.caiso.com/todays-outlook',
      license: 'https://www.caiso.com/privacy-terms-of-use',
      isAccessibleForFree: true,
      creator: {
        '@type': 'Organization',
        name: 'California Independent System Operator',
        alternateName: 'CAISO',
        url: 'https://www.caiso.com/',
      },
      distribution: [
        'systemstatus.csv',
        'demand.csv',
        'fuelsource.csv',
        'storage.csv',
        'netdemand.csv',
      ].map((file) => ({
        '@type': 'DataDownload',
        encodingFormat: 'text/csv',
        contentUrl: `https://www.caiso.com/outlook/current/${file}`,
      })),
    },
    {
      '@type': 'Dataset',
      '@id': `${ORIGIN}/#dataset-caiso-oasis`,
      name: 'CAISO OASIS',
      description:
        'CAISO Open Access Same-time Information System. Official market data. This version of EIS does not fetch OASIS.',
      url: 'https://oasis.caiso.com/',
      license: 'https://www.caiso.com/privacy-terms-of-use',
      isAccessibleForFree: true,
      creator: {
        '@type': 'Organization',
        name: 'California Independent System Operator',
        alternateName: 'CAISO',
        url: 'https://www.caiso.com/',
      },
    },
    {
      '@type': 'Dataset',
      '@id': `${ORIGIN}/#dataset-eia-open`,
      name: 'EIA Open Data',
      description:
        'U.S. Energy Information Administration open data API. EIA products are US government works in the public domain. Attribute EIA and include the publication date when reusing an EIA product. EIS does not embed an EIA table in the crawlable HTML.',
      url: 'https://www.eia.gov/opendata/',
      license: 'https://www.eia.gov/about/copyrights_reuse.php',
      isAccessibleForFree: true,
      creator: {
        '@type': 'GovernmentOrganization',
        name: 'U.S. Energy Information Administration',
        alternateName: 'EIA',
        url: 'https://www.eia.gov/',
      },
    },
    {
      '@type': 'Dataset',
      '@id': `${ORIGIN}/#dataset-eia-860`,
      name: 'EIA-860',
      description:
        'EIA annual electric generator inventory. The state and plant figures inside EIS are SAMPLE interface values, not a copy of this dataset.',
      url: 'https://www.eia.gov/electricity/data/eia860/',
      license: 'https://www.eia.gov/about/copyrights_reuse.php',
      isAccessibleForFree: true,
      creator: {
        '@type': 'GovernmentOrganization',
        name: 'U.S. Energy Information Administration',
        alternateName: 'EIA',
        url: 'https://www.eia.gov/',
      },
    },
    {
      '@type': 'Dataset',
      '@id': `${ORIGIN}/#dataset-open-meteo`,
      name: 'Open-Meteo weather API',
      description:
        'Weather at 37N, 120W used as a Central Valley proxy. API data is offered under CC BY 4.0. Cite Zippenfenig, P. (2023). Open-Meteo.com Weather API. https://doi.org/10.5281/zenodo.7970649. This is not a CAISO meter.',
      url: 'https://open-meteo.com/',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      isAccessibleForFree: true,
      creator: {
        '@type': 'Organization',
        name: 'Open-Meteo',
        url: 'https://open-meteo.com/',
      },
    },
  ]
}

export function jsonLd(page: Page) {
  const personId = `${ORIGIN}/#person`
  const orgId = `${ORIGIN}/#organization`
  const websiteId = `${ORIGIN}/#website`
  const graph: object[] = [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: 'Energy Intelligence System',
      alternateName: 'EIS',
      url: `${ORIGIN}/`,
      inLanguage: 'en',
      description: 'US electricity workspace with a live CAISO feed and labeled SAMPLE catalogs.',
      publisher: { '@id': orgId },
    },
    {
      '@type': 'Organization',
      '@id': orgId,
      name: 'Energy Intelligence System',
      alternateName: 'EIS',
      url: `${ORIGIN}/`,
      logo: `${ORIGIN}/icon-512.png`,
      founder: { '@id': personId },
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: 'David T Phung',
      url: 'https://x.com/davidtphung',
      sameAs: ['https://x.com/davidtphung'],
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl(page.path)}#webpage`,
      url: canonicalUrl(page.path),
      name: page.title,
      description: page.description,
      isPartOf: { '@id': websiteId },
      author: { '@id': personId },
      publisher: { '@id': orgId },
      inLanguage: 'en',
      primaryImageOfPage: OG_IMAGE,
    },
  ]
  if (page.crumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl(page.path)}#breadcrumbs`,
      itemListElement: page.crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: canonicalUrl(crumb.path),
      })),
    })
  }
  if (page.datasets) graph.push(...datasets())
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
