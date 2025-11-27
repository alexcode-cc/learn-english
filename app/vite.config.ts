import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Learn English - 背單字軟體',
        short_name: 'Learn English',
        description: '現代化的英文單字學習應用程式',
        theme_color: '#1976D2',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  worker: {
    format: 'es'
  },
  server: {
    host: 'learn.english.org',
    port: 5173,
    // Use HTTPS only if not in E2E test mode and SSL certs exist
    ...(process.env.VITE_E2E_TEST !== 'true' && (() => {
      try {
        return {
          https: {
            key: readFileSync(resolve(__dirname, 'ssl/learn.english.org/private.key')),
            cert: readFileSync(resolve(__dirname, 'ssl/learn.english.org/certificate.crt'))
            // If you need to include CA bundle, uncomment the line below:
            // ca: readFileSync(resolve(__dirname, 'ssl/learn.english.org/ca_bundle.crt'))
          }
        }
      } catch {
        // SSL certs not found, use HTTP
        return {}
      }
    })())
  }