import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Avoid restart loops caused by duplicate Windows filesystem events.
      // Environment changes are picked up on the next manual server restart.
      ignored: ['**/.env.local'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
