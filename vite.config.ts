import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: ['hzntwvsnjutr.sealoshzh.site'],
    proxy: {
      '/api': {
        target: 'http://buddyverse.ns-kuoqmx4b.svc.cluster.local:3000',
        changeOrigin: true
      }
    }
  }
})
