import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { App } from "./App";
import { config } from "./config";
import "./styles.css";

async function start() {
  if (config.demoMode) {
    // The demo runs against the mock generated from the contract, in the browser,
    // with no backend behind it (ADR 0005).
    const { startMockApi } = await import("./mocks/browser");
    await startMockApi();
  }
  const root = document.getElementById("root");
  if (!root) throw new Error("index.html has no #root to mount into");
  createRoot(root).render(
    <StrictMode>
      {/* The address is kept in the fragment. The public demo is a static build on
          a host that serves one file and knows nothing of the app's paths (ADR
          0005), so a path-shaped address would 404 on reload or on a shared link. */}
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  );
}

void start();
