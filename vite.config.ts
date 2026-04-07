import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/child_dosage_ver2/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icons/*.png'],
      manifest: {
        name: '小児用量暗記アプリ',
        short_name: '小児用量',
        description: '小児科薬剤用量の暗記をサポートするアプリ',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/child_dosage_ver2/',
        icons: [
          {
            src: '/child_dosage_ver2/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/child_dosage_ver2/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
