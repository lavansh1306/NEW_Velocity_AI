import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // --- ADD THESE SECTIONS TO FIX PDF LOADING ---
  build: {
    target: "esnext", // Allows top-level await used by PDF.js
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext", // Ensures dependencies are bundled correctly
    },
  },
}));