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
    // Public source maps hand the full unminified frontend to anyone who opens
    // devtools. Nothing consumes them today - there is no error-reporting
    // backend wired up - so they are pure disclosure. Revisit if one lands.
    sourcemap: false,
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
