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
  }

  validateEnvironmentVariables();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
