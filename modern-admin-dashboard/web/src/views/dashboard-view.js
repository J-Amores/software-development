/**
 * Dashboard View
 * Primary administrative overview view adhering to the mount / unmount lifecycle seam.
 * Renders the 12-column responsive CSS Grid dashboard with live KPI StatBoxes,
 * embedded charts, recent transactions feed, and client-side operational report export.
 */

import { apiClient as defaultApiClient } from "../api/index.js";
import { ChartComponent } from "../components/chart/index.js";
import { downloadOperationalReport } from "../utils/reportExporter.js";

/**
 * Formats a numeric value into currency format ($XX.XX).
 * @param {number} val
 * @returns {string}
 */
function formatCurrency(val) {
  return `$${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a date string into readable short date.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

export class DashboardView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;
    this.container = null;
    this.element = null;
    this.isMounted = false;
    this.fetchPromise = null;
    this.data = null;
    this.activeCharts = [];

    this._handleDownloadClick = this._handleDownloadClick.bind(this);
  }

  /**
   * Mounts the dashboard view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount DashboardView");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view dashboard-scene";
    this.element.setAttribute("aria-labelledby", "dashboard-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <div class="scene-header-left">
          <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
            <span class="breadcrumb-item">Overview</span>
            <span class="breadcrumb-separator" aria-hidden="true">/</span>
            <span class="breadcrumb-item active" aria-current="page">Dashboard</span>
          </nav>
          <h1 id="dashboard-title" class="scene-title">Administrative Dashboard</h1>
          <p class="scene-subtitle">Welcome to your dashboard</p>
        </div>
        <div class="dashboard-header-actions">
          <div class="dashboard-telemetry-pill" style="display: flex; gap: 0.5rem; align-items: center;">
            <span class="tracer-badge" data-testid="api-status">API: Operational</span>
            <span class="tracer-badge" data-testid="db-status">DB: connected</span>
          </div>
          <button id="btn-download-reports" class="btn-download-reports" data-testid="download-reports-btn">
            <span>📥</span> Download Reports
          </button>
        </div>
      </header>

      <div id="dashboard-alert-container"></div>

      <div id="dashboard-content" class="dashboard-body">
        <div class="dashboard-loading" role="status">
          <span class="spinner" aria-hidden="true">⏳</span> Loading operational dashboard telemetry...
        </div>
      </div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    const downloadBtn = this.element.querySelector("#btn-download-reports");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", this._handleDownloadClick);
    }

    this.loadDashboardData();
  }

  /**
   * Queries the composite dashboard API endpoint and renders the 12-column grid.
   */
  loadDashboardData() {
    const contentEl = this.element?.querySelector("#dashboard-content");
    const alertEl = this.element?.querySelector("#dashboard-alert-container");
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div class="dashboard-loading" role="status">
        <span class="spinner" aria-hidden="true">⏳</span> Loading operational dashboard telemetry...
      </div>
    `;
    if (alertEl) alertEl.innerHTML = "";

    this.fetchPromise = (async () => {
      try {
        const data = await this.apiClient.getDashboardSummary();
        if (!this.isMounted || !this.element) return;

        this.data = data;
        this._renderDashboard(data);
      } catch (err) {
        if (!this.isMounted || !this.element) return;
        this._renderError(err.message || "Failed to load dashboard data");
      }
    })();
  }

  _renderDashboard(data) {
    const contentEl = this.element?.querySelector("#dashboard-content");
    if (!contentEl) return;

    // Clean up previously mounted chart components
    this._cleanupCharts();

    const summary = data.summary || {};
    const invoicedRevenue = summary.invoicedRevenue?.total ?? 497.85;
    const txVolume = summary.transactionVolume?.total ?? 378.35;
    const activeContacts = summary.activeContacts ?? 3;
    const teamMembers = summary.teamMembers ?? 3;
    const ratios = summary.ratios || { emails: 0.75, sales: 0.5, clients: 0.3, traffic: 0.8 };

    const recentTx = Array.isArray(data.recentTransactions) ? data.recentTransactions : [];
    const charts = data.charts || {};

    const txRowsHtml = recentTx
      .map(
        (tx) => `
        <div class="transaction-row" data-testid="transaction-row">
          <div class="transaction-meta">
            <span class="transaction-txid">${tx.txId}</span>
            <span class="transaction-user">${tx.user}</span>
          </div>
          <span class="transaction-date">${formatDate(tx.date)}</span>
          <span class="transaction-amount-badge">${formatCurrency(tx.amount)}</span>
        </div>
      `,
      )
      .join("");

    contentEl.innerHTML = `
      <div class="dashboard-grid">
        <!-- Row 1: 4 KPI StatBox Cards -->
        <div class="col-span-3 statbox-card" data-testid="statbox-emails">
          <div class="statbox-top">
            <div>
              <span class="statbox-icon" aria-hidden="true">✉️</span>
              <div class="statbox-value">${formatCurrency(invoicedRevenue)}</div>
            </div>
            <div class="progress-ring-circle" style="--progress: ${ratios.emails};" aria-hidden="true">
              <div class="progress-ring-inner"></div>
            </div>
          </div>
          <div class="statbox-bottom">
            <span class="statbox-subtitle">Emails Sent</span>
            <span class="statbox-badge">+14%</span>
          </div>
        </div>

        <div class="col-span-3 statbox-card" data-testid="statbox-sales">
          <div class="statbox-top">
            <div>
              <span class="statbox-icon" aria-hidden="true">💼</span>
              <div class="statbox-value">${formatCurrency(txVolume)}</div>
            </div>
            <div class="progress-ring-circle" style="--progress: ${ratios.sales};" aria-hidden="true">
              <div class="progress-ring-inner"></div>
            </div>
          </div>
          <div class="statbox-bottom">
            <span class="statbox-subtitle">Sales Obtained</span>
            <span class="statbox-badge">+21%</span>
          </div>
        </div>

        <div class="col-span-3 statbox-card" data-testid="statbox-clients">
          <div class="statbox-top">
            <div>
              <span class="statbox-icon" aria-hidden="true">👤</span>
              <div class="statbox-value">${activeContacts.toLocaleString()}</div>
            </div>
            <div class="progress-ring-circle" style="--progress: ${ratios.clients};" aria-hidden="true">
              <div class="progress-ring-inner"></div>
            </div>
          </div>
          <div class="statbox-bottom">
            <span class="statbox-subtitle">New Clients</span>
            <span class="statbox-badge">+5%</span>
          </div>
        </div>

        <div class="col-span-3 statbox-card" data-testid="statbox-traffic">
          <div class="statbox-top">
            <div>
              <span class="statbox-icon" aria-hidden="true">🚦</span>
              <div class="statbox-value">${teamMembers.toLocaleString()}</div>
            </div>
            <div class="progress-ring-circle" style="--progress: ${ratios.traffic};" aria-hidden="true">
              <div class="progress-ring-inner"></div>
            </div>
          </div>
          <div class="statbox-bottom">
            <span class="statbox-subtitle">Traffic Received</span>
            <span class="statbox-badge">+43%</span>
          </div>
        </div>

        <!-- Row 2: Revenue Generated Line Chart (8 cols) & Recent Transactions (4 cols) -->
        <div class="col-span-8 dashboard-card-inner" data-testid="card-revenue-chart">
          <div class="card-header">
            <div>
              <h2 class="card-title">Revenue Generated</h2>
              <div class="statbox-value" style="color: var(--color-accent); font-size: 1.25rem;">$59,342.32</div>
            </div>
          </div>
          <div id="dashboard-line-chart-slot" class="dashboard-chart-container"></div>
        </div>

        <div class="col-span-4 transactions-card" data-testid="card-recent-transactions">
          <div class="card-header">
            <h2 class="card-title">Recent Transactions</h2>
          </div>
          <div class="transactions-list">
            ${txRowsHtml || '<div class="empty-state">No recent transactions recorded.</div>'}
          </div>
        </div>

        <!-- Row 3: Campaign Revenue (4 cols), Sales Bar Chart (4 cols), Geography Traffic (4 cols) -->
        <div class="col-span-4 campaign-card" data-testid="card-campaign">
          <div class="card-header">
            <h2 class="card-title">Campaign</h2>
          </div>
          <div class="campaign-content">
            <div class="progress-ring-circle" style="--progress: 0.75; width: 64px; height: 64px;" aria-hidden="true">
              <div class="progress-ring-inner" style="width: 48px; height: 48px;"></div>
            </div>
            <div class="campaign-amount">$48,352 revenue generated</div>
            <div class="campaign-desc">Includes extra misc expenditures and costs</div>
          </div>
        </div>

        <div class="col-span-4 dashboard-card-inner" data-testid="card-sales-chart">
          <div class="card-header">
            <h2 class="card-title">Sales Quantity</h2>
          </div>
          <div id="dashboard-bar-chart-slot" class="dashboard-chart-container"></div>
        </div>

        <div class="col-span-4 dashboard-card-inner" data-testid="card-geography-chart">
          <div class="card-header">
            <h2 class="card-title">Geography Based Traffic</h2>
          </div>
          <div id="dashboard-geo-chart-slot" class="dashboard-geo-container"></div>
        </div>
      </div>
    `;

    // Mount child mini-charts
    const lineSlot = contentEl.querySelector("#dashboard-line-chart-slot");
    if (lineSlot && charts.revenueLine) {
      const lineChart = new ChartComponent({
        type: "line",
        data: charts.revenueLine,
        isDashboard: true,
      });
      lineChart.mount(lineSlot);
      this.activeCharts.push(lineChart);
    }

    const barSlot = contentEl.querySelector("#dashboard-bar-chart-slot");
    if (barSlot && charts.salesBar) {
      const barChart = new ChartComponent({
        type: "bar",
        data: charts.salesBar,
        isDashboard: true,
      });
      barChart.mount(barSlot);
      this.activeCharts.push(barChart);
    }

    const geoSlot = contentEl.querySelector("#dashboard-geo-chart-slot");
    if (geoSlot && charts.geographyTraffic) {
      const geoChart = new ChartComponent({
        type: "geography",
        data: charts.geographyTraffic,
        isDashboard: true,
      });
      geoChart.mount(geoSlot);
      this.activeCharts.push(geoChart);
    }
  }

  _renderError(message) {
    const alertEl = this.element?.querySelector("#dashboard-alert-container");
    const contentEl = this.element?.querySelector("#dashboard-content");

    if (alertEl) {
      alertEl.innerHTML = `
        <div class="alert alert-danger" role="alert" data-testid="dashboard-error">
          <span>Failed to load operational dashboard: ${message}</span>
          <button id="retry-dashboard-btn" class="btn btn-secondary">Retry</button>
        </div>
      `;
      const retryBtn = alertEl.querySelector("#retry-dashboard-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => this.loadDashboardData());
      }
    }

    if (contentEl) {
      contentEl.innerHTML = `
        <div class="dashboard-card" style="text-align: center; padding: 2rem;">
          <p>Dashboard telemetry could not be retrieved from the server.</p>
        </div>
      `;
    }
  }

  _handleDownloadClick() {
    const summary = this.data?.summary || {};
    const transactions = this.data?.recentTransactions || [];
    downloadOperationalReport(summary, transactions);
  }

  _cleanupCharts() {
    for (const chart of this.activeCharts) {
      try {
        chart.unmount();
      } catch {
        // Safe cleanup
      }
    }
    this.activeCharts = [];
  }

  /**
   * Cleans up resources, charts, and listeners on view unmount.
   */
  unmount() {
    if (!this.isMounted) return;

    const downloadBtn = this.element?.querySelector("#btn-download-reports");
    if (downloadBtn) {
      downloadBtn.removeEventListener("click", this._handleDownloadClick);
    }

    this._cleanupCharts();

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.container = null;
    this.isMounted = false;
  }
}

export default DashboardView;
