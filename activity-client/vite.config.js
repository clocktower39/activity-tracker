import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'auto',
      registerType: "autoUpdate",
      manifest: {
        name: "Activity Tracker",
        short_name: "Tracker",
        description: "Track your activities effortlessly!",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/?",
        scope: "/",
        icons: [
          {
            src: "/activity-tracker/assets/favicon_144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/activity-tracker/assets/favicon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  base: "/activity-tracker/",
});
