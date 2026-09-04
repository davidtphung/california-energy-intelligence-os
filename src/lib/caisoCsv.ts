/** Shared CAISO CSV sanity checks. Fail loud before a hollow snapshot is published. */

export function caisoCsvLooksParseable(file: string, text: string): string | null {
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
