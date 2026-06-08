import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// ==========================================================================
// Install demo mode interceptor synchronously on ALL Axios instances
// BEFORE React renders. This ensures the first API calls (auth check,
// server list, etc.) are intercepted rather than hitting the real backend.
// ==========================================================================
import { installDemoInterceptor } from "./demo/demo-interceptor";
import { api } from "./services/api-core";
import { apiClient } from "./api/apiClient";
installDemoInterceptor(api);
installDemoInterceptor(apiClient);
// ==========================================================================

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
