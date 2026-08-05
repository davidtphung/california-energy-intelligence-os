/**
 * State electricity trade (imports / exports) - EIA-style annual sample TWh.
 * Net = exports - imports (positive = net exporter).
 * Wire to EIA SEEDS / bulk transfer tables in production.
 */

export interface StateTrade {
  abbr: string
  /** Gross electricity imports (TWh/yr) */
  importsTwh: number
  /** Gross electricity exports (TWh/yr) */
  exportsTwh: number
  /** Primary import partners (short labels) */
  importFrom: string[]
  /** Primary export partners */
  exportTo: string[]
  note: string
}

/** Lookup by state abbr */
export const STATE_TRADE: Record<string, StateTrade> = {
  AL: { abbr: 'AL', importsTwh: 8, exportsTwh: 22, importFrom: ['MS', 'TN'], exportTo: ['GA', 'FL'], note: 'Nuclear surplus often exports south/east.' },
  AK: { abbr: 'AK', importsTwh: 0, exportsTwh: 0, importFrom: [], exportTo: [], note: 'Islanded; no interstate AC interchange.' },
  AZ: { abbr: 'AZ', importsTwh: 12, exportsTwh: 18, importFrom: ['NM', 'UT'], exportTo: ['CA', 'NV'], note: 'Palo Verde exports west; seasonal CA pulls.' },
  AR: { abbr: 'AR', importsTwh: 6, exportsTwh: 14, importFrom: ['OK', 'LA'], exportTo: ['TN', 'MO'], note: 'MISO South net exporter most years.' },
  CA: { abbr: 'CA', importsTwh: 70, exportsTwh: 12, importFrom: ['OR', 'WA', 'AZ', 'NV', 'BC'], exportTo: ['AZ', 'NV', 'OR'], note: 'Largest net importer; COI/PDCI/SW paths. Midday solar can reverse some ties.' },
  CO: { abbr: 'CO', importsTwh: 8, exportsTwh: 6, importFrom: ['WY', 'NM'], exportTo: ['UT', 'NE'], note: 'Near balanced; wind adds export hours.' },
  CT: { abbr: 'CT', importsTwh: 14, exportsTwh: 4, importFrom: ['NY', 'MA', 'RI'], exportTo: ['MA', 'RI'], note: 'ISO-NE; structural imports.' },
  DE: { abbr: 'DE', importsTwh: 5, exportsTwh: 1, importFrom: ['PA', 'MD', 'NJ'], exportTo: ['MD'], note: 'Small load; PJM imports.' },
  FL: { abbr: 'FL', importsTwh: 6, exportsTwh: 2, importFrom: ['GA', 'AL'], exportTo: ['GA'], note: 'Peninsula; limited ties; mostly self-served gas.' },
  GA: { abbr: 'GA', importsTwh: 10, exportsTwh: 16, importFrom: ['AL', 'SC'], exportTo: ['FL', 'TN'], note: 'Vogtle lifts export capability.' },
  HI: { abbr: 'HI', importsTwh: 0, exportsTwh: 0, importFrom: [], exportTo: [], note: 'Island grids; no interstate electricity trade.' },
  ID: { abbr: 'ID', importsTwh: 4, exportsTwh: 12, importFrom: ['WA', 'MT'], exportTo: ['UT', 'NV', 'CA path'], note: 'Hydro surplus exports south.' },
  IL: { abbr: 'IL', importsTwh: 15, exportsTwh: 55, importFrom: ['IN', 'MO'], exportTo: ['WI', 'MI', 'PJM East'], note: 'Nuclear + wind make a major exporter.' },
  IN: { abbr: 'IN', importsTwh: 18, exportsTwh: 12, importFrom: ['IL', 'OH', 'KY'], exportTo: ['MI', 'OH'], note: 'Often net importer as coal exits.' },
  IA: { abbr: 'IA', importsTwh: 8, exportsTwh: 28, importFrom: ['MN', 'NE'], exportTo: ['IL', 'WI', 'MO'], note: 'Wind surplus exporter.' },
  KS: { abbr: 'KS', importsTwh: 5, exportsTwh: 22, importFrom: ['OK', 'NE'], exportTo: ['MO', 'OK'], note: 'SPP wind export state.' },
  KY: { abbr: 'KY', importsTwh: 12, exportsTwh: 20, importFrom: ['IN', 'OH', 'TN'], exportTo: ['VA', 'TN'], note: 'Coal still supports exports some hours.' },
  LA: { abbr: 'LA', importsTwh: 10, exportsTwh: 8, importFrom: ['TX', 'MS'], exportTo: ['MS', 'AR'], note: 'Industrial load; near balanced.' },
  ME: { abbr: 'ME', importsTwh: 6, exportsTwh: 4, importFrom: ['NB', 'NH'], exportTo: ['NH', 'MA'], note: 'Hydro/wind; Canadian imports matter.' },
  MD: { abbr: 'MD', importsTwh: 28, exportsTwh: 6, importFrom: ['PA', 'VA', 'WV'], exportTo: ['DE', 'DC'], note: 'Structural PJM importer.' },
  MA: { abbr: 'MA', importsTwh: 32, exportsTwh: 5, importFrom: ['NH', 'NY', 'CT', 'QC'], exportTo: ['CT', 'RI'], note: 'High imports; offshore wind will shift mix.' },
  MI: { abbr: 'MI', importsTwh: 16, exportsTwh: 10, importFrom: ['OH', 'IN', 'ON'], exportTo: ['OH', 'IN'], note: 'Peninsula constraints; Canadian ties.' },
  MN: { abbr: 'MN', importsTwh: 12, exportsTwh: 14, importFrom: ['ND', 'WI', 'SD'], exportTo: ['WI', 'IA'], note: 'Near balanced; wind/nuclear trade.' },
  MS: { abbr: 'MS', importsTwh: 7, exportsTwh: 9, importFrom: ['LA', 'AL'], exportTo: ['AL', 'TN'], note: 'MISO South modest net exporter.' },
  MO: { abbr: 'MO', importsTwh: 14, exportsTwh: 8, importFrom: ['KS', 'IL', 'AR'], exportTo: ['IL', 'IA'], note: 'Often net importer.' },
  MT: { abbr: 'MT', importsTwh: 2, exportsTwh: 16, importFrom: ['ND', 'WY'], exportTo: ['WA', 'ID', 'CA path'], note: 'Hydro/coal/wind export west.' },
  NE: { abbr: 'NE', importsTwh: 4, exportsTwh: 10, importFrom: ['SD', 'KS'], exportTo: ['IA', 'KS'], note: 'Public power; wind/coal surplus hours.' },
  NV: { abbr: 'NV', importsTwh: 14, exportsTwh: 8, importFrom: ['CA', 'UT', 'AZ'], exportTo: ['CA', 'AZ'], note: 'Two-way trade with CA; solar midday export.' },
  NH: { abbr: 'NH', importsTwh: 5, exportsTwh: 8, importFrom: ['ME', 'VT', 'MA'], exportTo: ['MA', 'VT'], note: 'Seabrook supports regional exports.' },
  NJ: { abbr: 'NJ', importsTwh: 22, exportsTwh: 10, importFrom: ['PA', 'NY', 'DE'], exportTo: ['NY', 'PA'], note: 'Dense load; nuclear offsets imports.' },
  NM: { abbr: 'NM', importsTwh: 4, exportsTwh: 14, importFrom: ['TX', 'AZ'], exportTo: ['AZ', 'CO', 'CA path'], note: 'Wind/solar export corridor.' },
  NY: { abbr: 'NY', importsTwh: 26, exportsTwh: 12, importFrom: ['PJM', 'HQ', 'NE', 'ON'], exportTo: ['NE', 'PJM'], note: 'HQ hydro imports; downstate needs.' },
  NC: { abbr: 'NC', importsTwh: 12, exportsTwh: 10, importFrom: ['SC', 'VA', 'TN'], exportTo: ['SC', 'VA'], note: 'Near balanced SERC state.' },
  ND: { abbr: 'ND', importsTwh: 2, exportsTwh: 24, importFrom: ['MT', 'SD'], exportTo: ['MN', 'SD', 'MISO'], note: 'Strong net exporter (wind/coal).' },
  OH: { abbr: 'OH', importsTwh: 20, exportsTwh: 18, importFrom: ['PA', 'WV', 'IN'], exportTo: ['MI', 'PA'], note: 'Heavy PJM internal trade.' },
  OK: { abbr: 'OK', importsTwh: 6, exportsTwh: 30, importFrom: ['TX', 'KS'], exportTo: ['TX', 'AR', 'KS'], note: 'SPP wind export machine.' },
  OR: { abbr: 'OR', importsTwh: 10, exportsTwh: 28, importFrom: ['WA', 'ID', 'CA'], exportTo: ['CA', 'WA', 'NV'], note: 'PNW hydro/wind to California.' },
  PA: { abbr: 'PA', importsTwh: 12, exportsTwh: 70, importFrom: ['OH', 'WV', 'NY'], exportTo: ['NJ', 'MD', 'NY', 'DE'], note: 'Top eastern exporter (gas + nuclear).' },
  RI: { abbr: 'RI', importsTwh: 8, exportsTwh: 1, importFrom: ['CT', 'MA'], exportTo: ['CT'], note: 'Highly import dependent.' },
  SC: { abbr: 'SC', importsTwh: 8, exportsTwh: 14, importFrom: ['NC', 'GA'], exportTo: ['NC', 'GA'], note: 'Nuclear surplus some hours.' },
  SD: { abbr: 'SD', importsTwh: 3, exportsTwh: 12, importFrom: ['ND', 'NE'], exportTo: ['MN', 'IA', 'NE'], note: 'Wind + hydro exporter.' },
  TN: { abbr: 'TN', importsTwh: 10, exportsTwh: 12, importFrom: ['AL', 'KY', 'MS'], exportTo: ['GA', 'NC', 'VA'], note: 'TVA multi-state balancing.' },
  TX: { abbr: 'TX', importsTwh: 2, exportsTwh: 3, importFrom: ['OK', 'NM', 'MX'], exportTo: ['OK', 'MX'], note: 'ERCOT mostly islanded; limited DC ties.' },
  UT: { abbr: 'UT', importsTwh: 6, exportsTwh: 10, importFrom: ['WY', 'CO'], exportTo: ['NV', 'CA path'], note: 'Coal/solar exports via West ties.' },
  VT: { abbr: 'VT', importsTwh: 6, exportsTwh: 1, importFrom: ['HQ', 'NH', 'NY'], exportTo: ['NH'], note: 'Very high imports share of energy.' },
  VA: { abbr: 'VA', importsTwh: 30, exportsTwh: 8, importFrom: ['WV', 'NC', 'MD', 'TN'], exportTo: ['NC', 'MD'], note: 'Data centers lift import need.' },
  WA: { abbr: 'WA', importsTwh: 8, exportsTwh: 40, importFrom: ['BC', 'OR', 'MT'], exportTo: ['OR', 'CA', 'BC'], note: 'Major hydro exporter to CA and south.' },
  WV: { abbr: 'WV', importsTwh: 4, exportsTwh: 35, importFrom: ['OH', 'VA', 'PA'], exportTo: ['VA', 'MD', 'PA', 'OH'], note: 'Coal baseload export to PJM.' },
  WI: { abbr: 'WI', importsTwh: 14, exportsTwh: 8, importFrom: ['IL', 'MN', 'MI'], exportTo: ['IL', 'MN'], note: 'Often net importer from IL nuclear.' },
  WY: { abbr: 'WY', importsTwh: 2, exportsTwh: 22, importFrom: ['MT', 'CO'], exportTo: ['CO', 'UT', 'ID', 'CA path'], note: 'Coal + wind export state.' },
  PR: {
    abbr: 'PR',
    importsTwh: 0,
    exportsTwh: 0,
    importFrom: [],
    exportTo: [],
    note: 'Islanded PREPA/LUMA system; no AC interstate electricity trade. Energy imports are liquid fuels (oil, diesel, LNG feedstock), not grid kWh.',
  },
}

export function tradeOf(abbr: string): StateTrade {
  return (
    STATE_TRADE[abbr] ?? {
      abbr,
      importsTwh: 0,
      exportsTwh: 0,
      importFrom: [],
      exportTo: [],
      note: 'No trade sample.',
    }
  )
}

export function withTrade<T extends { abbr: string }>(states: T[]) {
  return states.map((s) => {
    const t = tradeOf(s.abbr)
    return {
      ...s,
      importsTwh: t.importsTwh,
      exportsTwh: t.exportsTwh,
      netExportTwh: t.exportsTwh - t.importsTwh,
      importFrom: t.importFrom,
      exportTo: t.exportTo,
      tradeNote: t.note,
    }
  })
}

export function tradeTotals(abbrs: string[]) {
  let imports = 0
  let exports = 0
  for (const a of abbrs) {
    const t = tradeOf(a)
    imports += t.importsTwh
    exports += t.exportsTwh
  }
  return { importsTwh: imports, exportsTwh: exports, netExportTwh: exports - imports }
}

/** CA monthly pattern sample (TWh) for seasonal import chart */
export const CA_MONTHLY_TRADE = [
  { month: 'Jan', imports: 6.8, exports: 0.8 },
  { month: 'Feb', imports: 5.9, exports: 0.7 },
  { month: 'Mar', imports: 5.2, exports: 0.9 },
  { month: 'Apr', imports: 4.8, exports: 1.1 },
  { month: 'May', imports: 5.5, exports: 1.3 },
  { month: 'Jun', imports: 6.2, exports: 1.0 },
  { month: 'Jul', imports: 7.4, exports: 0.9 },
  { month: 'Aug', imports: 7.8, exports: 0.8 },
  { month: 'Sep', imports: 6.9, exports: 1.0 },
  { month: 'Oct', imports: 5.6, exports: 1.2 },
  { month: 'Nov', imports: 5.4, exports: 0.9 },
  { month: 'Dec', imports: 6.5, exports: 0.7 },
]

/** Illustrative CA path split of annual imports (TWh) */
export const CA_IMPORT_PATHS = [
  { path: 'COI / Pacific NW', twh: 28, share: 40 },
  { path: 'SW / Arizona', twh: 18, share: 26 },
  { path: 'Nevada / IPP', twh: 10, share: 14 },
  { path: 'PDCI / Sylmar', twh: 8, share: 11 },
  { path: 'Mexico / other', twh: 6, share: 9 },
]
