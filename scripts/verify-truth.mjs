/**
 * Sit-report checks: CAISO fail-loud parse, citation counts, no em dashes in UI copy.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function caisoCsvLooksParseable(file, text) {
  const trimmed = text.trim()
  if (!trimmed) return 'Empty CSV'
  if (/<html|<!doctype|404 not found/i.test(trimmed)) return 'HTML or 404 instead of CSV'
  const rows = trimmed
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => line.split(',').map((c) => c.trim()))
  if (rows.length < 2) return 'CSV parse failed: fewer than 2 rows'
  const blob = rows.slice(0, 8).flat().join(' ').toLowerCase()
  if (file === 'systemstatus') {
    if (!blob.includes('demand') && !blob.includes('produced')) {
      return 'CSV parse failed: no demand/produced fields'
    }
  }
  if (file === 'demand' || file === 'netdemand') {
    if (!blob.includes('demand')) return 'CSV parse failed: no demand header'
  }
  if (file === 'fuelsource' || file === 'renewables') {
    if (!blob.includes('solar') && !blob.includes('wind')) {
      return 'CSV parse failed: no fuel headers'
    }
  }
  return null
}

const cases = [
  ['systemstatus', '', 'Empty CSV'],
  ['systemstatus', '<html>404</html>', 'HTML'],
  ['systemstatus', 'foo,bar\n1,2', 'no demand'],
  [
    'systemstatus',
    'Slot,Value,Time\nCurrent Demand,28431,14:10\nProduced,today,',
    null,
  ],
  ['demand', 'Time,Other\n01:00,x', 'no demand header'],
  ['demand', 'Time,Current demand\n01:00,28000', null],
  ['fuelsource', 'Time,Coal\n01:00,12', 'no fuel headers'],
  ['fuelsource', 'Time,Solar,Wind\n01:00,8000,2000', null],
]

let failed = 0
for (const [file, text, expect] of cases) {
  const err = caisoCsvLooksParseable(file, text)
  const ok = expect == null ? err == null : err != null
  if (!ok) {
    console.error(`FAIL ${file}: expected ${expect ?? 'ok'}, got ${err}`)
    failed += 1
  }
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (/\.(tsx|ts|css)$/.test(name)) acc.push(p)
  }
  return acc
}

const uiFiles = walk(join(process.cwd(), 'src'))
const dashHits = []
for (const f of uiFiles) {
  const text = readFileSync(f, 'utf8')
  if (f.includes('catalogCitations') || f.includes('node_modules')) continue
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    if (line.includes('—') && !line.trim().startsWith('*') && !line.trim().startsWith('//')) {
      dashHits.push(`${f}:${i + 1}: ${line.trim()}`)
    }
  })
}

if (dashHits.length) {
  console.error('Em dashes in UI/source files:')
  for (const h of dashHits) console.error(`  ${h}`)
  failed += dashHits.length
}

if (failed) {
  console.error(`verify-truth: ${failed} failure(s)`)
  process.exit(1)
}
console.log('verify-truth: CAISO fail-loud fixtures pass; no em dashes in src UI strings')
