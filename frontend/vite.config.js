// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load all env vars for this mode from .env, .env.local, .env.development, etc.
  const env = loadEnv(mode, process.cwd(), '') // no third arg = keep all keys

  const host = env.VITE_HOST || '0.0.0.0'
  const port = Number(env.VITE_PORT || 8800)

  return {
    plugins: [react()],
    server: {
      host,           // e.g. '127.0.0.1' or '0.0.0.0'
      port,           // e.g. 8800
      strictPort: true, // fail if 8800 is taken (don’t auto-bump to 8801)
      // Optional: if LAN HMR has issues, uncomment the next line:
      // hmr: { host, port }
    },
    // ❌ Don't define process.env = process.env
    // Use import.meta.env.VITE_* in your app code
  }
})
