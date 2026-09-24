import type {
  AgentRun,
  AnalystNote,
  BacktestScore,
  Forecast,
  Observation,
  Project,
  TimelineQuery,
} from '../history/types.ts'
import type { StorageAdapter } from './adapter.ts'

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  rowCount: number | null
}

export type QueryFn = (text: string, values?: unknown[]) => Promise<QueryResult>

const OBS_COLS = 9

export function createPostgresAdapter(query: QueryFn): StorageAdapter {
  return {
    driver: 'postgres',
    async upsertObservations(rows) {
      if (!rows.length) return { written: 0 }
      const chunk = 200
      let written = 0
      for (let i = 0; i < rows.length; i += chunk) {
        const slice = rows.slice(i, i + chunk)
        const values: unknown[] = []
        const tuples = slice.map((row, idx) => {
          const base = idx * OBS_COLS
          values.push(
            row.series,
            row.region,
            row.ts,
            row.value,
            row.unit,
            row.truthClass,
            row.source,
            row.sourceUrl,
            row.retrievedAt
          )
          const ph = Array.from({ length: OBS_COLS }, (_, k) => `$${base + k + 1}`)
          return `(${ph.join(', ')})`
        })
        await query(
          `INSERT INTO observations
            (series, region, ts, value, unit, truth_class, source, source_url, retrieved_at)
           VALUES ${tuples.join(', ')}
           ON CONFLICT (series, region, ts, source) DO UPDATE SET
             value = EXCLUDED.value,
             unit = EXCLUDED.unit,
             truth_class = EXCLUDED.truth_class,
             source_url = EXCLUDED.source_url,
             retrieved_at = EXCLUDED.retrieved_at`,
          values
        )
        written += slice.length
      }
      return { written }
    },
    async insertForecasts(rows) {
      if (!rows.length) return { written: 0 }
      for (const row of rows) {
        await query(
          `INSERT INTO forecasts
            (series, region, target_ts, value, p10, p90, model, issued_at, inputs, source_notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`,
          [
            row.series,
            row.region,
            row.targetTs,
            row.value,
            row.p10,
            row.p90,
            row.model,
            row.issuedAt,
            row.inputs ? JSON.stringify(row.inputs) : null,
            row.sourceNotes,
          ]
        )
      }
      return { written: rows.length }
    },
    async listObservations(q: TimelineQuery) {
      const res = await query(
        `SELECT series, region, ts, value, unit, truth_class, source, source_url, retrieved_at
         FROM observations
         WHERE series = $1 AND region = $2 AND ts >= $3 AND ts <= $4
         ORDER BY ts ASC`,
        [q.series, q.region, q.from, q.to]
      )
      return res.rows.map(rowToObservation)
    },
    async listForecasts(q) {
      const vintage = await this.latestForecastVintage(q.series, q.region, q.model)
      if (!vintage) return []
      const res = await query(
        `SELECT series, region, target_ts, value, p10, p90, model, issued_at, inputs, source_notes
         FROM forecasts
         WHERE series = $1 AND region = $2 AND issued_at = $3
           AND ($4::text IS NULL OR model = $4)
           AND target_ts >= $5 AND target_ts <= $6
         ORDER BY target_ts ASC`,
        [q.series, q.region, vintage, q.model ?? null, q.from, q.to]
      )
      return res.rows.map(rowToForecast)
    },
    async latestForecastVintage(series, region, model) {
      const res = await query(
        `SELECT issued_at FROM forecasts
         WHERE series = $1 AND region = $2 AND ($3::text IS NULL OR model = $3)
         ORDER BY issued_at DESC
         LIMIT 1`,
        [series, region, model ?? null]
      )
      const issued = res.rows[0]?.issued_at
      return issued == null ? null : new Date(issued as string).toISOString()
    },
    async listSeries(region) {
      const res = await query(
        `SELECT DISTINCT ON (series, region) series, region, unit, source
         FROM observations
         WHERE ($1::text IS NULL OR region = $1)
         ORDER BY series, region, ts DESC`,
        [region ?? null]
      )
      return res.rows.map((r) => ({
        series: String(r.series),
        region: String(r.region),
        unit: String(r.unit),
        source: String(r.source),
      }))
    },
    async upsertProjects(rows) {
      for (const row of rows) {
        await query(
          `INSERT INTO projects
            (name, type, mw, target_date, lat, lon, substation_path, status, source, source_url, site_key, path_id, path_role)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            row.name,
            row.type,
            row.mw,
            row.targetDate,
            row.lat,
            row.lon,
            row.substationPath,
            row.status,
            row.source,
            row.sourceUrl,
            row.siteKey,
            row.pathId,
            row.pathRole,
          ]
        )
      }
      return { written: rows.length }
    },
    async listProjects() {
      const res = await query(
        `SELECT id, name, type, mw, target_date, lat, lon, substation_path, status, source, source_url, site_key, path_id, path_role
         FROM projects ORDER BY id ASC`
      )
      return res.rows.map(rowToProject)
    },
    async insertBacktests(rows) {
      for (const row of rows) {
        await query(
          `INSERT INTO backtest_scores
            (series, region, model, vintage_issued_at, scored_at, horizon_hours, n, mape, mae, rmse, bias, coverage_p10_p90, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            row.series,
            row.region,
            row.model,
            row.vintageIssuedAt,
            row.scoredAt,
            row.horizonHours,
            row.n,
            row.mape,
            row.mae,
            row.rmse,
            row.bias,
            row.coverageP10P90,
            row.notes,
          ]
        )
      }
      return { written: rows.length }
    },
    async listBacktests(series, region) {
      const res = await query(
        `SELECT series, region, model, vintage_issued_at, scored_at, horizon_hours, n, mape, mae, rmse, bias, coverage_p10_p90, notes
         FROM backtest_scores
         WHERE series = $1 AND region = $2
         ORDER BY vintage_issued_at DESC, model ASC`,
        [series, region]
      )
      return res.rows.map(rowToBacktest)
    },
    async insertAnalystNote(note) {
      await query(
        `INSERT INTO analyst_notes (issued_at, region, body, citations, model)
         VALUES ($1,$2,$3,$4::jsonb,$5)`,
        [note.issuedAt, note.region, note.body, JSON.stringify(note.citations), note.model]
      )
    },
    async latestAnalystNote(region) {
      const res = await query(
        `SELECT issued_at, region, body, citations, model
         FROM analyst_notes
         WHERE ($1::text IS NULL OR region = $1)
         ORDER BY issued_at DESC
         LIMIT 1`,
        [region ?? null]
      )
      const row = res.rows[0]
      if (!row) return null
      return rowToNote(row)
    },
    async logRun(run: AgentRun) {
      await query(
        `INSERT INTO agent_runs (agent, started_at, finished_at, status, message, detail)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
        [
          run.agent,
          run.startedAt,
          run.finishedAt,
          run.status,
          run.message,
          run.detail ? JSON.stringify(run.detail) : null,
        ]
      )
    },
    async getCursor(source, series, region) {
      const res = await query(
        `SELECT source, series, region, next_start, updated_at
         FROM backfill_cursors WHERE source = $1 AND series = $2 AND region = $3`,
        [source, series, region]
      )
      const row = res.rows[0]
      if (!row) return null
      return {
        source: String(row.source),
        series: String(row.series),
        region: String(row.region),
        nextStart: row.next_start ? new Date(row.next_start as string).toISOString() : null,
        updatedAt: new Date(row.updated_at as string).toISOString(),
      }
    },
    async setCursor(cursor) {
      await query(
        `INSERT INTO backfill_cursors (source, series, region, next_start, updated_at)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (source, series, region) DO UPDATE SET
           next_start = EXCLUDED.next_start,
           updated_at = EXCLUDED.updated_at`,
        [cursor.source, cursor.series, cursor.region, cursor.nextStart, cursor.updatedAt]
      )
    },
  }
}

function iso(v: unknown): string {
  return new Date(v as string).toISOString()
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function rowToObservation(r: Record<string, unknown>): Observation {
  return {
    series: String(r.series),
    region: String(r.region),
    ts: iso(r.ts),
    value: Number(r.value),
    unit: String(r.unit),
    truthClass: r.truth_class as Observation['truthClass'],
    source: String(r.source),
    sourceUrl: r.source_url == null ? null : String(r.source_url),
    retrievedAt: iso(r.retrieved_at),
  }
}

function rowToForecast(r: Record<string, unknown>): Forecast {
  let inputs: Record<string, unknown> | null = null
  if (r.inputs && typeof r.inputs === 'object') inputs = r.inputs as Record<string, unknown>
  else if (typeof r.inputs === 'string') inputs = JSON.parse(r.inputs) as Record<string, unknown>
  return {
    series: String(r.series),
    region: String(r.region),
    targetTs: iso(r.target_ts),
    value: Number(r.value),
    p10: num(r.p10),
    p90: num(r.p90),
    model: String(r.model),
    issuedAt: iso(r.issued_at),
    inputs,
    sourceNotes: r.source_notes == null ? null : String(r.source_notes),
  }
}

function rowToProject(r: Record<string, unknown>): Project {
  return {
    id: r.id == null ? undefined : Number(r.id),
    name: String(r.name),
    type: r.type == null ? null : String(r.type),
    mw: num(r.mw),
    targetDate: r.target_date == null ? null : String(r.target_date).slice(0, 10),
    lat: num(r.lat),
    lon: num(r.lon),
    substationPath: r.substation_path == null ? null : String(r.substation_path),
    status: r.status == null ? null : String(r.status),
    source: String(r.source),
    sourceUrl: r.source_url == null ? null : String(r.source_url),
    siteKey: r.site_key == null ? null : String(r.site_key),
    pathId: r.path_id == null ? null : String(r.path_id),
    pathRole: r.path_role == null ? null : String(r.path_role),
  }
}

function rowToBacktest(r: Record<string, unknown>): BacktestScore {
  return {
    series: String(r.series),
    region: String(r.region),
    model: String(r.model),
    vintageIssuedAt: iso(r.vintage_issued_at),
    scoredAt: iso(r.scored_at),
    horizonHours: r.horizon_hours == null ? null : Number(r.horizon_hours),
    n: Number(r.n),
    mape: num(r.mape),
    mae: num(r.mae),
    rmse: num(r.rmse),
    bias: num(r.bias),
    coverageP10P90: num(r.coverage_p10_p90),
    notes: r.notes == null ? null : String(r.notes),
  }
}

function rowToNote(r: Record<string, unknown>): AnalystNote {
  let citations: AnalystNote['citations'] = []
  if (Array.isArray(r.citations)) citations = r.citations as AnalystNote['citations']
  else if (typeof r.citations === 'string') citations = JSON.parse(r.citations) as AnalystNote['citations']
  return {
    issuedAt: iso(r.issued_at),
    region: r.region == null ? null : String(r.region),
    body: String(r.body),
    citations,
    model: r.model == null ? null : String(r.model),
  }
}

type PgPool = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>
}

let pool: PgPool | null = null

export async function postgresAdapterFromEnv(): Promise<StorageAdapter> {
  const url = process.env.DATABASE_URL
  if (!url) {
    const { StorageUnavailable } = await import('./adapter.ts')
    throw new StorageUnavailable()
  }
  if (!pool) {
    const pg = await import('pg')
    const Pool = pg.default?.Pool ?? pg.Pool
    pool = new Pool({ connectionString: url, max: 1 })
  }
  const active = pool
  return createPostgresAdapter(async (text, values) => {
    const res = await active.query(text, values)
    return { rows: res.rows, rowCount: res.rowCount }
  })
}
