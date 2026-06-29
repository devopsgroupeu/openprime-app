// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { validateEnvironmentVariables } from "./utils/envValidator";
import { isMockMode } from "./utils/mockMode";

async function bootstrap() {
  // Mock mode: start the MSW worker so all backend calls are served by fixtures
  // (FE-only dev / preview / screenshots — no real backend, DB, or Keycloak).
  if (isMockMode()) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  } else if ("serviceWorker" in navigator) {
    // Defensively drop a stale MSW worker left over from a previous dev:mock
    // session, so real mode is never silently intercepted by mock fixtures.
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL.includes("mockServiceWorker"))
        .map((r) => r.unregister()),
    );
  }

  validateEnvironmentVariables();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
