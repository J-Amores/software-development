/**
 * Base Analytics View Module
 * Shared foundation for dedicated analytics scene views (/bar, /pie, /line, /geography).
 */

import { apiClient as defaultApiClient } from "../api/index.js";
import { ChartComponent } from "../components/chart/index.js";

export class BaseAnalyticsView {
  /**
   * @param {Object} config
   * @param {string} config.title - Scene title
   * @param {string} config.subtitle - Scene subtitle
   * @param {string} config.breadcrumb - Breadcrumb label
   * @param {string} config.dataset - API metrics dataset parameter ('bar'|'pie'|'line'|'geography')
   * @param {'bar'|'pie'|'line'|'geography'} config.type - Chart visualization type
   * @param {Object} [config.apiClient] - Injectable API client adapter
   */
  constructor({ title, subtitle, breadcrumb, dataset, type, apiClient }) {
    this.title = title;
    this.subtitle = subtitle;
    this.breadcrumb = breadcrumb;
    this.dataset = dataset;
    this.type = type;
    this.apiClient = apiClient || defaultApiClient;

    this.container = null;
    this.element = null;
    this.chart = null;
    this.isMounted = false;
    this.isLoading = true;
    this.error = null;
    this.data = null;
  }

  /**
   * Mounts the view into the target DOM container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error(`Target container is required to mount ${this.constructor.name}`);
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = `scene-view analytics-scene ${this.type}-scene`;
    this.element.setAttribute("aria-labelledby", `${this.type}-title`);

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">Charts</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">${this.breadcrumb}</span>
        </nav>
        <h1 id="${this.type}-title" class="scene-title">${this.title}</h1>
        <p class="scene-subtitle">${this.subtitle}</p>
      </header>

      <div class="scene-alert-container"></div>

      <div class="chart-card-container">
        <div class="chart-loading-indicator" role="status">Loading chart telemetry...</div>
      </div>
    `;

    this.container.appendChild(this.element);

    this._fetchData();
  }

  async _fetchData() {
    this.isLoading = true;
    this.error = null;

    const alertContainer = this.element.querySelector(".scene-alert-container");
    const cardContainer = this.element.querySelector(".chart-card-container");
    if (alertContainer) alertContainer.innerHTML = "";

    try {
      const response = await this.apiClient.getMetrics(this.dataset);
      if (!this.isMounted) return;

      this.data = response.data;
      this.isLoading = false;

      if (cardContainer) {
        cardContainer.innerHTML = "";
        this.chart = new ChartComponent({
          type: this.type,
          data: this.data,
          isDashboard: false,
        });
        this.chart.mount(cardContainer);
      }
    } catch (err) {
      if (!this.isMounted) return;
      this.isLoading = false;
      this.error = err.message || "Failed to load visualization data";

      if (alertContainer) {
        alertContainer.innerHTML = `
          <div class="scene-error-alert alert alert-danger" role="alert">
            <span>${this.error}</span>
            <button class="btn btn-secondary retry-btn">Retry</button>
          </div>
        `;
        const retryBtn = alertContainer.querySelector(".retry-btn");
        if (retryBtn) {
          retryBtn.addEventListener("click", () => this._fetchData());
        }
      }

      if (cardContainer) {
        cardContainer.innerHTML = '<div class="chart-placeholder-error">Data unavailable.</div>';
      }
    }
  }

  /**
   * Cleans up the view and chart instance.
   */
  unmount() {
    if (!this.isMounted) return;

    if (this.chart) {
      this.chart.unmount();
      this.chart = null;
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.container = null;
    this.isMounted = false;
  }
}

export default BaseAnalyticsView;
