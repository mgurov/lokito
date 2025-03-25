import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/lokiprod': {
        target: 'http://localhost:9996/api/datasources/proxy/13/loki',
        rewrite: (path) => path.replace(/^\/lokiprod/, ''),
      },
      '/ollama': {
        target: 'http://localhost:11434/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      }
    }
  },
  preview: {
    port: 5174,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}
)
