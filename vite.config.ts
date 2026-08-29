import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/campaign-guide/',
  
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
      ],

      manifest: {
        name: 'Campaign Guide',
        short_name: 'Campaign Guide',

        description:
          'A campaign companion for sessions, notes, goals, people, discoveries, and journals.',

        theme_color: '#24140d',
        background_color: '#17130f',

        display: 'standalone',

        start_url: '/campaign-guide/',
        scope: '/campaign-guide/',

        icons: [
          {
            src: '/campaign-guide/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/campaign-guide/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/campaign-guide/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,ttf}',
        ],

        maximumFileSizeToCacheInBytes:
          5 * 1024 * 1024,
      },
    }),
  ],
})