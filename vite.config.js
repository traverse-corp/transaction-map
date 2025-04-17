import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'url'

// ESM 환경에서 __dirname 흉내 내기
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@assets': path.resolve(__dirname, 'src/shared/assets'),
      '@components': path.resolve(__dirname, 'src/shared/components')
    }
  },
  server: {
    port: 3000,
    proxy: {
      // '/ts/dash' 로 시작하는 요청은 158.180.92.62:61001 으로 프록시
      '/ts/dash': {
        target: 'http://localhost:61001',
        changeOrigin: true
      },
      // '/ts/v2/graph' 로 시작하는 요청은 158.180.92.62:51001 으로 프록시
      '/ts/v2/graph': {
        target: 'http://localhost:51001',
        changeOrigin: true
      }
    }
  }
})
