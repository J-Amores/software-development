import { apiClient as defaultApiClient } from "../api/index.js";

/**
 * Dashboard View
 * Primary administrative overview view adhering to the mount / unmount lifecycle seam.
 * Renders the Phase 1 vertical tracer bullet showing live API and database telemetry.
 */
export class DashboardView {
  /**
   * @param {Object} [options={}]
   * @param {{ getHealth(): Promise<any> }} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;
    this.container = null;
    this.element = null;
    this.isMounted = false;
    this.fetchPromise = null;
  }

  /**
   * Mounts the dashboard view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view dashboard-scene";
    this.element.setAttribute("aria-labelledby", "dashboard-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">Overview</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">Dashboard</span>
        </nav>
        <h1 id="dashboard-title" class="scene-title">Administrative Dashboard</h1>
        <p class="scene-subtitle">Operational status, telemetry, and management overview</p>
      </header>

      <div class="scene-body">
        <div id="health-telemetry-container" class="dashboard-card health-card">
          <div class="card-header">
            <h2 class="card-title">System & Database Telemetry</h2>
            <span class="tracer-badge">Tracer Bullet Probe</span>
          </div>
          <div id="health-status-content" class="health-content">
            <div class="health-status-loading" role="status">
              <span class="spinner" aria-hidden="true">⏳</span> Initializing tracer-bullet probe...
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    this.loadHealthTelemetry();
  }

  /**
   * Queries the API client and renders live indicators or error fallback.
   */
  loadHealthTelemetry() {
    const contentEl = this.element?.querySelector("#health-status-content");
    if (!contentEl) {
      return;
    }

    contentEl.innerHTML = `
      <div class="health-status-loading" role="status">
        <span class="spinner" aria-hidden="true">⏳</span> Initializing tracer-bullet probe...
      </div>
    `;

    this.fetchPromise = (async () => {
      try {
        const data = await this.apiClient.getHealth();

        if (!this.isMounted || !this.element) {
          return;
        }

        if (data.status === "ok" && data.database?.status !== "disconnected") {
          const latencyText =
            data.database?.latencyMs != null ? `${data.database.latencyMs}ms` : "N/A";
          const dbStatus = data.database?.status || "connected";
          const env = data.environment || "development";
          const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "--";

          contentEl.innerHTML = `
            <div class="telemetry-grid">
              <div class="telemetry-metric-box">
                <span class="metric-label">API Health</span>
                <div class="indicator-badge status-ok" data-testid="api-status">
                  <span class="badge-dot" aria-hidden="true">●</span> Operational
                </div>
              </div>

              <div class="telemetry-metric-box">
                <span class="metric-label">Database Latency</span>
                <div class="metric-value-row">
                  <span class="indicator-value highlight" data-testid="db-latency">${latencyText}</span>
                  <span class="metric-status-tag" data-testid="db-status">${dbStatus}</span>
                </div>
              </div>

              <div class="telemetry-metric-box">
                <span class="metric-label">Environment Mode</span>
                <span class="indicator-value uppercase" data-testid="env-mode">${env}</span>
              </div>

              <div class="telemetry-metric-box">
                <span class="metric-label">Last Probe Check</span>
                <span class="indicator-value timestamp" data-testid="telemetry-timestamp">${timestamp}</span>
              </div>
            </div>
          `;
        } else {
          // Degraded / disconnected state
          const errorMsg = data.database?.error || "Database ping failed";
          const env = data.environment || "unknown";

          contentEl.innerHTML = `
            <div class="health-status-degraded" role="alert" data-testid="health-degraded">
              <div class="alert-icon" aria-hidden="true">⚠️</div>
              <div class="alert-body">
                <h3 class="alert-heading">Service Degraded</h3>
                <p class="alert-text">Database connectivity issue detected in <strong>${env}</strong> environment.</p>
                <p class="alert-detail">${errorMsg}</p>
                <button type="button" class="btn-retry" id="retry-health-btn">Retry Probe</button>
              </div>
            </div>
          `;

          const retryBtn = contentEl.querySelector("#retry-health-btn");
          retryBtn?.addEventListener("click", () => this.loadHealthTelemetry());
        }
      } catch (error) {
        if (!this.isMounted || !this.element) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);

        contentEl.innerHTML = `
          <div class="health-status-error" role="alert" data-testid="health-error">
            <div class="alert-icon" aria-hidden="true">⚠️</div>
            <div class="alert-body">
              <h3 class="alert-heading">System Unreachable</h3>
              <p class="alert-text">Unable to establish connection to the backend API service.</p>
              <pre class="error-trace">${message}</pre>
              <button type="button" class="btn-retry" id="retry-health-btn">Retry Connection</button>
            </div>
          </div>
        `;

        const retryBtn = contentEl.querySelector("#retry-health-btn");
        retryBtn?.addEventListener("click", () => this.loadHealthTelemetry());
      }
    })();
  }

  /**
   * Cleans up view resources on unmount.
   */
  unmount() {
    this.isMounted = false;
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.container = null;
    this.element = null;
  }
}
