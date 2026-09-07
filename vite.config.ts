import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'
  const port = Number(env.VITE_API_PORT) || 3000

  return {
  plugins: [react(), tailwindcss()],
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: ['mkwxlsnrowlw.sealosbja.site','jplnacmzyuno.sealosbja.site','www.buddyverse.cn'],
    proxy: {
      '/api': {
        target: proxyTarget,
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
  }
})
