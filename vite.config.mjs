import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  envPrefix: ["REACT_APP_", "VITE_"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    css: true,
    // Run tests in mock mode (MSW + mock auth, no real backend/Keycloak)
    env: { VITE_MOCK: "true" },
    exclude: ["node_modules", "dist", ".git", ".cache", "e2e"],
  },
});
