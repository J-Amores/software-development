import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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
      <App />
    </StrictMode>,
  );
}

void start();
