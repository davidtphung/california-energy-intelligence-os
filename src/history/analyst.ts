import type { AnalystNote, BacktestScore, Forecast, Observation } from './types.ts'

export interface AnalystFacts {
  region: string
  generatedAt: string
  observations: {
    series: string
    ts: string
    value: number
    unit: string
    source: string
    sourceUrl: string | null
  }[]
  forecasts: {
    series: string
    model: string
    targetTs: string
    value: number
    p10: number | null
    p90: number | null
    issuedAt: string
  }[]
  scores: {
    model: string
    mape: number | null
    mae: number | null
    n: number
    vintageIssuedAt: string
  }[]
  citations: { source: string; sourceUrl: string | null }[]
}

export function buildAnalystFacts(args: {
  region: string
  generatedAt: string
  observations: Observation[]
  forecasts: Forecast[]
  scores: BacktestScore[]
}): AnalystFacts {
  const citations = new Map<string, { source: string; sourceUrl: string | null }>()
  for (const row of args.observations) {
    citations.set(`${row.source}|${row.sourceUrl ?? ''}`, { source: row.source, sourceUrl: row.sourceUrl })
  }
  return {
    region: args.region,
    generatedAt: args.generatedAt,
    observations: args.observations.map((o) => ({
      series: o.series,
      ts: o.ts,
      value: o.value,
      unit: o.unit,
      source: o.source,
      sourceUrl: o.sourceUrl,
    })),
    forecasts: args.forecasts.map((f) => ({
      series: f.series,
      model: f.model,
      targetTs: f.targetTs,
      value: f.value,
      p10: f.p10,
      p90: f.p90,
      issuedAt: f.issuedAt,
    })),
    scores: args.scores.map((s) => ({
      model: s.model,
      mape: s.mape,
      mae: s.mae,
      n: s.n,
      vintageIssuedAt: s.vintageIssuedAt,
    })),
    citations: [...citations.values()],
  }
}

export function factNumbers(facts: AnalystFacts): number[] {
  const nums: number[] = []
  const walk = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) nums.push(value)
    else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  walk(facts)
  return nums
}

export function numbersInText(text: string): number[] {
  const matches = text.match(/-?\d[\d,]*(?:\.\d+)?/g) ?? []
  return matches.map((raw) => Number(raw.replace(/,/g, ''))).filter((n) => Number.isFinite(n))
}

export function unknownNumbers(text: string, allowed: number[]): number[] {
  const unknown: number[] = []
  for (const n of numbersInText(text)) {
    const ok = allowed.some((fact) => {
      if (fact === n) return true
      const scale = Math.max(Math.abs(fact), 1)
      return Math.abs(fact - n) / scale <= 0.005
    })
    if (!ok) unknown.push(n)
  }
  return unknown
}

export function analystPrompt(facts: AnalystFacts): string {
  return [
    'Write a short plain-English note for an energy analyst.',
    'Use only the numbers in FACTS. Do not invent measurements, dates, or sources.',
    'If FACTS does not support a claim, say the stored data does not include it.',
    'Cover anomalies, forecast versus actual, and notable changes only when the figures are present.',
    'FACTS:',
    JSON.stringify(facts),
  ].join('\n')
}

export function acceptAnalystNote(args: {
  body: string
  facts: AnalystFacts
  model: string | null
  issuedAt: string
}): AnalystNote {
  const unknown = unknownNumbers(args.body, factNumbers(args.facts))
  if (unknown.length) {
    throw new Error(`Analyst note cited numbers that are not in stored facts: ${unknown.join(', ')}`)
  }
  return {
    issuedAt: args.issuedAt,
    region: args.facts.region,
    body: args.body.trim(),
    citations: args.facts.citations,
    model: args.model,
  }
}
