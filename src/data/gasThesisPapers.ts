/**
 * Thesis library: Chronometer / Colossus "Got Gas" letter and related
 * models, papers, and analyses on AI load, LNG, and natural gas deliverability.
 * Educational digest for EIS; not investment advice.
 */

export type PaperKind = 'letter' | 'report' | 'podcast' | 'analysis' | 'agency' | 'academic'
export type ThesisStance = 'crisis' | 'tight' | 'growth' | 'balanced' | 'skeptical'

export interface ThesisPaper {
  id: string
  title: string
  authors: string
  org: string
  year: number
  kind: PaperKind
  stance: ThesisStance
  url: string
  summary: string
  keyClaims: string[]
  tags: string[]
  /** How related to Chronometer Got Gas thesis 0-100 */
  relatedness: number
  /** Regions / basins this work emphasizes */
  mapFocus: string[]
}

export interface ThesisHub {
  id: string
  label: string
  kind: 'basin' | 'lng' | 'load' | 'storage' | 'power'
  lon: number
  lat: number
  note: string
  weight: number
}

/** Core letter digest (Chronometer Partners via Colossus, June 2026) */
export const GOT_GAS_DIGEST = {
  id: 'chronometer-got-gas-2026',
  title: 'Letter III: Got Gas',
  authors: 'Matthew Smith',
  org: 'Chronometer Partners (via Colossus)',
  date: 'June 22, 2026',
  url: 'https://colossus.com/wp-content/uploads/2026/07/letter-III-got-gas.pdf',
  pages: 20,
  epigraph: 'Coming events cast their shadows before.',
  heresy: 'Energy, power, and AI heresy. But the numbers are plain.',
  coreThesis:
    'Base case: unprecedented U.S. natural gas shortage starting H2 2028. By 2030, working storage is exhausted. The market is focused on power; the real bottleneck is gas deliverability.',
  timeline: [
    { year: 2026, label: 'Consensus: ample gas', detail: 'Henry Hub ~$3.41/Mcf 2026; market range-bound.' },
    { year: 2027, label: 'Still comfortable', detail: 'Forward ~$3.51/Mcf; producers may shut in; reinvestment soft.' },
    { year: 2028, label: 'Inflection', detail: 'Step-function LNG + gas generation startups; curve still complacent $3.50-3.70.' },
    { year: 2029, label: 'Acute tightness', detail: 'Modern paradigms break; price risk convex and unbounded to the upside.' },
    { year: 2030, label: 'Storage crisis', detail: 'Working storage exhausted in base case; deficit >5 Bcf/d before full AI force.' },
  ],
  arithmetic: {
    productionAddBcf: 20,
    productionMaxBcf: 132,
    productionNowBcf: 112,
    lngAddBcf: 20,
    lngNowBcf: 15,
    lng2030Bcf: 35,
    powerBurnAddBcf: 5,
    deficit2030Bcf: 5,
    storageDays2010: 71.9,
    storageDays2025: 50.1,
    storageDays2030: 36.9,
    storageGrowth2010_2025Pct: 7,
    storageGrowth2025_2030Pct: 2,
    demandGrowth2010_2025Pct: 54,
    demandGrowth2025_2030Pct: 39,
  },
  modelLayers: [
    {
      id: 'upstream',
      title: 'Upstream production',
      body: 'Well-level + acreage polygons for public and private operators. PDP curves, remaining undeveloped acreage constrained by geology and leases. No credit for future leasing. Max deliverable ~+20 Bcf/d to ~132 Bcf/d by YE 2030.',
    },
    {
      id: 'lng',
      title: 'LNG exports',
      body: 'All approved/committed U.S. LNG nameplate tracked by construction stage. ~15 Bcf/d now to ~35 Bcf/d by end-2030. Much already contracted to global buyers. Approvals done in a vacuum without AI load.',
    },
    {
      id: 'power',
      title: 'Power burn',
      body: 'All operating gas plants + proposed assets with P50+ probability, including BTM turbines. Base case >5 Bcf/d incremental gas demand through 2030. Excludes fuel cells / modular as backup (would only accelerate deficit if baseload).',
    },
    {
      id: 'midstream',
      title: 'Gathering, processing, pipelines',
      body: 'Nearly every midstream system and announced project, including Texas intrastate to debottleneck Permian associated gas. Even with wells, midstream does not exist at the scale needed: 5-8+ years if started today. Projects for 2028 relief are not under construction.',
    },
    {
      id: 'storage',
      title: 'Working storage',
      body: 'Cushion collapsed: 71.9 days-to-cover (2010) to 50.1 (2025) to 36.9 (2030). Storage capacity +7% over 15 years while key demand sources +54%, then another +39% to 2030 vs storage +2%.',
    },
    {
      id: 'datacenters',
      title: 'Data centers',
      body: 'Every operating U.S. data center plus contemplated projects at 50%+ probability. Iterative load flex. More grid-connected DC approvals accelerate the gas deficit when power is gas-marginal.',
    },
  ],
  winners: [
    'U.S./Canada producers with real (not leased) high-return inventory: Haynesville (EXE, CRK), parts of Appalachia, Canadian Deep Basin / Montney (TOU CN).',
    'Midstream positioned for throughput: gathering, processing, compression, pipe (e.g. KMI, TRP CN, PPL CN).',
    'Large-scale nuclear (Westinghouse AP1000 path): only scalable baseload fix long term. Uranium, enrichment, CCJ, BWXT content.',
    'Utility + residential solar and batteries (XIFR, CWEN, RUN) as gas-set power prices rise.',
  ],
  losers: [
    'Residential electricity consumers without solar/storage (unknowingly short gas as marginal fuel).',
    'Hyperscalers underwriting power on cheap gas assumptions; energy share of AI cost may jump 10% toward 20-40%.',
    'Gas turbine / engine OEMs, EPC firms, fuel-cell makers if gas access is rationed.',
  ],
  methods: [
    'Gather EIA, DOE, FERC, ISO, Enverus, Yes Energy, WoodMac, Genscape, S&P/Platts, Bloomberg, CWG weather.',
    'Asset-by-asset bottom-up for public and private companies; wrap financials around assets.',
    'Closed-loop U.S. gas system: production + midstream + storage + power + LNG + DC load with constraints.',
    'Objective: not conservative, not aggressive; try to be right. Back-test to EIA dry gas.',
  ],
} as const

/** Map hubs for thesis geography */
export const THESIS_HUBS: ThesisHub[] = [
  { id: 'permian', label: 'Permian', kind: 'basin', lon: -102.5, lat: 31.8, note: 'Associated gas; rising GOR but gas still declines with oil.', weight: 90 },
  { id: 'haynesville', label: 'Haynesville', kind: 'basin', lon: -93.5, lat: 32.2, note: 'On-purpose dry gas; inventory quality critical (EXE, CRK).', weight: 95 },
  { id: 'appalachia', label: 'Appalachia', kind: 'basin', lon: -80.0, lat: 40.0, note: 'Marcellus/Utica; midstream and basis constraints.', weight: 85 },
  { id: 'gulf-lng', label: 'Gulf LNG', kind: 'lng', lon: -93.0, lat: 29.8, note: 'Export nameplate 15 → 35 Bcf/d approved path by 2030.', weight: 100 },
  { id: 'ercot-load', label: 'ERCOT load', kind: 'load', lon: -97.5, lat: 31.0, note: 'Data center + gas generation stack.', weight: 80 },
  { id: 'pjm-load', label: 'PJM / VA', kind: 'load', lon: -77.5, lat: 38.5, note: 'Data-center corridor; gas-marginal ISOs.', weight: 88 },
  { id: 'storage-midwest', label: 'Storage belt', kind: 'storage', lon: -88.0, lat: 41.0, note: 'Working gas cushion; days-to-cover collapse.', weight: 70 },
  { id: 'se-power', label: 'SE gas power', kind: 'power', lon: -84.0, lat: 33.5, note: 'Gas-heavy utility fleet; incremental power burn.', weight: 65 },
]

export const RELATED_PAPERS: ThesisPaper[] = [
  {
    id: 'chronometer-got-gas',
    title: 'Letter III: Got Gas',
    authors: 'Matthew Smith',
    org: 'Chronometer Partners / Colossus',
    year: 2026,
    kind: 'letter',
    stance: 'crisis',
    url: 'https://colossus.com/wp-content/uploads/2026/07/letter-III-got-gas.pdf',
    summary:
      'Bottom-up closed-loop model of U.S. gas: H2 2028 shortage, 2030 storage exhaustion, >5 Bcf/d deficit before full AI force. Midstream lag is the hard constraint.',
    keyClaims: [
      'Shortage starts H2 2028; working storage exhausted by 2030.',
      'Production max +20 Bcf/d; LNG +20; power burn +5 → deficit >5 Bcf/d.',
      'Days-to-cover 71.9 (2010) → 36.9 (2030).',
      'Nuclear AP1000 + solar/storage as structural responses.',
    ],
    tags: ['LNG', 'AI load', 'storage', 'midstream', 'Haynesville', 'Permian'],
    relatedness: 100,
    mapFocus: ['haynesville', 'gulf-lng', 'permian', 'pjm-load'],
  },
  {
    id: 'iltb-smith-483',
    title: 'Natural Gas: The Next Bottleneck (Invest Like the Best EP.483)',
    authors: 'Matthew Smith with Patrick O\'Shaughnessy',
    org: 'Invest Like the Best / Colossus',
    year: 2026,
    kind: 'podcast',
    stance: 'crisis',
    url: 'https://colossus.com/episode/americas-next-energy-crisis/',
    summary:
      'Podcast deep-dive: LNG + compute create structural shortage; infrastructure caps supply response; large-scale nuclear framed as durable fix.',
    keyClaims: [
      '2028 need exceeds deliverable gas.',
      'Working storage risk by 2030.',
      'Gas share of hyperscaler cost may rise sharply.',
    ],
    tags: ['podcast', 'LNG', 'AI', 'nuclear'],
    relatedness: 95,
    mapFocus: ['gulf-lng', 'pjm-load', 'ercot-load'],
  },
  {
    id: 'hamm-institute-gas-ai',
    title: 'Powering AI with American Energy: Natural Gas',
    authors: 'Hamm Institute for American Energy',
    org: 'Oklahoma State / Hamm Institute',
    year: 2025,
    kind: 'report',
    stance: 'growth',
    url: 'https://hamminstitute.org/site-files/documents/naturalgasdemand.pdf',
    summary:
      'Data-center-driven gas demand +3 to 6.1 Bcf/d by 2030; pipeline and interconnection bottlenecks; gas as near-term backbone for AI power.',
    keyClaims: [
      'Gas use for DCs up to ~6% of national production growth story.',
      '55 GW DC low case ~10 Bcf/d if all gas-powered (illustrative).',
      'Midstream and plant build constraints matter as much as resource.',
    ],
    tags: ['data centers', 'Bcf/d', 'policy', 'production'],
    relatedness: 82,
    mapFocus: ['ercot-load', 'permian', 'gulf-lng'],
  },
  {
    id: 'rbc-gas-dc-2026',
    title: 'Natural gas powers the data center boom',
    authors: 'Christopher Louney et al.',
    org: 'RBC Capital Markets',
    year: 2026,
    kind: 'analysis',
    stance: 'tight',
    url: 'https://www.rbccm.com/en/insights/2026/05/natural-gas-powers-the-data-center-boom',
    summary:
      'Forecast ~6.1 Bcf/d DC gas by 2030 (~20% lift to powerburn). Geographic overlap of DCs with gassy grids and basins. LNG still larger demand leg; zero-carbon gains after 2030.',
    keyClaims: [
      '6-7 Bcf/d DC gas range by decade end.',
      'DC ~17% of 2025 U.S. power consumption by 2030 in their framing.',
      'Gas backbone through this decade.',
    ],
    tags: ['sell-side', 'data centers', 'powerburn'],
    relatedness: 78,
    mapFocus: ['pjm-load', 'ercot-load', 'appalachia'],
  },
  {
    id: 'iea-energy-ai-supply',
    title: 'Energy supply for AI (Energy and AI)',
    authors: 'IEA',
    org: 'International Energy Agency',
    year: 2025,
    kind: 'agency',
    stance: 'balanced',
    url: 'https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai',
    summary:
      'Global DC generation 460 TWh (2024) to >1000 TWh (2030). Renewables ~half of incremental; gas+coal >40% of added DC supply to 2030; nuclear rising later.',
    keyClaims: [
      'Gas largest source of additional DC electricity supply near term (+130 TWh gen to 2030).',
      'Global, multi-fuel stack; not U.S.-only crisis framing.',
    ],
    tags: ['IEA', 'global', 'multi-fuel', 'data centers'],
    relatedness: 70,
    mapFocus: ['pjm-load', 'ercot-load'],
  },
  {
    id: 'doe-dc-electricity',
    title: 'DOE data center electricity demand evaluation',
    authors: 'U.S. Department of Energy',
    org: 'DOE',
    year: 2024,
    kind: 'agency',
    stance: 'growth',
    url: 'https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers',
    summary:
      'DCs ~4.4% of U.S. electricity in 2023; 6.7-12% by 2028 in growth cases. Foundational load numbers cited across AI-power theses.',
    keyClaims: [
      'Rapid share gains for data centers in total U.S. load.',
      'Implies large new generation and fuels requirements.',
    ],
    tags: ['DOE', 'load share', 'policy'],
    relatedness: 65,
    mapFocus: ['pjm-load', 'ercot-load', 'se-power'],
  },
  {
    id: 'sp-grid-power-demand',
    title: 'Data center grid power demand nearly triples by 2030',
    authors: 'S&P Global Commodity Insights',
    org: 'S&P Global',
    year: 2025,
    kind: 'analysis',
    stance: 'growth',
    url: 'https://www.spglobal.com/energy/en/news-research/latest-news/electric-power/101425-data-center-grid-power-demand-to-rise-22-in-2025-nearly-triple-by-2030',
    summary:
      'Industry tracking of DC grid power: sharp near-term growth, nearly triple by 2030; underpins gas and multi-fuel build narratives.',
    keyClaims: ['DC grid power demand trajectory is steep this decade.'],
    tags: ['S&P', 'grid power', 'data centers'],
    relatedness: 62,
    mapFocus: ['pjm-load', 'ercot-load'],
  },
  {
    id: 'aaf-gas-shift',
    title: 'AI Data Center Power Surge: Shifting Trends Toward Natural Gas',
    authors: 'Shuting Pomerleau, Irene Ko',
    org: 'American Action Forum',
    year: 2026,
    kind: 'analysis',
    stance: 'tight',
    url: 'https://www.americanactionforum.org/insight/ai-data-center-power-surge-shifting-trends-toward-natural-gas/',
    summary:
      'Policy insight: massive gas projects in TX and PA; tension with carbon-free targets; reliability prioritization for 24/7 AI loads.',
    keyClaims: [
      'Gas resurgence for AI reliability.',
      'Policy tradeoffs with clean targets.',
    ],
    tags: ['policy', 'Texas', 'Pennsylvania', 'reliability'],
    relatedness: 58,
    mapFocus: ['ercot-load', 'appalachia', 'pjm-load'],
  },
  {
    id: 'incorrys-na-gas-2035',
    title: 'North American Natural Gas Demand to 2035',
    authors: 'Incorrys',
    org: 'Incorrys',
    year: 2025,
    kind: 'report',
    stance: 'growth',
    url: 'https://www.incorrys.com/videos/NorthAmericanNaturalGasDemandTo2035.pdf',
    summary:
      'AI datacenter electricity +440 TWh by 2035; ~72 GW gas-fired capacity framing; power-sector gas growth ~2.9%/yr near term.',
    keyClaims: ['Datacenter power is a primary near-term gas demand driver alongside LNG.'],
    tags: ['North America', '2035', 'capacity'],
    relatedness: 60,
    mapFocus: ['gulf-lng', 'permian', 'ercot-load'],
  },
  {
    id: 'etf-midstream-ai',
    title: 'Midstream Leans Into AI Data Center Boom',
    authors: 'ETF Trends / industry notes',
    org: 'ETF Trends',
    year: 2025,
    kind: 'analysis',
    stance: 'growth',
    url: 'https://www.etftrends.com/energy-infrastructure-channel/midstream-leans-ai-data-center-boom/',
    summary:
      'Consensus-of-analysts style ~8 Bcf/d incremental gas opportunity by 2030 for AI DCs; midstream as dual-engine with LNG.',
    keyClaims: ['~8 Bcf/d average of four analyst DC gas forecasts by 2030.'],
    tags: ['midstream', 'Bcf/d', 'LNG'],
    relatedness: 55,
    mapFocus: ['gulf-lng', 'permian', 'haynesville'],
  },
  {
    id: '247-knife-fight',
    title: "A 'Knife Fight' Is Coming as AI Boom Creates a Natural Gas Crisis",
    authors: '247WallSt summary of Smith thesis',
    org: '247WallSt',
    year: 2026,
    kind: 'analysis',
    stance: 'crisis',
    url: 'https://247wallst.com/investing/2026/07/23/a-knife-fight-is-coming-as-ai-boom-creates-a-natural-gas-crisis/',
    summary:
      'Popularization of Chronometer view: structural shortage by 2028; LNG consumes most of +20 Bcf/d production lift; knife fight for molecules.',
    keyClaims: [
      'Production growth largely spoken for by LNG.',
      'Hyperscaler opex risk if gas doubles/triples.',
    ],
    tags: ['media', 'LNG', 'AI cost'],
    relatedness: 88,
    mapFocus: ['gulf-lng', 'haynesville'],
  },
]

export function papersByStance(stance?: ThesisStance) {
  if (!stance) return [...RELATED_PAPERS].sort((a, b) => b.relatedness - a.relatedness)
  return RELATED_PAPERS.filter((p) => p.stance === stance).sort((a, b) => b.relatedness - a.relatedness)
}

export function searchPapers(q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return papersByStance()
  return RELATED_PAPERS.filter(
    (p) =>
      p.title.toLowerCase().includes(s) ||
      p.authors.toLowerCase().includes(s) ||
      p.org.toLowerCase().includes(s) ||
      p.summary.toLowerCase().includes(s) ||
      p.tags.some((t) => t.toLowerCase().includes(s)) ||
      p.keyClaims.some((c) => c.toLowerCase().includes(s))
  ).sort((a, b) => b.relatedness - a.relatedness)
}

export function hubColor(kind: ThesisHub['kind']): string {
  switch (kind) {
    case 'basin':
      return '#22c55e'
    case 'lng':
      return '#38bdf8'
    case 'load':
      return '#f97316'
    case 'storage':
      return '#a78bfa'
    case 'power':
      return '#eab308'
  }
}
