/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    exclude: ['tests/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'tests/', 'dist/'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'echarts': ['echarts', 'vue-echarts'],
          'naive-ui': ['naive-ui'],
          'vue-vendor': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['echarts', 'vue-echarts'],
  },
})
