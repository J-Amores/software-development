// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DashboardView } from "../src/views/dashboard-view.js";
import { createFakeApiClient } from "../src/api/index.js";

describe("DashboardView (Vertical Tracer Bullet Seam)", () => {
  let container;
  let view;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-view-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      view.unmount();
      view = null;
    }
    container.remove();
  });

  it("renders loading state initially while fetching health telemetry", () => {
    const fakeClient = createFakeApiClient({
      delayMs: 100, // delay to observe loading state
    });

    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    const loadingEl = container.querySelector(".health-status-loading");
    expect(loadingEl).not.toBeNull();
    expect(loadingEl.textContent).toContain("tracer-bullet probe");
  });

  it("renders live operational indicators on successful health check", async () => {
    const fakeClient = createFakeApiClient({
      healthResponse: {
        status: "ok",
        environment: "production",
        timestamp: "2026-10-16T12:00:00.000Z",
        database: {
          status: "connected",
          latencyMs: 7,
        },
      },
    });

    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    // Wait for the async health telemetry query to resolve
    await view.fetchPromise;

    const apiStatusEl = container.querySelector('[data-testid="api-status"]');
    expect(apiStatusEl).not.toBeNull();
    expect(apiStatusEl.textContent).toContain("Operational");

    const dbLatencyEl = container.querySelector('[data-testid="db-latency"]');
    expect(dbLatencyEl).not.toBeNull();
    expect(dbLatencyEl.textContent).toContain("7ms");

    const envModeEl = container.querySelector('[data-testid="env-mode"]');
    expect(envModeEl).not.toBeNull();
    expect(envModeEl.textContent).toContain("production");
  });

  it("renders accessible error fallback state when API is unreachable", async () => {
    const fakeClient = createFakeApiClient({
      shouldThrow: true,
      errorMessage: "Failed to connect to backend: Connection refused",
    });

    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const errorEl = container.querySelector('[data-testid="health-error"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.getAttribute("role")).toBe("alert");
    expect(errorEl.textContent).toContain("System Unreachable");
    expect(errorEl.textContent).toContain("Failed to connect to backend: Connection refused");

    const retryBtn = container.querySelector("#retry-health-btn");
    expect(retryBtn).not.toBeNull();
  });

  it("renders degraded state when database ping indicates disconnected", async () => {
    const fakeClient = createFakeApiClient({
      healthResponse: {
        status: "degraded",
        environment: "staging",
        timestamp: "2026-10-16T12:00:00.000Z",
        database: {
          status: "disconnected",
          error: "MongoDB ping timeout after 5000ms",
        },
      },
    });

    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const degradedEl = container.querySelector('[data-testid="health-degraded"]');
    expect(degradedEl).not.toBeNull();
    expect(degradedEl.getAttribute("role")).toBe("alert");
    expect(degradedEl.textContent).toContain("Degraded");
    expect(degradedEl.textContent).toContain("MongoDB ping timeout after 5000ms");
  });

  it("retries health check when retry button is clicked", async () => {
    let callCount = 0;
    const clientWithRetry = {
      async getHealth() {
        callCount++;
        if (callCount === 1) {
          throw new Error("Temporary network glitch");
        }
        return {
          status: "ok",
          environment: "development",
          timestamp: new Date().toISOString(),
          database: {
            status: "connected",
            latencyMs: 3,
          },
        };
      },
    };

    view = new DashboardView({ apiClient: clientWithRetry });
    view.mount(container);

    await view.fetchPromise;

    // Verify error state
    expect(container.querySelector('[data-testid="health-error"]')).not.toBeNull();

    // Click retry
    const retryBtn = container.querySelector("#retry-health-btn");
    retryBtn.click();

    await view.fetchPromise;

    // Verify recovered operational state
    expect(container.querySelector('[data-testid="api-status"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="db-latency"]').textContent).toContain("3ms");
    expect(callCount).toBe(2);
  });

  it("cleans up resources and unmounts DOM element cleanly", () => {
    const fakeClient = createFakeApiClient();
    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    expect(container.querySelector(".dashboard-scene")).not.toBeNull();

    view.unmount();
    expect(container.querySelector(".dashboard-scene")).toBeNull();
  });
});
