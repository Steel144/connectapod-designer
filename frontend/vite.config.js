import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    proxy: {
      '/api': {
        target: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});
