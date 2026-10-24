import * as esbuild from 'esbuild'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = mkdtempSync(join(tmpdir(), 'eis-seo-'))
const outfile = join(dir, 'render.mjs')
await esbuild.build({
  absWorkingDir: new URL('..', import.meta.url).pathname,
  entryPoints: ['src/seo/renderHtml.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  logLevel: 'silent',
})
const mod = await import(pathToFileURL(outfile).href)
mod.assertPublishedCopy()
const robots = mod.renderRobots()
for (const agent of [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'xAI-SearchBot',
  'GrokBot',
  'xAI-Grok',
]) {
  if (!robots.includes(`User-agent: ${agent}\nAllow: /`)) {
    throw new Error(`missing ${agent}`)
  }
}
if (mod.redirectPath('/usa') !== '/states') throw new Error('usa alias')
if (mod.redirectPath('/assets') !== '/portfolios') throw new Error('assets alias')
if (mod.redirectPath('/fuels') !== '/fossil') throw new Error('fuels alias')
if (mod.redirectPath('/state/CA') !== '/states/ca') throw new Error('state alias')
if (mod.redirectPath('/states/CA') !== '/states/ca') throw new Error('state case')
if (mod.redirectPath('/map/') !== '/map') throw new Error('trailing slash')
if (mod.redirectPath('/timeline') !== null) throw new Error('timeline must stay unpublished')
console.log('seo copy ok')
