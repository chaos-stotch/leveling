import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// Configuração HTTPS apenas para desenvolvimento local
const getHttpsConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return false; // Não usar HTTPS em produção (Vercel/outros hosts já fornecem)
  }
  
  const keyPath = path.resolve(__dirname, 'certs/key.pem');
  const certPath = path.resolve(__dirname, 'certs/cert.pem');
  
  // Verificar se os certificados existem
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
  
  return false; // Se não existirem, não usar HTTPS
};

export default defineConfig({
  server: {
    https: getHttpsConfig(),
    port: 5173,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Leveling - Suba de Nível na Vida Real',
        short_name: 'Leveling',
        description: 'Aplicativo para gerenciar tarefas e subir de nível na vida real',
        theme_color: '#00D4FF',
        background_color: '#0a0e27',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})

