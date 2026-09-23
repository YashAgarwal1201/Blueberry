import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  const hasCerts = fs.existsSync('./certs/localhost.pem') && fs.existsSync('./certs/localhost-key.pem')

  return {
    server: {
      port: 5130,
      ...(isDev &&
        hasCerts && {
          https: {
            key: fs.readFileSync('./certs/localhost-key.pem'),
            cert: fs.readFileSync('./certs/localhost.pem'),
          },
        }),
    },
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo.svg'],
        manifest: {
          short_name: 'Blueberry',
          name: 'Blueberry Dashboard',
          icons: [
            {
              src: './logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
          ],
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: '#fafafa',
          background_color: '#0f172b',
          prefer_related_applications: true,
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
