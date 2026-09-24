export type TruthClass = 'measured' | 'reported' | 'estimate'

export interface Observation {
  series: string
  region: string
  ts: string
  value: number
  unit: string
  truthClass: TruthClass
  source: string
  sourceUrl: string | null
  retrievedAt: string
}

export interface Forecast {
  series: string
  region: string
  targetTs: string
  value: number
  p10: number | null
  p90: number | null
  model: string
  issuedAt: string
  inputs: Record<string, unknown> | null
  sourceNotes: string | null
}

export interface Project {
  id?: number
  name: string
  type: string | null
  mw: number | null
  targetDate: string | null
  lat: number | null
  lon: number | null
  substationPath: string | null
  status: string | null
  source: string
  sourceUrl: string | null
  siteKey: string | null
  pathId: string | null
  pathRole: string | null
}

export interface BacktestScore {
  series: string
  region: string
  model: string
  vintageIssuedAt: string
  scoredAt: string
  horizonHours: number | null
  n: number
  mape: number | null
  mae: number | null
  rmse: number | null
  bias: number | null
  coverageP10P90: number | null
  notes: string | null
}

export interface AnalystNote {
  issuedAt: string
  region: string | null
  body: string
  citations: { source: string; sourceUrl: string | null }[]
  model: string | null
}

export interface AgentRun {
  agent: string
  startedAt: string
  finishedAt: string | null
  status: 'ok' | 'error' | 'skipped'
  message: string | null
  detail: Record<string, unknown> | null
}

export interface BackfillCursor {
  source: string
  series: string
  region: string
  nextStart: string | null
  updatedAt: string
}

export interface TimelineQuery {
  series: string
  region: string
  from: string
  to: string
}
