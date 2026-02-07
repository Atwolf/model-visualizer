import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/model-visualizer/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://demo.nautobot.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
