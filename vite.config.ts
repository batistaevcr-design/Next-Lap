import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Next Lap',
        short_name: 'Next Lap',
        description: 'Guardar, decidir e viver experiências juntos.',
        theme_color: '#061F44',
        background_color: '#F7F5FC',
        display: 'standalone'
      },
      workbox: { navigateFallback: 'index.html' }
    })
  ],
    base: '/Next-Lap/'
})
