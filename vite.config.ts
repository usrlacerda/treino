/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const seedIds = [...readFileSync("src/db/seed.ts", "utf-8").matchAll(/id: "ds-(\d+)"/g)].map((m) => m[1]);

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg", "apple-touch-icon.png", "favicon-32.png"],
      manifest: {
        name: "CG - Corre Gordo",
        short_name: "CG",
        description: "CG - Corre Gordo: registro de treinos de musculação, funciona offline.",
        lang: "pt-BR",
        theme_color: "#14121a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "./",
        scope: "./",
        id: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        globIgnores: ["catalog/**"], // catálogo grande: baixa sob demanda e fica em cache para uso offline
        // os exercícios do protocolo inicial já ficam disponíveis offline desde a instalação
        additionalManifestEntries: seedIds.flatMap((n) => [`catalog/img/${n}.webp`, `catalog/anim/${n}.webp`].map((url) => ({ url, revision: "1" }))),
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.includes("/catalog/img/") || url.pathname.includes("/catalog/anim/"), handler: "CacheFirst", options: { cacheName: "catalog-img", expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 365 } } },
          { urlPattern: ({ url }) => url.pathname.includes("/catalog/info/"), handler: "StaleWhileRevalidate", options: { cacheName: "catalog-info", expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 365 } } },
          { urlPattern: ({ url }) => url.pathname.endsWith("/catalog/index.json"), handler: "NetworkFirst", options: { cacheName: "catalog-index", networkTimeoutSeconds: 4 } },
        ],
      },
    }),
  ],
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/setupTests.ts"] },
});
