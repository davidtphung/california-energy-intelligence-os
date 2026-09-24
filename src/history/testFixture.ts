import type { Forecast, Observation } from './types.ts'

/** Layout-only series. Not a CAISO or EIA measurement. */
export const TEST_FIXTURE_LABEL =
  'TEST DATA. Synthetic series for layout checks. Not a measurement and not from CAISO or EIA.'

export function testTimelineFixture(now = new Date('2026-01-15T00:00:00.000Z')) {
  const observations: Observation[] = []
  const forecasts: Forecast[] = []
  for (let h = 48; h >= 1; h--) {
    const ts = new Date(now.getTime() - h * 3600_000).toISOString()
    observations.push({
      series: 'demand_mw',
      region: 'TEST',
      ts,
      value: 100 + (h % 12),
      unit: 'MW',
      truthClass: 'measured',
      source: 'TEST DATA',
      sourceUrl: null,
      retrievedAt: now.toISOString(),
    })
  }
  for (let h = 1; h <= 24; h++) {
    const targetTs = new Date(now.getTime() + h * 3600_000).toISOString()
    const value = 110 + (h % 6)
    forecasts.push({
      series: 'demand_mw',
      region: 'TEST',
      targetTs,
      value,
      p10: value - 5,
      p90: value + 8,
      model: 'test_fixture',
      issuedAt: now.toISOString(),
      inputs: { fixture: true },
      sourceNotes: TEST_FIXTURE_LABEL,
    })
  }
  return {
    label: TEST_FIXTURE_LABEL,
    series: 'demand_mw',
    region: 'TEST',
    unit: 'MW',
    source: 'TEST DATA',
    sourceUrl: null,
    observations,
    forecasts,
    projectLoad: {
      mw: 0,
      included: [],
      excluded: [],
    },
    scores: [],
    note: null,
  }
}
