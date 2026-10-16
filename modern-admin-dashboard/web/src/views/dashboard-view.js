/**
 * Dashboard View
 * Primary administrative overview view adhering to the mount / unmount lifecycle seam.
 */
export class DashboardView {
  constructor(options = {}) {
    this.apiClient = options.apiClient || null;
    this.container = null;
    this.element = null;
  }

  mount(container) {
    this.container = container;
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
          <h2 class="card-title">System & Database Telemetry</h2>
          <div id="health-status" class="health-status-loading">
            <span class="spinner" aria-hidden="true">⏳</span> Initializing tracer-bullet probe...
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);
  }

  unmount() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.container = null;
    this.element = null;
  }
}
