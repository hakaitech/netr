import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [solidPlugin(), tailwindcss()],

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },

  build: {
    target: "esnext",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("@deck.gl/core") ||
            id.includes("@deck.gl/layers") ||
            id.includes("@deck.gl/extensions") ||
            id.includes("@deck.gl/mapbox")
          ) {
            return "deckgl";
          }
          if (id.includes("maplibre-gl")) {
            return "maplibre";
          }
          if (id.includes("gridstack")) {
            return "gridstack";
          }
        },
      },
    },
  },
});
