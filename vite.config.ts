/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Treino",
        short_name: "Treino",
        description: "Registro de treinos de musculação, offline.",
        lang: "pt-BR",
        theme_color: "#14121a",
        background_color: "#14121a",
        display: "standalone",
        start_url: "./",
        scope: "./",
        id: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,webp}"] },
    }),
  ],
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/setupTests.ts"] },
});
