import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // proxies /api and /auth to backend at localhost:4000
      '/api': { target: 'http://localhost:4000', changeOrigin: true, secure: false },
      '/auth': { target: 'http://localhost:4000', changeOrigin: true, secure: false }
    }
  }
})
