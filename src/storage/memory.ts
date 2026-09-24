import type {
  AgentRun,
  AnalystNote,
  BackfillCursor,
  BacktestScore,
  Forecast,
  Observation,
  Project,
} from '../history/types.ts'
import type { StorageAdapter } from './adapter.ts'

function obsKey(o: Pick<Observation, 'series' | 'region' | 'ts' | 'source'>): string {
  return `${o.series}|${o.region}|${o.ts}|${o.source}`
}

function inRange(ts: string, from: string, to: string): boolean {
  const t = Date.parse(ts)
  return t >= Date.parse(from) && t <= Date.parse(to)
}

export function createMemoryAdapter(): StorageAdapter {
  const observations = new Map<string, Observation>()
  const forecasts: Forecast[] = []
  const projects: Project[] = []
  const backtests: BacktestScore[] = []
  const notes: AnalystNote[] = []
  const runs: AgentRun[] = []
  const cursors = new Map<string, BackfillCursor>()
  let projectSeq = 1

  return {
    driver: 'memory',
    async upsertObservations(rows) {
      for (const row of rows) {
        observations.set(obsKey(row), { ...row })
      }
      return { written: rows.length }
    },
    async insertForecasts(rows) {
      for (const row of rows) forecasts.push({ ...row, inputs: row.inputs ? { ...row.inputs } : null })
      return { written: rows.length }
    },
    async listObservations(q) {
      return [...observations.values()]
        .filter((o) => o.series === q.series && o.region === q.region && inRange(o.ts, q.from, q.to))
        .sort((a, b) => a.ts.localeCompare(b.ts))
    },
    async listForecasts(q) {
      let rows = forecasts.filter((f) => f.series === q.series && f.region === q.region)
      if (q.model) rows = rows.filter((f) => f.model === q.model)
      if (!rows.length) return []
      const vintage = rows.map((r) => r.issuedAt).sort().at(-1) as string
      return rows
        .filter((f) => f.issuedAt === vintage && inRange(f.targetTs, q.from, q.to))
        .sort((a, b) => a.targetTs.localeCompare(b.targetTs))
    },
    async latestForecastVintage(series, region, model) {
      const rows = forecasts.filter(
        (f) => f.series === series && f.region === region && (model == null || f.model === model)
      )
      if (!rows.length) return null
      return rows.map((r) => r.issuedAt).sort().at(-1) ?? null
    },
    async listSeries(region) {
      const map = new Map<string, { series: string; region: string; unit: string; source: string }>()
      for (const o of observations.values()) {
        if (region && o.region !== region) continue
        map.set(`${o.series}|${o.region}`, {
          series: o.series,
          region: o.region,
          unit: o.unit,
          source: o.source,
        })
      }
      return [...map.values()].sort((a, b) => a.series.localeCompare(b.series))
    },
    async upsertProjects(rows) {
      for (const row of rows) {
        projects.push({ ...row, id: row.id ?? projectSeq++ })
      }
      return { written: rows.length }
    },
    async listProjects() {
      return projects.map((p) => ({ ...p }))
    },
    async insertBacktests(rows) {
      for (const row of rows) backtests.push({ ...row })
      return { written: rows.length }
    },
    async listBacktests(series, region) {
      return backtests
        .filter((b) => b.series === series && b.region === region)
        .sort((a, b) => b.vintageIssuedAt.localeCompare(a.vintageIssuedAt))
    },
    async insertAnalystNote(note) {
      notes.push({ ...note, citations: note.citations.map((c) => ({ ...c })) })
    },
    async latestAnalystNote(region) {
      const rows = notes.filter((n) => region == null || n.region === region)
      return rows.at(-1) ?? null
    },
    async logRun(run) {
      runs.push({ ...run })
    },
    async getCursor(source, series, region) {
      return cursors.get(`${source}|${series}|${region}`) ?? null
    },
    async setCursor(cursor) {
      cursors.set(`${cursor.source}|${cursor.series}|${cursor.region}`, { ...cursor })
    },
  }
}
