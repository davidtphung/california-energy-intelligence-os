/** Minimal CSV parser for CAISO outlook files (no quoted multiline) */

export function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => line.split(',').map((c) => c.trim()))
}

export function csvToObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text)
  if (rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? ''
    })
    return obj
  })
}

export function num(v: string | undefined | null): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Last row where at least one of the keys is a finite number */
export function latestWithValues(
  rows: Record<string, string>[],
  keys: string[]
): Record<string, string> | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i]
    if (keys.some((k) => num(r[k]) != null)) return r
  }
  return null
}
