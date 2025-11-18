import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['mkwxlsnrowlw.sealosbja.site','jplnacmzyuno.sealosbja.site'],
    proxy: {
      '/api': {
        target: 'http://dz-bg.ns-z580ek8h.svc.cluster.local:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关库分离
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将UI库分离
          'ui-vendor': ['antd', '@heroicons/react'],
          // 将工具库分离
          'utils-vendor': ['axios', 'dayjs']
        }
      }
    },
    // 增加chunk大小警告限制
    chunkSizeWarningLimit: 1000
  }
})
