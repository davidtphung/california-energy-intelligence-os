import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
