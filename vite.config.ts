import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build as esbuildBuild } from 'esbuild'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const root = fileURLToPath(new URL('.', import.meta.url))

interface SeoModule {
  injectIndexHtml(html: string): string
  applyPage(html: string, page: { path: string }): string
  allPages(): { path: string }[]
  staticFile(pathname: string): { type: string; body: string } | null
  redirectPath(pathname: string): string | null
  assertPublishedCopy(): void
}

async function loadSeo(): Promise<SeoModule> {
  const outfile = join(tmpdir(), `eis-seo-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`)
  await esbuildBuild({
    absWorkingDir: root,
    entryPoints: ['src/seo/renderHtml.ts'],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
  })
  return import(pathToFileURL(outfile).href) as Promise<SeoModule>
}

type LoadSeo = () => Promise<SeoModule>

function builtPage(pathname: string): string | null {
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (!bare.startsWith('/') || bare.includes('..')) return null
  const rel = bare === '/' ? 'index.html' : `${bare.slice(1)}/index.html`
  const file = join(root, 'dist', rel)
  if (!existsSync(file)) return null
  return readFileSync(file, 'utf8')
}

function crawlMiddleware(load: LoadSeo, serveBuiltPages: boolean) {
  return async (
    req: { url?: string },
    res: {
      statusCode: number
      setHeader(name: string, value: string): void
      end(body?: string): void
    },
    next: (error?: unknown) => void,
  ) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost')
      const path = url.pathname
      if (path === '/api/key-figures') {
        const mod = await import('./api/key-figures.js')
        const body = await mod.buildKeyFigures()
        res.statusCode = body.ok ? 200 : 502
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.setHeader('cache-control', 'no-store')
        res.setHeader('access-control-allow-origin', '*')
        res.end(JSON.stringify(body))
        return
      }
      const seo = await load()
      const file = seo.staticFile(path)
      if (file) {
        res.setHeader('content-type', file.type)
        res.end(file.body)
        return
      }
      const dest = seo.redirectPath(path)
      if (dest) {
        res.statusCode = 308
        res.setHeader('location', dest + url.search)
        res.end()
        return
      }
      if (serveBuiltPages) {
        const html = builtPage(path)
        if (html) {
          res.statusCode = 200
          res.setHeader('content-type', 'text/html; charset=utf-8')
          res.end(html)
          return
        }
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

function crawlPlugin(): Plugin {
  let seoPromise: Promise<SeoModule> | null = null
  const load = () => {
    if (!seoPromise) seoPromise = loadSeo()
    return seoPromise
  }
  return {
    name: 'eis-crawl',
    async transformIndexHtml(html) {
      const seo = await load()
      return seo.injectIndexHtml(html)
    },
    configureServer(server) {
      server.middlewares.use(crawlMiddleware(load, false))
    },
    configurePreviewServer(server) {
      server.middlewares.use(crawlMiddleware(load, true))
    },
    handleHotUpdate(ctx) {
      if (ctx.file.includes(join('src', 'seo'))) seoPromise = null
    },
    async closeBundle() {
      const seo = await load()
      seo.assertPublishedCopy()
      const dist = join(root, 'dist')
      const html = readFileSync(join(dist, 'index.html'), 'utf8')
      const seeded = html.includes('location.replace') ? html : seo.injectIndexHtml(html)
      for (const page of seo.allPages()) {
        const file =
          page.path === '/' ? join(dist, 'index.html') : join(dist, page.path.slice(1), 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, seo.applyPage(seeded, page))
      }
      for (const pathname of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']) {
        const file = seo.staticFile(pathname)
        if (!file) continue
        writeFileSync(join(dist, pathname.slice(1)), file.body)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), crawlPlugin()],
  server: {
    proxy: {
      '/api/live/caiso': {
        target: 'https://www.caiso.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/live\/caiso/, '/outlook/current'),
        secure: true,
      },
    },
  },
})
