import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-vente.png', 'logo.png', 'og-image.jpg'],
      manifest: {
        name: 'Vente.club - Achat et Vente d\'Entreprises au Québec',
        short_name: 'Vente.club',
        description: 'La plateforme québécoise de référence pour l\'achat et la vente d\'entreprises',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon-vente.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon-vente.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/xmwsrvaricrfxovimffm\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 heures
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // UI Components - Split par type
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // TanStack Query
          if (id.includes('@tanstack')) {
            return 'tanstack';
          }
          // Mapbox
          if (id.includes('mapbox')) {
            return 'mapbox';
          }
          // Tiptap Editor
          if (id.includes('@tiptap')) {
            return 'tiptap';
          }
          // Chart libraries
          if (id.includes('recharts')) {
            return 'charts';
          }
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'forms';
          }
          // Date libraries
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          // Animations
          if (id.includes('framer-motion')) {
            return 'animations';
          }
          // Utilities
          if (id.includes('node_modules/') && 
              !id.includes('node_modules/.vite')) {
            return 'vendor';
          }
        },
        // Noms de fichiers optimisés
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  publicDir: 'public',
  assetsInclude: ['**/*.xml', '**/*.txt'],
}));
