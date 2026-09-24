import type {
  AgentRun,
  AnalystNote,
  BackfillCursor,
  BacktestScore,
  Forecast,
  Observation,
  Project,
  TimelineQuery,
} from '../history/types.ts'

export interface StorageAdapter {
  readonly driver: 'memory' | 'postgres'
  upsertObservations(rows: Observation[]): Promise<{ written: number }>
  insertForecasts(rows: Forecast[]): Promise<{ written: number }>
  listObservations(q: TimelineQuery): Promise<Observation[]>
  listForecasts(q: TimelineQuery & { model?: string }): Promise<Forecast[]>
  latestForecastVintage(series: string, region: string, model?: string): Promise<string | null>
  listSeries(region?: string): Promise<{ series: string; region: string; unit: string; source: string }[]>
  upsertProjects(rows: Project[]): Promise<{ written: number }>
  listProjects(): Promise<Project[]>
  insertBacktests(rows: BacktestScore[]): Promise<{ written: number }>
  listBacktests(series: string, region: string): Promise<BacktestScore[]>
  insertAnalystNote(note: AnalystNote): Promise<void>
  latestAnalystNote(region?: string): Promise<AnalystNote | null>
  logRun(run: AgentRun): Promise<void>
  getCursor(source: string, series: string, region: string): Promise<BackfillCursor | null>
  setCursor(cursor: BackfillCursor): Promise<void>
}

export class StorageUnavailable extends Error {
  constructor(message = 'DATABASE_URL is not set') {
    super(message)
    this.name = 'StorageUnavailable'
  }
}
