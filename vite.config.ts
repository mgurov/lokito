import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/lokiprod': {
        target: 'http://localhost:9996/api/datasources/proxy/13/loki',
        rewrite: (path) => path.replace(/^\/lokiprod/, ''),
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}
)
