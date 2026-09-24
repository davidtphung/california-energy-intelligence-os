import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. Refusing to migrate.')
    process.exit(1)
  }
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  const client = await pool.connect()
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    )
    const files = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()
    for (const file of files) {
      const seen = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file])
      if (seen.rowCount) {
        console.log(`skip ${file}`)
        continue
      }
      const sql = readFileSync(join(dir, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [file])
        await client.query('COMMIT')
        console.log(`applied ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
