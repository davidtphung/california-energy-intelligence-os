import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { historyDevMiddleware } from './src/history/devApi.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'eis-history-api',
      configureServer(server) {
        server.middlewares.use(historyDevMiddleware)
      },
    },
  ],
  server: {
    proxy: {
      // Dev proxy - avoids browser CORS to CAISO Today's Outlook CSVs
      '/api/live/caiso': {
        target: 'https://www.caiso.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/live\/caiso/, '/outlook/current'),
        secure: true,
      },
    },
  },
})
