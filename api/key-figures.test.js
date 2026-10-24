import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  KEY_FIGURES_CACHE_CONTROL,
  buildKeyFigures,
  parseLatestObject,
  parseSystemStatus,
} from './key-figures.js'

const STATUS = `Produced,2026-01-01 00:00:00
Current demand,100,2026-01-01 00:05:00
Today's peak,200,2026-01-01 18:00:00
Forecasted peak,180,2026-01-01 16:00:00
Tomorrow forecasted peak,150,2026-01-02 16:00:00
`

const FUEL = `Time,Solar,Wind,Natural Gas,Batteries
00:00,1,2,3,0
00:05,4,5,6,-7
`

test('system status parser keeps fixture values and separates tomorrow from today', () => {
  const parsed = parseSystemStatus(STATUS)
  assert.equal(parsed.current.value, 100)
  assert.equal(parsed.current.observedAt, '2026-01-01 00:05:00')
  assert.equal(parsed.todayPeak.value, 200)
  assert.equal(parsed.forecastPeak.value, 180)
  assert.equal(parsed.tomorrowPeak.value, 150)
  assert.equal(parsed.produced, '2026-01-01 00:00:00')
})

test('latest fuel row is the last numeric row, including zero and negative', () => {
  const parsed = parseLatestObject(FUEL, ['Solar', 'Batteries'])
  assert.equal(parsed.record.Time, '00:05')
  assert.equal(parsed.record.Solar, '4')
  assert.equal(parsed.record.Batteries, '-7')
})

test('html responses do not become figures', () => {
  const parsed = parseSystemStatus('<html><body>nope</body></html>')
  assert.equal(parsed.error, 'HTML response')
  assert.equal(parsed.current, undefined)
})

test('buildKeyFigures returns only parsed fixture numbers', async () => {
  const files = new Map([
    ['https://www.caiso.com/outlook/current/systemstatus.csv', STATUS],
    ['https://www.caiso.com/outlook/current/demand.csv', 'Time,Current demand,Hour ahead forecast,Day ahead forecast\n00:05,999,11,12\n'],
    ['https://www.caiso.com/outlook/current/fuelsource.csv', FUEL],
    ['https://www.caiso.com/outlook/current/storage.csv', 'Time,Total batteries\n00:05,8\n'],
    ['https://www.caiso.com/outlook/current/netdemand.csv', 'Time,Net demand\n00:05,9\n'],
    [
      'https://api.open-meteo.com/v1/forecast?latitude=37.0&longitude=-120.0&current=temperature_2m,wind_speed_10m,shortwave_radiation&timezone=America%2FLos_Angeles',
      JSON.stringify({ current: { time: '2026-01-01T00:00', temperature_2m: 13, wind_speed_10m: 14, shortwave_radiation: 15 } }),
    ],
  ])
  const fetchImpl = async (url) => ({
    ok: true,
    status: 200,
    text: async () => files.get(url) ?? '<html>missing</html>',
  })
  const body = await buildKeyFigures(fetchImpl, () => new Date('2026-01-01T00:00:00.000Z'))
  assert.equal(body.ok, true)
  const byId = Object.fromEntries(body.figures.map((row) => [row.id, row]))
  assert.equal(byId['caiso.currentDemand'].value, 100)
  assert.equal(byId['caiso.currentDemand'].sourceUrl, 'https://www.caiso.com/outlook/current/systemstatus.csv')
  assert.equal(byId['caiso.hourAhead'].value, 11)
  assert.equal(byId['caiso.fuel.solar'].value, 4)
  assert.equal(byId['caiso.fuel.batteries'].value, -7)
  assert.equal(byId['caiso.storage.total'].value, 8)
  assert.equal(byId['caiso.netDemand'].value, 9)
  assert.equal(body.figures.some((row) => row.value === 999), false)
  assert.equal(body.context.find((row) => row.id === 'open-meteo.temperature').value, 13)
  assert.equal(body.fetchedAt, '2026-01-01T00:00:00.000Z')
  assert.equal(JSON.stringify(body).includes('SAMPLE catalog figures are not included'), true)
})

test('failed upstream fetches omit values', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 503,
    text: async () => '<html>down</html>',
  })
  const body = await buildKeyFigures(fetchImpl, () => new Date('2026-01-01T00:00:00.000Z'))
  assert.equal(body.ok, false)
  assert.deepEqual(body.figures, [])
  assert.deepEqual(body.context, [])
  assert.ok(body.errors.length >= 6)
})

test('vercel cache header matches the endpoint constant', () => {
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  const header = vercel.headers.find((block) => block.source === '/api/key-figures')
  const cache = header.headers.find((item) => item.key === 'Cache-Control')
  assert.equal(cache.value, KEY_FIGURES_CACHE_CONTROL)
})
