import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { acceptAnalystNote, buildAnalystFacts, unknownNumbers } from './analyst.ts'
import { observationsFromCaiso } from './caisoParse.ts'
import { observationsFromEia, timezoneForRespondent } from './eia.ts'
import {
  buildForecastBundle,
  leastSquares,
  seasonalNaiveForecast,
  yearTrend,
} from './forecast.ts'
import { scorePairs } from './metrics.ts'
import { projectLoadAt } from './projects.ts'
import { createMemoryAdapter } from '../storage/memory.ts'
import { createPostgresAdapter } from '../storage/postgres.ts'
import type { Observation, Project } from './types.ts'

const STATUS = `Produced,09/24/2026 11:31
Current demand,32179,09/24/2026 11:28
Todays peak,27422,09/24/2026 00:02
Forecasted peak,30000,09/24/2026 18:00
Tomorrow's Forecasted peak,37271
`

const DEMAND = `Time,Day ahead forecast,Hour ahead forecast,Current demand,Demand response
00:00,28465,27245,27006,
11:25,26000,26100,
11:30,26010,26110,27050,
`

describe('caiso parse', () => {
  it('keeps numeric cells and skips blanks', () => {
    const rows = observationsFromCaiso(
      { systemStatus: STATUS, demand: DEMAND, fuel: null, storage: null, netDemand: null },
      '2026-09-24T18:31:00.000Z'
    )
    const demand = rows.filter((row) => row.series === 'demand_mw')
    expect(demand.map((row) => row.value)).toEqual([27006, 27050])
    expect(demand.every((row) => row.truthClass === 'measured')).toBe(true)
    expect(demand.every((row) => row.source === "CAISO Today's Outlook")).toBe(true)
    const ahead = rows.find((row) => row.series === 'demand_hour_ahead_mw' && row.value === 26100)
    expect(ahead?.truthClass).toBe('estimate')
    expect(rows.find((row) => row.series === 'forecasted_peak_mw')?.value).toBe(30000)
    expect(rows.some((row) => row.value === 37271)).toBe(false)
  })

  it('refuses intraday rows without an operating day', () => {
    expect(() =>
      observationsFromCaiso(
        { systemStatus: null, demand: DEMAND, fuel: null, storage: null, netDemand: null },
        '2026-09-24T18:31:00.000Z'
      )
    ).toThrow(/operating day/)
  })
})

describe('eia parse', () => {
  it('uses the payload unit and refuses an unknown balancing authority', () => {
    const rows = observationsFromEia({
      rows: [{ period: '2015-07-01T00', respondent: 'CISO', value: '22110', 'value-units': 'megawatthours' }],
      respondent: 'CISO',
      series: 'eia_demand_mwh',
      truthClass: 'reported',
      sourceUrl: 'https://www.eia.gov/opendata/',
      retrievedAt: '2026-09-24T00:00:00.000Z',
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].unit).toBe('megawatthours')
    expect(rows[0].source).toBe('EIA Form 930')
    expect(rows[0].value).toBe(22110)
    expect(() => timezoneForRespondent('NOPE')).toThrow(/Refusing to guess/)
  })
})

describe('storage adapter', () => {
  it('upserts observations and keeps every forecast vintage', async () => {
    const db = createMemoryAdapter()
    const row: Observation = {
      series: 'demand_mw',
      region: 'CISO',
      ts: '2026-09-24T18:00:00.000Z',
      value: 10,
      unit: 'MW',
      truthClass: 'measured',
      source: 'CAISO Today\'s Outlook',
      sourceUrl: 'https://www.caiso.com/outlook/current/demand.csv',
      retrievedAt: '2026-09-24T18:05:00.000Z',
    }
    await db.upsertObservations([row])
    await db.upsertObservations([{ ...row, value: 12, retrievedAt: '2026-09-24T18:10:00.000Z' }])
    const listed = await db.listObservations({
      series: 'demand_mw',
      region: 'CISO',
      from: '2026-09-24T00:00:00.000Z',
      to: '2026-09-25T00:00:00.000Z',
    })
    expect(listed).toHaveLength(1)
    expect(listed[0].value).toBe(12)

    await db.insertForecasts([
      {
        series: 'demand_mw',
        region: 'CISO',
        targetTs: '2026-09-24T19:00:00.000Z',
        value: 11,
        p10: 9,
        p90: 13,
        model: 'seasonal_naive',
        issuedAt: '2026-09-24T18:00:00.000Z',
        inputs: null,
        sourceNotes: 'first',
      },
      {
        series: 'demand_mw',
        region: 'CISO',
        targetTs: '2026-09-24T19:00:00.000Z',
        value: 15,
        p10: 12,
        p90: 18,
        model: 'seasonal_naive',
        issuedAt: '2026-09-24T18:20:00.000Z',
        inputs: null,
        sourceNotes: 'second',
      },
    ])
    const forecasts = await db.listForecasts({
      series: 'demand_mw',
      region: 'CISO',
      from: '2026-09-24T00:00:00.000Z',
      to: '2026-09-25T00:00:00.000Z',
      model: 'seasonal_naive',
    })
    expect(forecasts).toHaveLength(1)
    expect(forecasts[0].value).toBe(15)
    expect(forecasts[0].sourceNotes).toBe('second')
  })

  it('issues an upsert for observations and a plain insert for forecasts', async () => {
    const sql: string[] = []
    const db = createPostgresAdapter(async (text) => {
      sql.push(text)
      return { rows: [], rowCount: 1 }
    })
    await db.upsertObservations([
      {
        series: 'demand_mw',
        region: 'CISO',
        ts: '2026-09-24T18:00:00.000Z',
        value: 1,
        unit: 'MW',
        truthClass: 'measured',
        source: 'CAISO Today\'s Outlook',
        sourceUrl: null,
        retrievedAt: '2026-09-24T18:00:00.000Z',
      },
    ])
    await db.insertForecasts([
      {
        series: 'demand_mw',
        region: 'CISO',
        targetTs: '2026-09-24T19:00:00.000Z',
        value: 1,
        p10: null,
        p90: null,
        model: 'seasonal_naive',
        issuedAt: '2026-09-24T18:00:00.000Z',
        inputs: { yoy: 1 },
        sourceNotes: 'note',
      },
    ])
    expect(sql[0]).toMatch(/ON CONFLICT \(series, region, ts, source\)/)
    expect(sql[1]).toMatch(/INSERT INTO forecasts/)
    expect(sql[1]).not.toMatch(/ON CONFLICT/)
  })
})

describe('forecast and backtest', () => {
  it('scores MAPE and repeats the same hour last year', () => {
    expect(
      scorePairs([
        { actual: 100, pred: 110, p10: 90, p90: 120 },
        { actual: 0, pred: 5, p10: null, p90: null },
      ])
    ).toMatchObject({ n: 2, mape: 10, coverageP10P90: 1 })

    const start = Date.parse('2024-01-01T00:00:00.000Z')
    const points = Array.from({ length: 24 * 400 }, (_, hour) => {
      const ts = new Date(start + hour * 3600_000).toISOString()
      return { ts, value: 1000 + new Date(ts).getUTCHours() }
    })
    const issuedAt = points[24 * 380].ts
    const history = points.filter((point) => point.ts < issuedAt)
    const trend = yearTrend(history, issuedAt)
    expect(trend?.factor).toBeCloseTo(1, 5)
    const forecast = seasonalNaiveForecast({
      points: history,
      issuedAt,
      horizonHours: 2,
      withTrend: true,
    })
    expect(forecast).toHaveLength(2)
    const expectedHour = new Date(forecast[0].targetTs).getUTCHours()
    expect(forecast[0].value).toBeCloseTo(1000 + expectedHour, 5)
    expect(forecast[0].p10).not.toBeNull()
    expect(forecast[0].p90).not.toBeNull()
  })

  it('selects the lower MAPE model and does not stack alternative paths', () => {
    const start = Date.parse('2023-01-01T00:00:00.000Z')
    const points = Array.from({ length: 24 * 800 }, (_, hour) => {
      const ts = new Date(start + hour * 3600_000).toISOString()
      const clock = new Date(ts).getUTCHours()
      const drift = hour > 24 * 400 ? 50 : 0
      return { ts, value: 2000 + clock * 20 + drift }
    })
    const issuedAt = points.at(-1)!.ts
    const projects: Project[] = [
      {
        name: 'Site A line 1',
        type: 'load',
        mw: 40,
        targetDate: '2024-01-01',
        lat: null,
        lon: null,
        substationPath: null,
        status: 'construction',
        source: 'Example filing',
        sourceUrl: 'https://example.com/a',
        siteKey: 'site-a',
        pathId: 'line-1',
        pathRole: 'primary',
      },
      {
        name: 'Site A line 2',
        type: 'load',
        mw: 90,
        targetDate: '2024-01-01',
        lat: null,
        lon: null,
        substationPath: null,
        status: 'construction',
        source: 'Example filing',
        sourceUrl: 'https://example.com/a',
        siteKey: 'site-a',
        pathId: 'line-2',
        pathRole: 'alternative',
      },
      {
        name: 'Unknown status',
        type: null,
        mw: 10,
        targetDate: '2024-01-01',
        lat: null,
        lon: null,
        substationPath: null,
        status: null,
        source: 'Example filing',
        sourceUrl: null,
        siteKey: 'site-b',
        pathId: null,
        pathRole: null,
      },
    ]
    expect(projectLoadAt(projects, issuedAt).mw).toBe(40)
    const bundle = buildForecastBundle({
      series: 'demand_mw',
      region: 'CISO',
      points,
      weather: [],
      futureWeather: [],
      issuedAt,
      horizonHours: 3,
      projects,
      backtestOrigins: [points[24 * 780].ts],
    })
    expect(bundle.rows.length).toBeGreaterThan(0)
    expect(bundle.projectLoad?.mw).toBe(40)
    expect(bundle.model === 'seasonal_naive' || bundle.model === 'seasonal_naive_trend').toBe(true)
    const beta = leastSquares(
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [1, 3, 5]
    )
    expect(beta?.[0]).toBeCloseTo(1, 6)
    expect(beta?.[1]).toBeCloseTo(2, 6)
  })
})

describe('analyst guard', () => {
  it('rejects a number that is not in stored facts', () => {
    const facts = buildAnalystFacts({
      region: 'CISO',
      generatedAt: '2026-09-24T00:00:00.000Z',
      observations: [
        {
          series: 'demand_mw',
          region: 'CISO',
          ts: '2026-09-24T18:00:00.000Z',
          value: 32179,
          unit: 'MW',
          truthClass: 'measured',
          source: "CAISO Today's Outlook",
          sourceUrl: 'https://www.caiso.com/outlook/current/demand.csv',
          retrievedAt: '2026-09-24T18:05:00.000Z',
        },
      ],
      forecasts: [],
      scores: [],
    })
    expect(unknownNumbers('Demand was 32179 MW.', [32179])).toEqual([])
    expect(() =>
      acceptAnalystNote({
        body: 'Demand jumped to 99999 MW.',
        facts,
        model: 'test',
        issuedAt: '2026-09-24T19:00:00.000Z',
      })
    ).toThrow(/not in stored facts/)
  })
})

describe('migration', () => {
  it('keeps forecast vintages and the observation unique key', () => {
    const sql = readFileSync(new URL('../../migrations/001_history.sql', import.meta.url), 'utf8')
    expect(sql).toMatch(/UNIQUE \(series, region, ts, source\)/)
    const forecasts = sql.slice(sql.indexOf('CREATE TABLE IF NOT EXISTS forecasts'))
    const nextTable = forecasts.indexOf('CREATE TABLE', 10)
    const forecastTable = forecasts.slice(0, nextTable)
    expect(forecastTable).not.toMatch(/UNIQUE/)
  })
})
