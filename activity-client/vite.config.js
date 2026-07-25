import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      manifest: {
        name: "Activity Tracker",
        short_name: "Activity",
        description: "Record what you actually did, one tap at a time.",
        theme_color: "#0D1117",
        background_color: "#0D1117",
        display: "standalone",
        id: "/activity-tracker/",
        start_url: "/activity-tracker/",
        scope: "/activity-tracker/",
        icons: [
          { src: "favicon_144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "favicon.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router"],
          "mui-vendor": ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
          "state-vendor": ["react-redux", "@reduxjs/toolkit"],
          "date-utils": ["dayjs"],
        },
      },
    },
  },
  base: "/activity-tracker/",
});
