import { postgresAdapterFromEnv } from '../src/storage/postgres.ts'
import { runBackfillChunk } from '../src/history/jobs.ts'

async function main() {
  const storage = await postgresAdapterFromEnv()
  const pages = Number(process.env.EIA_BACKFILL_PAGES ?? '20')
  const result = await runBackfillChunk({
    storage,
    apiKey: process.env.EIA_API_KEY,
    pages: Number.isFinite(pages) ? pages : 20,
    sleepMs: 1100,
  })
  console.log(JSON.stringify(result))
  if (result.status === 'error') process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
