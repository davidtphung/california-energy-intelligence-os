import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  analystHandler,
  backfillHandler,
  captureHandler,
  forecastHandler,
  timelineHandler,
} from './http.ts'

type Handler = (req: IncomingMessage, res: Wrapped) => Promise<void>

interface Wrapped {
  status: (code: number) => Wrapped
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
  end: () => void
  method?: string
  url?: string
  headers?: IncomingMessage['headers']
}

function wrap(res: ServerResponse): Wrapped {
  const wrapped: Wrapped = {
    status(code) {
      res.statusCode = code
      return wrapped
    },
    setHeader(name, value) {
      res.setHeader(name, value)
    },
    json(body) {
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(body))
    },
    end() {
      res.end()
    },
  }
  return wrapped
}

const routes: { test: (url: string) => boolean; handler: Handler }[] = [
  { test: (url) => url.startsWith('/api/history/timeline'), handler: timelineHandler },
  { test: (url) => url.startsWith('/api/history/backfill'), handler: backfillHandler },
  { test: (url) => url.startsWith('/api/cron/capture'), handler: captureHandler },
  { test: (url) => url.startsWith('/api/cron/forecast'), handler: forecastHandler },
  { test: (url) => url.startsWith('/api/cron/analyst'), handler: analystHandler },
]

export function historyDevMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const url = req.url ?? ''
  const route = routes.find((item) => item.test(url))
  if (!route) {
    next()
    return
  }
  const wrapped = wrap(res)
  wrapped.method = req.method
  wrapped.url = url
  wrapped.headers = req.headers
  void route.handler(req, wrapped).catch((err) => {
    console.error(err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'history api failed' }))
    }
  })
}
