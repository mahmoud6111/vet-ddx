import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: './',
    server: {
      port: 3000,
      proxy: {
        // Proxy API requests to a local dev server for testing
        // In production (Vercel), this is handled by Vercel's API routes
      }
    },
    define: {
      // Make env variables available to the client if needed
      // Note: API keys should NEVER be exposed to client
    }
  }
})
