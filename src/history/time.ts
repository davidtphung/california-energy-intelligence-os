/** Convert a civil time in an IANA zone to a UTC ISO string. */

export function wallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): string {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const offset1 = zoneOffsetMs(guess, timeZone)
  let utc = new Date(guess.getTime() - offset1)
  const offset2 = zoneOffsetMs(utc, timeZone)
  if (offset2 !== offset1) {
    utc = new Date(guess.getTime() - offset2)
  }
  return utc.toISOString()
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(instant)
  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second)
  )
  return asUtc - instant.getTime()
}

export function parseCaisoStamp(stamp: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
} | null {
  const m = stamp
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (!m) return null
  return {
    month: Number(m[1]),
    day: Number(m[2]),
    year: Number(m[3]),
    hour: m[4] != null ? Number(m[4]) : 0,
    minute: m[5] != null ? Number(m[5]) : 0,
  }
}

export function caisoStampToUtc(stamp: string): string | null {
  const p = parseCaisoStamp(stamp)
  if (!p) return null
  return wallTimeToUtc(p.year, p.month, p.day, p.hour, p.minute, 'America/Los_Angeles')
}

/** EIA hourly period `YYYY-MM-DDTHH` in the balancing authority's local zone. */
export function eiaPeriodToUtc(period: string, timeZone: string): string | null {
  const m = period.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})$/)
  if (!m) return null
  return wallTimeToUtc(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), 0, timeZone)
}

export function addHours(iso: string, hours: number): string {
  return new Date(Date.parse(iso) + hours * 3600_000).toISOString()
}

export function hourKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 13)
}
