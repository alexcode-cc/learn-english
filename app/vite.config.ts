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
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png', 'logo.svg'],
      manifest: {
        name: 'Learn English - 背單字軟體',
        short_name: 'Learn English',
        description: '現代化的英文單字學習應用程式，支援 CSV 匯入、自動補足單字資訊、複習測驗與進度追蹤',
        theme_color: '#1976D2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'zh-TW',
        dir: 'ltr',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: 'icons/icon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-48x48.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-1024x1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: '開始學習',
            short_name: '學習',
            description: '開啟學習頁面瀏覽單字卡片',
            url: '/study',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: '匯入單字',
            short_name: '匯入',
            description: '從 CSV 檔案匯入單字',
            url: '/import',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: '複習測驗',
            short_name: '複習',
            description: '進行單字複習與測驗',
            url: '/review',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        // 預緩存所有靜態資源
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // 跳過預緩存大型文件（由 runtime caching 處理）
        globIgnores: ['**/node_modules/**/*', '**/test-results/**/*', '**/playwright-report/**/*'],
        // 清理舊緩存
        cleanupOutdatedCaches: true,
        // 離線回退
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/_/],
        // 運行時緩存策略
        runtimeCaching: [
          {
            // 字典 API：網路優先，失敗時使用緩存
            urlPattern: /^https:\/\/api\.dictionaryapi\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dictionary-api-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5 // 5秒超時後使用緩存
            }
          },
          {
            // 音頻文件：緩存優先，提升播放體驗
            urlPattern: /^https:\/\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // 圖片資源：緩存優先
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // 字體文件：緩存優先
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
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
  build: {
    // 代碼分割優化
    rollupOptions: {
      output: {
        // 手動配置 chunk 分割策略
        manualChunks: (id) => {
          // node_modules 中的依賴單獨打包
          if (id.includes('node_modules')) {
            // Vue 相關
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vue-vendor'
            }
            // Vuetify 相關
            if (id.includes('vuetify')) {
              return 'vuetify-vendor'
            }
            // 其他大型依賴
            if (id.includes('pinia') || id.includes('vue-router')) {
              return 'router-vendor'
            }
            // 其他第三方庫
            return 'vendor'
          }
          // 大型組件單獨打包
          if (id.includes('/components/progress/')) {
            return 'progress-components'
          }
          if (id.includes('/components/review/')) {
            return 'review-components'
          }
        },
        // 優化 chunk 文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
            return 'assets/media/[name]-[hash].[ext]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name || '')) {
            return 'assets/img/[name]-[hash].[ext]'
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    // 壓縮配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生產環境移除 console
        drop_debugger: true
      }
    },
    // 構建大小警告閾值
    chunkSizeWarningLimit: 1000,
    // 啟用源映射（僅開發環境）
    sourcemap: false,
    // CSS 代碼分割
    cssCodeSplit: true
  },
  server: {
    host: process.env.VITE_HOST || process.env.VITE_DOMAIN || 'localhost',
    port: parseInt(process.env.VITE_PORT || '5173', 10),
    // Use HTTPS only if SSL is enabled, not in E2E test mode, and SSL certs exist
    ...(process.env.VITE_SSL_ENABLED === 'true' &&
      process.env.VITE_E2E_TEST !== 'true' &&
      (() => {
        const domain = process.env.VITE_DOMAIN || process.env.VITE_HOST || 'localhost'
        try {
          return {
            https: {
              key: readFileSync(resolve(__dirname, `ssl/${domain}/private.key`)),
              cert: readFileSync(resolve(__dirname, `ssl/${domain}/certificate.crt`))
              // If you need to include CA bundle, uncomment the line below:
              // ca: readFileSync(resolve(__dirname, `ssl/${domain}/ca_bundle.crt`))
            }
          }
        } catch {
          // SSL certs not found, use HTTP
          return {}
        }
      })())
    }
})