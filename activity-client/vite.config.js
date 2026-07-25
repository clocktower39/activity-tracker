import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Nothing here hard-codes a host or a path.
 *
 * VITE_BASE_PATH  where the app is served from. "/" for a subdomain, which is
 *                 the default; "/activity-tracker/" for the old sub-path
 *                 deployment. It drives the asset base, the router basename
 *                 (via import.meta.env.BASE_URL) and the PWA scope together, so
 *                 they cannot drift apart.
 * VITE_API_URL    only needed when the API is on a DIFFERENT origin. Left unset,
 *                 the client calls /api on its own origin, which is what the
 *                 nginx setup does and means no CORS anywhere.
 * VITE_DEV_API    where `vite dev` proxies /api to. Defaults to localhost:8000,
 *                 so development is same-origin exactly like production.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const base = env.VITE_BASE_PATH || "/";
  const devApi = env.VITE_DEV_API || "http://localhost:8000";

  return {
    base,

    server: {
      /**
       * Dual-stack. On a machine whose /etc/hosts maps `localhost` to ::1 —
       * which is the default on most Linux distributions — binding 127.0.0.1
       * or 0.0.0.0 leaves nothing listening on IPv6, so Firefox resolves
       * localhost to ::1 and cannot open the HMR WebSocket. "::" accepts both
       * families, so localhost, 127.0.0.1 and the LAN address all work, which
       * also makes the dev server reachable from a phone for a PWA that is
       * mostly used on one.
       */
      host: "::",

      // Same-origin in development too, so the browser never makes a
      // cross-origin request and CORS is not part of the local setup either.
      proxy: {
        "/api": { target: devApi, changeOrigin: true },
      },
    },

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
          id: base,
          start_url: base,
          scope: base,
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
  };
});
