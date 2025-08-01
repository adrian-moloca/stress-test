import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tsconfigpaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: process.env.VITE_ENV_DIR || '../',
  plugins: [
    react(),
    tsconfigpaths(),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    sourcemap: 'hidden',
  },
  server: {
    host: true,
    port: 3000,
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: [{ find: 'src', replacement: path.resolve(__dirname, 'src') }],
  },
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
  },
})
