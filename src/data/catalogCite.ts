/**
 * Catalog citation contract.
 * A row is verifiable only with sourceUrl and/or an EIA plant / generator ID.
 * Do not invent MW. Keep priorValue / priorAsOf when a cited number is corrected.
 */

export type CitationStatus = 'cited' | 'uncited' | 'demoted'

export interface CatalogCite {
  /** Public page: EIA-860/860M, utility docket, operator project page */
  sourceUrl?: string
  /** EIA-860 plant code (ORISPL) */
  eiaPlantCode?: string
  /** EIA-860 generator ID when the row is a single unit */
  eiaGeneratorId?: string
  /** Vintage of the cited figure (year or ISO date) */
  asOf?: string
  /** Previous catalog MW when this row was corrected */
  priorValue?: number
  priorAsOf?: string
  /** cited = has URL or EIA ID. demoted = kept on map, not a verified MW claim. */
  citation?: CitationStatus
  /** Operating / historical / offline label. Fail loud; do not imply live MW. */
  status?: string
}

export function isCited(row: CatalogCite | null | undefined): boolean {
  if (!row) return false
  if (row.citation === 'demoted' || row.citation === 'uncited') return false
  return Boolean(row.sourceUrl || row.eiaPlantCode || row.eiaGeneratorId)
}

export function citationLabel(row: CatalogCite | null | undefined): string {
  if (!row) return 'UNCITED'
  if (row.citation === 'demoted') return 'UNCITED · demoted'
  if (isCited(row)) {
    const bits = [
      row.eiaPlantCode ? `EIA ${row.eiaPlantCode}` : null,
      row.eiaGeneratorId ? `gen ${row.eiaGeneratorId}` : null,
      row.asOf ? `as of ${row.asOf}` : null,
    ].filter(Boolean)
    return bits.length ? `CITED · ${bits.join(' · ')}` : 'CITED'
  }
  return 'UNCITED'
}

export function eiaPlantUrl(plantCode: string): string {
  return `https://www.eia.gov/electricity/data/browser/#/plant/${encodeURIComponent(plantCode)}`
}

export function eia860Url(): string {
  return 'https://www.eia.gov/electricity/data/eia860/'
}

export function eia860mUrl(): string {
  return 'https://www.eia.gov/electricity/data/eia860m/'
}

/** EIA State Electricity Profile directory (name slug, no spaces). */
export function eiaStateProfileUrl(stateName: string): string {
  const slug = stateName.toLowerCase().replace(/[^a-z]/g, '')
  return `https://www.eia.gov/electricity/state/${slug}/`
}

export const EIA_EPM_URL = 'https://www.eia.gov/electricity/monthly/'
export const EIA_STATE_PROFILES_URL = 'https://www.eia.gov/electricity/state/'

/**
 * Merge cite fields onto a catalog row.
 * Explicit demote / uncited wins even if a URL is present.
 */
export function withCite<T extends { id: string }>(
  row: T,
  cites: Record<string, CatalogCite>
): T & CatalogCite {
  const extra = cites[row.id]
  if (!extra) return { ...row, citation: 'uncited' as const }
  return { ...row, ...extra, citation: extra.citation ?? (isCited(extra) ? 'cited' : 'uncited') }
}

export function citeCounts<T extends CatalogCite>(rows: T[]): {
  total: number
  cited: number
  uncited: number
  demoted: number
} {
  let cited = 0
  let uncited = 0
  let demoted = 0
  for (const r of rows) {
    if (r.citation === 'demoted') demoted += 1
    else if (isCited(r)) cited += 1
    else uncited += 1
  }
  return { total: rows.length, cited, uncited, demoted }
}
