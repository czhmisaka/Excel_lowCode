/*
 * @Date: 2025-09-28 01:00:38
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-28 15:31:04
 * @FilePath: /lowCode_excel/fe/vite.config.ts
 */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/backend': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, '')
      }
    }
  }
})
