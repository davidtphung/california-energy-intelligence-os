/**
 * Read-only LIVE figures for answer engines.
 * Values are parsed from the upstream response. Nothing is filled in when a parse fails.
 * SAMPLE catalog numbers are not part of this payload.
 */

export const KEY_FIGURES_CACHE_SECONDS = 30
export const KEY_FIGURES_SWR_SECONDS = 30

export const KEY_FIGURES_CACHE_CONTROL = `public, max-age=${KEY_FIGURES_CACHE_SECONDS}, s-maxage=${KEY_FIGURES_CACHE_SECONDS}, stale-while-revalidate=${KEY_FIGURES_SWR_SECONDS}`

const ORIGIN = 'https://eis.davidtphung.com'
const CAISO_BASE = 'https://www.caiso.com/outlook/current'
const OPEN_METEO =
  'https://api.open-meteo.com/v1/forecast?latitude=37.0&longitude=-120.0&current=temperature_2m,wind_speed_10m,shortwave_radiation&timezone=America%2FLos_Angeles'

const NOTE =
  'Values are parsed from the upstream file at fetch time. A field that does not parse is omitted. SAMPLE catalog figures are not included. CAISO Today\'s Outlook is informational telemetry, not billing data and not OASIS. The Open-Meteo block is weather at 37N, 120W, the Central Valley proxy EIS already uses, not a CAISO meter.'

function parseCsv(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => line.split(',').map((cell) => cell.trim()))
}

function num(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function looksLikeHtml(text) {
  const head = text.slice(0, 400).toLowerCase()
  return head.includes('<html') || head.includes('<!doctype')
}

function findRow(rows, pred) {
  for (const row of rows) {
    if (row[0] && pred(row[0].toLowerCase())) return row
  }
  return null
}

function valueCell(row) {
  if (!row) return null
  const value = num(row[1])
  if (value == null) return null
  return { value, observedAt: row[2] || '' }
}

export function parseSystemStatus(text) {
  if (looksLikeHtml(text)) return { error: 'HTML response' }
  const rows = parseCsv(text)
  return {
    produced: findRow(rows, (key) => key.includes('produced'))?.[1] || '',
    current: valueCell(findRow(rows, (key) => key.includes('current demand'))),
    todayPeak: valueCell(findRow(rows, (key) => key.includes('today') && key.includes('peak'))),
    forecastPeak: valueCell(
      findRow(rows, (key) => key.includes('forecast') && key.includes('peak') && !key.includes('tomorrow')),
    ),
    tomorrowPeak: valueCell(findRow(rows, (key) => key.includes('tomorrow'))),
  }
}

export function parseLatestObject(text, keys) {
  if (looksLikeHtml(text)) return { error: 'HTML response' }
  const rows = parseCsv(text)
  if (rows.length < 2) return { error: 'No data rows' }
  const headers = rows[0]
  const index = new Map(headers.map((header, i) => [header, i]))
  for (let i = rows.length - 1; i >= 1; i--) {
    const row = rows[i]
    if (keys.some((key) => num(row[index.get(key)]) != null)) {
      const record = {}
      headers.forEach((header, col) => {
        record[header] = row[col] ?? ''
      })
      return { record }
    }
  }
  return { error: 'No numeric row' }
}

function figure(fields) {
  if (fields.value == null || !Number.isFinite(fields.value)) return null
  const out = {
    id: fields.id,
    label: fields.label,
    value: fields.value,
    unit: fields.unit,
    truthClass: 'LIVE',
    source: fields.source,
    sourceUrl: fields.sourceUrl,
    fetchedAt: fields.fetchedAt,
  }
  if (fields.observedAt) out.observedAt = fields.observedAt
  if (fields.note) out.note = fields.note
  return out
}

async function pull(fetchImpl, url) {
  try {
    const res = await fetchImpl(url, {
      headers: {
        Accept: 'text/csv,application/json,*/*',
        'User-Agent': 'EIS-key-figures (https://eis.davidtphung.com)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    })
    const text = await res.text()
    if (!res.ok || looksLikeHtml(text)) {
      return {
        url,
        text: null,
        message: looksLikeHtml(text) ? 'HTML response' : `HTTP ${res.status}`,
      }
    }
    return { url, text, message: '' }
  } catch (error) {
    return {
      url,
      text: null,
      message: error instanceof Error ? error.message : 'Fetch failed',
    }
  }
}

export async function buildKeyFigures(fetchImpl = globalThis.fetch, now = () => new Date()) {
  const fetchedAt = now().toISOString()
  const errors = []
  const figures = []
  const context = []

  const [status, demand, fuel, storage, net, weather] = await Promise.all([
    pull(fetchImpl, `${CAISO_BASE}/systemstatus.csv`),
    pull(fetchImpl, `${CAISO_BASE}/demand.csv`),
    pull(fetchImpl, `${CAISO_BASE}/fuelsource.csv`),
    pull(fetchImpl, `${CAISO_BASE}/storage.csv`),
    pull(fetchImpl, `${CAISO_BASE}/netdemand.csv`),
    pull(fetchImpl, OPEN_METEO),
  ])

  for (const file of [status, demand, fuel, storage, net, weather]) {
    if (!file.text) errors.push({ sourceUrl: file.url, message: file.message || 'Empty response' })
  }

  const statusParsed = status.text ? parseSystemStatus(status.text) : null
  if (statusParsed?.error) errors.push({ sourceUrl: status.url, message: statusParsed.error })

  const demandParsed = demand.text
    ? parseLatestObject(demand.text, ['Current demand', 'Hour ahead forecast', 'Day ahead forecast'])
    : null
  if (demandParsed?.error) errors.push({ sourceUrl: demand.url, message: demandParsed.error })

  const add = (fields) => {
    const row = figure({ ...fields, fetchedAt })
    if (row) figures.push(row)
  }

  if (statusParsed?.current) {
    add({
      id: 'caiso.currentDemand',
      label: 'CAISO current demand',
      value: statusParsed.current.value,
      unit: 'MW',
      source: "CAISO Today's Outlook system status",
      sourceUrl: status.url,
      observedAt: statusParsed.current.observedAt,
    })
  } else if (demandParsed?.record) {
    const value = num(demandParsed.record['Current demand'])
    add({
      id: 'caiso.currentDemand',
      label: 'CAISO current demand',
      value,
      unit: 'MW',
      source: "CAISO Today's Outlook demand file",
      sourceUrl: demand.url,
      observedAt: demandParsed.record.Time || '',
      note: 'systemstatus.csv did not parse, so this value is the latest Current demand row in demand.csv.',
    })
  }

  if (statusParsed?.todayPeak) {
    add({
      id: 'caiso.todaysPeak',
      label: "CAISO today's peak demand",
      value: statusParsed.todayPeak.value,
      unit: 'MW',
      source: "CAISO Today's Outlook system status",
      sourceUrl: status.url,
      observedAt: statusParsed.todayPeak.observedAt,
    })
  }
  if (statusParsed?.forecastPeak) {
    add({
      id: 'caiso.forecastedPeak',
      label: 'CAISO forecasted peak demand',
      value: statusParsed.forecastPeak.value,
      unit: 'MW',
      source: "CAISO Today's Outlook system status",
      sourceUrl: status.url,
      observedAt: statusParsed.forecastPeak.observedAt,
    })
  }
  if (statusParsed?.tomorrowPeak) {
    add({
      id: 'caiso.tomorrowPeak',
      label: 'CAISO tomorrow peak demand',
      value: statusParsed.tomorrowPeak.value,
      unit: 'MW',
      source: "CAISO Today's Outlook system status",
      sourceUrl: status.url,
      observedAt: statusParsed.tomorrowPeak.observedAt,
    })
  }

  if (demandParsed?.record) {
    const record = demandParsed.record
    add({
      id: 'caiso.hourAhead',
      label: 'CAISO hour-ahead demand forecast',
      value: num(record['Hour ahead forecast']),
      unit: 'MW',
      source: "CAISO Today's Outlook demand file",
      sourceUrl: demand.url,
      observedAt: record.Time || '',
    })
    add({
      id: 'caiso.dayAhead',
      label: 'CAISO day-ahead demand forecast',
      value: num(record['Day ahead forecast']),
      unit: 'MW',
      source: "CAISO Today's Outlook demand file",
      sourceUrl: demand.url,
      observedAt: record.Time || '',
    })
  }

  if (net.text) {
    const parsed = parseLatestObject(net.text, ['Net demand', 'Current demand'])
    if (parsed.record) {
      const netValue = num(parsed.record['Net demand'])
      const fallback = num(parsed.record['Current demand'])
      add({
        id: 'caiso.netDemand',
        label: netValue != null ? 'CAISO net demand' : 'CAISO demand from netdemand file',
        value: netValue ?? fallback,
        unit: 'MW',
        source: "CAISO Today's Outlook net demand file",
        sourceUrl: net.url,
        observedAt: parsed.record.Time || '',
        note: netValue == null ? 'Net demand column was empty. Value is the Current demand column in the same file.' : '',
      })
    } else if (parsed.error) {
      errors.push({ sourceUrl: net.url, message: parsed.error })
    }
  }

  const fuelColumns = [
    ['Solar', 'caiso.fuel.solar', 'CAISO solar'],
    ['Wind', 'caiso.fuel.wind', 'CAISO wind'],
    ['Geothermal', 'caiso.fuel.geothermal', 'CAISO geothermal'],
    ['Biomass', 'caiso.fuel.biomass', 'CAISO biomass'],
    ['Biogas', 'caiso.fuel.biogas', 'CAISO biogas'],
    ['Small hydro', 'caiso.fuel.smallHydro', 'CAISO small hydro'],
    ['Large Hydro', 'caiso.fuel.largeHydro', 'CAISO large hydro'],
    ['Nuclear', 'caiso.fuel.nuclear', 'CAISO nuclear'],
    ['Natural Gas', 'caiso.fuel.naturalGas', 'CAISO natural gas'],
    ['Coal', 'caiso.fuel.coal', 'CAISO coal'],
    ['Batteries', 'caiso.fuel.batteries', 'CAISO batteries'],
    ['Imports', 'caiso.fuel.imports', 'CAISO imports'],
    ['Other', 'caiso.fuel.other', 'CAISO other'],
  ]

  if (fuel.text) {
    const parsed = parseLatestObject(
      fuel.text,
      fuelColumns.map(([column]) => column),
    )
    if (parsed.record) {
      for (const [column, id, label] of fuelColumns) {
        add({
          id,
          label,
          value: num(parsed.record[column]),
          unit: 'MW',
          source: "CAISO Today's Outlook fuel source file",
          sourceUrl: fuel.url,
          observedAt: parsed.record.Time || '',
          note: column === 'Batteries' ? 'Negative means charging and positive means discharging, matching the EIS map.' : '',
        })
      }
    } else if (parsed.error) {
      errors.push({ sourceUrl: fuel.url, message: parsed.error })
    }
  }

  if (storage.text) {
    const parsed = parseLatestObject(storage.text, ['Total batteries', 'Stand-alone batteries', 'Hybrid batteries'])
    if (parsed.record) {
      const columns = [
        ['Total batteries', 'caiso.storage.total', 'CAISO total batteries'],
        ['Stand-alone batteries', 'caiso.storage.standalone', 'CAISO stand-alone batteries'],
        ['Hybrid batteries', 'caiso.storage.hybrid', 'CAISO hybrid batteries'],
      ]
      for (const [column, id, label] of columns) {
        add({
          id,
          label,
          value: num(parsed.record[column]),
          unit: 'MW',
          source: "CAISO Today's Outlook storage file",
          sourceUrl: storage.url,
          observedAt: parsed.record.Time || '',
        })
      }
    } else if (parsed.error) {
      errors.push({ sourceUrl: storage.url, message: parsed.error })
    }
  }

  if (weather.text) {
    try {
      const json = JSON.parse(weather.text)
      const current = json.current
      if (!current) {
        errors.push({ sourceUrl: weather.url, message: 'No current weather object' })
      } else {
        const rows = [
          ['open-meteo.temperature', 'Air temperature at 37N, 120W', current.temperature_2m, 'deg C'],
          ['open-meteo.wind', 'Wind speed at 37N, 120W', current.wind_speed_10m, 'km/h'],
          ['open-meteo.solar', 'Shortwave radiation at 37N, 120W', current.shortwave_radiation, 'W/m2'],
        ]
        for (const [id, label, value, unit] of rows) {
          const row = figure({
            id,
            label,
            value: num(String(value)),
            unit,
            source: 'Open-Meteo',
            sourceUrl: 'https://open-meteo.com/',
            observedAt: current.time || '',
            fetchedAt,
            note: 'Central Valley proxy (37N, 120W). License CC BY 4.0. Not a CAISO meter.',
          })
          if (row) {
            row.license = 'https://creativecommons.org/licenses/by/4.0/'
            context.push(row)
          }
        }
      }
    } catch {
      errors.push({ sourceUrl: weather.url, message: 'Weather JSON did not parse' })
    }
  }

  return {
    ok: figures.length > 0 || context.length > 0,
    site: ORIGIN,
    endpoint: `${ORIGIN}/api/key-figures`,
    fetchedAt,
    truthClass: 'LIVE',
    note: NOTE,
    figures,
    context,
    errors,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', KEY_FIGURES_CACHE_CONTROL)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const body = await buildKeyFigures()
  res.status(body.ok ? 200 : 502).json(body)
}
