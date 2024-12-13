import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Activity Tracker",
        short_name: "Tracker",
        description: "Track your activities effortlessly!",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/activity-tracker/",
        start_url: "/activity-tracker/",
        icons: [
          {
            src: "/activity-tracker/assets/favicon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/activity-tracker/assets/favicon.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    }),
  ],
  base: "/activity-tracker/",
})
