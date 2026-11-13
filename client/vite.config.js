import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  '/api': {
    target: 'http://localhost:5050',
    changeOrigin: true,
  },
  '/api-docs': {
    target: 'http://localhost:5050',
    changeOrigin: true,
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['localhost', '.trycloudflare.com'],
    proxy,
  },
  preview: {
    allowedHosts: ['localhost', '.trycloudflare.com'],
    proxy,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('react-icons')) return 'vendor-icons';
          if (
            id.includes('node_modules/react') ||
            id.includes('react-router') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'vendor-react';
          }
          if (id.includes('axios')) return 'vendor-axios';
          return 'vendor';
        },
      },
    },
  },
})
