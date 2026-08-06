/**
 * Site view counter API (once-per-session hit from the client).
 * Uses Abacus public counter; swap for Vercel KV when available.
 *
 * GET /api/views        -> read
 * GET /api/views?hit=1  -> increment + read
 */

const NAMESPACE = 'eis.davidtphung.com'
const KEY = 'views'
const ABACUS = 'https://abacus.jasoncameron.dev'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const hit =
    req.query?.hit === '1' ||
    req.query?.hit === 'true' ||
    (typeof req.url === 'string' && req.url.includes('hit=1'))

  try {
    const path = hit ? `/hit/${NAMESPACE}/${KEY}` : `/get/${NAMESPACE}/${KEY}`
    const r = await fetch(`${ABACUS}${path}`, {
      headers: { Accept: 'application/json' },
    })
    if (!r.ok) {
      res.status(502).json({ error: 'Counter upstream failed', status: r.status })
      return
    }
    const data = await r.json()
    const counted = Number(data.value ?? data.count ?? 0) || 0
    // baseline reserved for historical estimate (Starlink Atlas shape)
    const baseline = 0
    res.status(200).json({
      views: counted + baseline,
      counted,
      baseline,
      hit: Boolean(hit),
    })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Counter error',
    })
  }
}
