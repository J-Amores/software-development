/**
 * Dashboard View - Executive Kinetic Carbon
 * Primary administrative overview view adhering to the mount / unmount lifecycle seam.
 * Renders the 12-column Bento-box grid with live KPI StatBoxes, animated radial SVG gauges,
 * embedded Chart.js visualizations with Stitch palette, recent transactions feed, and CSV report export.
 */

import { apiClient as defaultApiClient } from "../api/index.js";
import { ChartComponent } from "../components/chart/index.js";
import { downloadOperationalReport } from "../utils/reportExporter.js";
import {
  isMotionReduced,
  animateNumber,
  bindBentoSpotlight,
  staggerEnter,
} from "../utils/motion.js";

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
    this.lineChartComponent = null;
    this._unbindSpotlight = null;

    this._handleDownloadClick = this._handleDownloadClick.bind(this);
    this._handleTimeframeClick = this._handleTimeframeClick.bind(this);
    this._handleViewAllTxClick = this._handleViewAllTxClick.bind(this);
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
      <header class="scene-header bento-header" style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end; width: 100%; padding-bottom: 1rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 1rem;">
        <div class="scene-header-left">
          <nav class="scene-breadcrumbs" aria-label="Breadcrumb" style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; font-family: var(--font-mono);">
            <span class="breadcrumb-item">Overview</span>
            <span class="breadcrumb-separator" aria-hidden="true" style="margin: 0 0.35rem;">/</span>
            <span class="breadcrumb-item active" aria-current="page" style="color: var(--color-primary); font-weight: 600;">Dashboard</span>
          </nav>
          <h1 id="dashboard-title" class="scene-title" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">Administrative Dashboard</h1>
          <p class="scene-subtitle" style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.2rem;">Welcome to your dashboard. System healthy and synced with cluster nodes.</p>
        </div>
        <div class="dashboard-header-actions" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <div class="dashboard-telemetry-pill" style="display: flex; gap: 0.5rem; align-items: center;">
            <div class="tracer-badge" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); background: var(--bg-surface); border: 1px solid var(--border-subtle); font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-secondary);">
              <span class="pulse-indicator" style="color: var(--color-secondary);"><span class="pulse-indicator-dot"></span></span>
              <span data-testid="api-status">API: Operational</span>
            </div>
            <div class="tracer-badge" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); background: var(--bg-surface); border: 1px solid var(--border-subtle); font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-tertiary);">
              <span class="pulse-indicator" style="color: var(--color-tertiary);"><span class="pulse-indicator-dot"></span></span>
              <span data-testid="db-status">DB: connected</span>
            </div>
          </div>
          <button id="btn-download-reports" class="btn-download-reports" data-testid="download-reports-btn" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.85rem; border-radius: var(--radius-lg); background: rgba(192, 193, 255, 0.1); border: 1px solid var(--color-primary); color: var(--color-primary); font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: all var(--transition-fast);">
            <span class="material-symbols-outlined" style="font-size: 16px;">file_download</span>
            <span>Download Reports</span>
          </button>
        </div>
      </header>

      <div id="dashboard-alert-container"></div>

      <div id="dashboard-content" class="dashboard-body">
        <div class="dashboard-loading" role="status" style="display: flex; align-items: center; justify-content: center; padding: 3rem; color: var(--text-muted); gap: 0.5rem; font-size: 0.875rem;">
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

    // Attach specular cursor spotlight
    this._unbindSpotlight = bindBentoSpotlight(this.element);

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
      <div class="dashboard-loading" role="status" style="display: flex; align-items: center; justify-content: center; padding: 3rem; color: var(--text-muted); gap: 0.5rem; font-size: 0.875rem;">
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

    const recentTx = Array.isArray(data.recentTransactions) ? data.recentTransactions : [];
    const charts = data.charts || {};

    const txRowsHtml = recentTx
      .map(
        (tx) => `
        <div class="transaction-row" data-testid="transaction-row">
          <div class="transaction-meta">
            <span class="transaction-txid font-mono">${tx.txId}</span>
            <span class="transaction-user">${tx.user}</span>
          </div>
          <span class="transaction-date font-mono tabular-nums">${formatDate(tx.date)}</span>
          <span class="transaction-amount-badge font-mono tabular-nums">+${formatCurrency(tx.amount)}</span>
        </div>
      `,
      )
      .join("");

    contentEl.innerHTML = `
      <div class="dashboard-grid">
        <!-- Row 1: 4 Executive Bento KPI StatCards (3 Cols Each) -->
        <div class="bento-card col-span-3 statbox-card specular-border stagger-item" id="statbox-emails" data-testid="statbox-emails">
          <div class="statbox-top">
            <div>
              <span class="statbox-subtitle font-mono text-muted uppercase tracking-wider text-[11px]">EMAILS SENT</span>
              <div class="statbox-value font-mono font-bold tabular-nums" id="kpi-emails-val">${formatCurrency(invoicedRevenue)}</div>
            </div>
            <div class="progress-gauge-wrapper">
              <svg class="progress-gauge" viewBox="0 0 36 36">
                <path class="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-surface-high)" stroke-width="3"></path>
                <path class="gauge-fill" pathLength="100" data-target-offset="25" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-primary)" stroke-dasharray="100 100" stroke-dashoffset="100" stroke-linecap="round" stroke-width="3"></path>
              </svg>
              <span class="material-symbols-outlined progress-gauge-icon" style="color: var(--color-primary);">mail</span>
            </div>
          </div>
          <div class="statbox-bottom">
            <div class="statbox-badge font-mono tabular-nums" style="color: var(--color-secondary);">
              <span class="material-symbols-outlined" style="font-size: 14px;">trending_up</span>
              <span>+14.2%</span>
            </div>
            <span class="statbox-subtitle">Emails Sent</span>
          </div>
          <div class="statbox-submetric">
            <span class="statbox-submetric-label">INVOICED TOTAL</span>
            <span class="statbox-submetric-val font-mono tabular-nums">${summary.invoicedRevenue?.count ?? 0} Invoices</span>
          </div>
        </div>

        <div class="bento-card col-span-3 statbox-card specular-border stagger-item" id="statbox-sales" data-testid="statbox-sales">
          <div class="statbox-top">
            <div>
              <span class="statbox-subtitle font-mono text-muted uppercase tracking-wider text-[11px]">SALES OBTAINED</span>
              <div class="statbox-value font-mono font-bold tabular-nums" id="kpi-sales-val">${formatCurrency(txVolume)}</div>
            </div>
            <div class="progress-gauge-wrapper">
              <svg class="progress-gauge" viewBox="0 0 36 36">
                <path class="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-surface-high)" stroke-width="3"></path>
                <path class="gauge-fill" pathLength="100" data-target-offset="18" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-secondary)" stroke-dasharray="100 100" stroke-dashoffset="100" stroke-linecap="round" stroke-width="3"></path>
              </svg>
              <span class="material-symbols-outlined progress-gauge-icon" style="color: var(--color-secondary);">point_of_sale</span>
            </div>
          </div>
          <div class="statbox-bottom">
            <div class="statbox-badge font-mono tabular-nums" style="color: var(--color-secondary);">
              <span class="material-symbols-outlined" style="font-size: 14px;">trending_up</span>
              <span>+21.4%</span>
            </div>
            <span class="statbox-subtitle">Sales Obtained</span>
          </div>
          <div class="statbox-submetric">
            <span class="statbox-submetric-label">TX VOLUME</span>
            <span class="statbox-submetric-val font-mono tabular-nums">${summary.transactionVolume?.count ?? 0} Transactions</span>
          </div>
        </div>

        <div class="bento-card col-span-3 statbox-card specular-border stagger-item" id="statbox-clients" data-testid="statbox-clients">
          <div class="statbox-top">
            <div>
              <span class="statbox-subtitle font-mono text-muted uppercase tracking-wider text-[11px]">NEW CLIENTS</span>
              <div class="statbox-value font-mono font-bold tabular-nums" id="kpi-clients-val">${activeContacts.toLocaleString()}</div>
            </div>
            <div class="progress-gauge-wrapper">
              <svg class="progress-gauge" viewBox="0 0 36 36">
                <path class="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-surface-high)" stroke-width="3"></path>
                <path class="gauge-fill" pathLength="100" data-target-offset="52" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-tertiary)" stroke-dasharray="100 100" stroke-dashoffset="100" stroke-linecap="round" stroke-width="3"></path>
              </svg>
              <span class="material-symbols-outlined progress-gauge-icon" style="color: var(--color-tertiary);">person_add</span>
            </div>
          </div>
          <div class="statbox-bottom">
            <div class="statbox-badge font-mono tabular-nums" style="color: var(--color-secondary);">
              <span class="material-symbols-outlined" style="font-size: 14px;">trending_up</span>
              <span>+8.1%</span>
            </div>
            <span class="statbox-subtitle">New Clients</span>
          </div>
          <div class="statbox-submetric">
            <span class="statbox-submetric-label">ACTIVE CONTACTS</span>
            <span class="statbox-submetric-val font-mono tabular-nums">${activeContacts} Active</span>
          </div>
        </div>

        <div class="bento-card col-span-3 statbox-card specular-border stagger-item" id="statbox-traffic" data-testid="statbox-traffic">
          <div class="statbox-top">
            <div>
              <span class="statbox-subtitle font-mono text-muted uppercase tracking-wider text-[11px]">TRAFFIC RECEIVED</span>
              <div class="statbox-value font-mono font-bold tabular-nums" id="kpi-traffic-val">${teamMembers.toLocaleString()}</div>
            </div>
            <div class="progress-gauge-wrapper">
              <svg class="progress-gauge" viewBox="0 0 36 36">
                <path class="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-surface-high)" stroke-width="3"></path>
                <path class="gauge-fill" pathLength="100" data-target-offset="36" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-primary-action)" stroke-dasharray="100 100" stroke-dashoffset="100" stroke-linecap="round" stroke-width="3"></path>
              </svg>
              <span class="material-symbols-outlined progress-gauge-icon" style="color: var(--color-primary-action);">hub</span>
            </div>
          </div>
          <div class="statbox-bottom">
            <div class="statbox-badge font-mono tabular-nums" style="color: var(--color-secondary);">
              <span class="material-symbols-outlined" style="font-size: 14px;">trending_up</span>
              <span>+43.5%</span>
            </div>
            <span class="statbox-subtitle">Traffic Received</span>
          </div>
          <div class="statbox-submetric">
            <span class="statbox-submetric-label">TEAM OPERATORS</span>
            <span class="statbox-submetric-val font-mono tabular-nums">${teamMembers} Active</span>
          </div>
        </div>

        <!-- Row 2: Revenue Generated Multi-Series Chart (8 cols) & Recent Transactions (4 cols) -->
        <div class="bento-card col-span-8 dashboard-card-inner specular-border stagger-item" data-testid="card-revenue-chart">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-hairline);">
            <div>
              <span class="card-title-eyebrow font-mono text-[11px] text-muted uppercase tracking-wider">Revenue Generated</span>
              <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-top: 0.15rem;">
                <h2 id="revenue-headline-val" class="card-title font-mono font-bold text-2xl tabular-nums" style="margin: 0; color: var(--color-secondary);">$59,342.32</h2>
                <span class="badge-yoy font-mono text-xs px-2 py-0.5 rounded border tabular-nums" style="color: var(--color-secondary); background: var(--color-success-subtle); border-color: var(--color-success-border);">+18.4% YOY</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <div class="series-legend-chips">
                <span class="series-chip"><span class="series-chip-dot" style="background: var(--color-primary);"></span> Yield Telemetry</span>
                <span class="series-chip"><span class="series-chip-dot" style="background: var(--color-secondary);"></span> Mesh Throughput</span>
                <span class="series-chip"><span class="series-chip-dot" style="background: var(--color-error-light);"></span> Inflow Latency</span>
              </div>
              <div class="timeframe-pill-group" id="timeframe-pill-group">
                <button type="button" class="timeframe-btn" data-range="1D">1D</button>
                <button type="button" class="timeframe-btn" data-range="7D">7D</button>
                <button type="button" class="timeframe-btn active" data-range="1M">1M</button>
                <button type="button" class="timeframe-btn" data-range="1Y">1Y</button>
                <button type="button" class="timeframe-btn" data-range="ALL">ALL</button>
              </div>
            </div>
          </div>
          <div id="dashboard-revenue-chart-slot" class="dashboard-chart-container" data-alias="dashboard-line-chart-slot"></div>
        </div>

        <div class="bento-card col-span-4 transactions-card specular-border stagger-item" data-testid="card-recent-transactions">
          <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="material-symbols-outlined" style="font-size: 18px; color: var(--color-primary);">history</span>
              <div>
                <h2 class="card-title font-sans font-semibold text-sm" style="margin: 0; color: var(--text-primary); line-height: 1.2;">Recent Transactions</h2>
                <span class="text-label-caps font-label-caps text-muted" style="font-size: 10px;">Active Settlement Ledger</span>
              </div>
            </div>
            <span class="font-mono text-xs text-muted tabular-nums">${recentTx.length} total</span>
          </div>
          <div class="transactions-list custom-scroll">
            ${txRowsHtml || '<div class="empty-state" style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8125rem;">No recent transactions recorded.</div>'}
          </div>
          <button type="button" class="btn-view-all-tx font-mono text-xs" id="btn-view-all-tx">
            View All Transactions →
          </button>
        </div>

        <!-- Row 3: Campaign (4 cols) + Sales Quantity Bar (4 cols) + Geography Traffic (4 cols) -->
        <div class="bento-card col-span-4 campaign-card specular-border stagger-item" data-testid="card-campaign">
          <div class="card-header">
            <div>
              <span class="font-mono text-[10px] text-muted uppercase tracking-wider block">Campaign</span>
              <h2 class="card-title font-sans font-semibold text-sm" style="margin: 0; color: var(--text-primary);">Fulfillment & Margin</h2>
            </div>
            <span class="badge-status font-mono text-[10px] px-2 py-0.5 rounded-full" style="color: var(--color-secondary); background: var(--color-success-subtle); border: 1px solid var(--color-success-border);">Active</span>
          </div>
          <div class="campaign-content">
            <div style="position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;">
              <svg style="width: 140px; height: 140px; transform: rotate(-90deg);" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="42" stroke="var(--bg-surface-high)" stroke-width="8"></circle>
                <circle class="campaign-ring-fill" cx="50" cy="50" fill="none" r="42" stroke="var(--color-secondary)" stroke-dasharray="264" stroke-dashoffset="264" data-target-offset="52" stroke-linecap="round" stroke-width="8"></circle>
                <circle class="campaign-ring-fill" cx="50" cy="50" fill="none" r="32" stroke="var(--color-primary)" stroke-dasharray="200" stroke-dashoffset="200" data-target-offset="60" stroke-linecap="round" stroke-width="4"></circle>
              </svg>
              <div style="position: absolute; display: flex; flex-direction: column; align-items: center; text-align: center;">
                <span class="font-mono font-bold text-xl tabular-nums" style="color: var(--color-secondary);">88.4%</span>
                <span class="text-[10px] text-muted font-mono uppercase tracking-wider">EFFICIENCY</span>
              </div>
            </div>
            <div class="campaign-amount font-mono tabular-nums" style="margin-top: 0.25rem;">$48,352 revenue generated</div>
            <div class="campaign-desc font-sans text-muted">Includes extra misc expenditures and recurring client quotas.</div>
          </div>
          <div class="campaign-footer font-sans">
            <div>
              <div class="text-[10px] text-muted font-mono uppercase">Target Yield</div>
              <div class="font-mono font-semibold text-sm text-primary tabular-nums">$52,000.00</div>
            </div>
            <div style="width: 1px; background: var(--border-hairline);"></div>
            <div>
              <div class="text-[10px] text-muted font-mono uppercase">Gross Margin</div>
              <div class="font-mono font-semibold text-sm tabular-nums" style="color: var(--color-secondary);">92.8%</div>
            </div>
          </div>
        </div>

        <div class="bento-card col-span-4 dashboard-card-inner specular-border stagger-item" data-testid="card-sales-chart">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-hairline);">
            <div>
              <span class="font-mono text-[10px] text-muted uppercase tracking-wider block">Sales Quantity</span>
              <h2 class="card-title font-sans font-semibold text-sm" style="margin: 0; color: var(--text-primary);">Regional Distribution</h2>
            </div>
            <span class="font-mono text-[11px] px-2 py-0.5 rounded tabular-nums" style="color: var(--color-primary); background: var(--color-primary-subtle); border: 1px solid var(--color-primary-border);">${(summary.invoicedRevenue?.count || 0) + (summary.transactionVolume?.count || 0)} Units</span>
          </div>
          <div id="dashboard-bar-chart-slot" class="dashboard-chart-container"></div>
          <div style="margin-top: 0.5rem; padding-top: 0.4rem; border-top: 1px solid var(--border-hairline); display: flex; justify-content: space-between; font-size: 0.75rem;">
            <span class="text-muted">Active Cluster Nodes</span>
            <span class="font-mono font-semibold tabular-nums" style="color: var(--color-secondary);">99.4% Synchronized</span>
          </div>
        </div>

        <div class="bento-card col-span-4 dashboard-card-inner specular-border stagger-item" data-testid="card-geography-chart">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-hairline);">
            <div>
              <span class="font-mono text-[10px] text-muted uppercase tracking-wider block">Geography Based Traffic</span>
              <h2 class="card-title font-sans font-semibold text-sm" style="margin: 0; color: var(--text-primary);">Telemetry Routing</h2>
            </div>
            <span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-muted);">public</span>
          </div>
          <div id="dashboard-geo-chart-slot" class="dashboard-geo-container"></div>
          <div class="geo-country-table">
            <div class="geo-country-row">
              <span class="geo-country-name font-sans">
                <span class="pulse-indicator-dot live-dot" style="background: var(--color-secondary);"></span>
                United States
              </span>
              <span class="geo-country-pct font-mono tabular-nums">48.2%</span>
            </div>
            <div class="geo-country-row">
              <span class="geo-country-name font-sans">
                <span class="pulse-indicator-dot live-dot" style="background: var(--color-primary);"></span>
                Germany
              </span>
              <span class="geo-country-pct font-mono tabular-nums">22.4%</span>
            </div>
            <div class="geo-country-row">
              <span class="geo-country-name font-sans">
                <span class="pulse-indicator-dot live-dot" style="background: var(--color-tertiary);"></span>
                United Kingdom
              </span>
              <span class="geo-country-pct font-mono tabular-nums">16.1%</span>
            </div>
            <div class="geo-country-row">
              <span class="geo-country-name font-sans">
                <span class="pulse-indicator-dot" style="background: var(--color-error-light);"></span>
                Japan
              </span>
              <span class="geo-country-pct font-mono tabular-nums">13.3%</span>
            </div>
          </div>
          <div class="geo-footer font-mono tabular-nums">
            <span>Global Edge Nodes: 18 Active</span>
            <span style="color: var(--color-secondary); display: inline-flex; align-items: center; gap: 0.3rem;">
              <span class="pulse-indicator-dot live-dot" style="background: var(--color-secondary);"></span>
              14.2ms / 48% load
            </span>
          </div>
        </div>
      </div>
    `;

    // Mount child mini-charts with Executive Kinetic Carbon theme
    const lineSlot =
      contentEl.querySelector("#dashboard-revenue-chart-slot") ||
      contentEl.querySelector("#dashboard-line-chart-slot");
    if (lineSlot && charts.revenueLine) {
      this.lineChartComponent = new ChartComponent({
        type: "line",
        data: charts.revenueLine,
        isDashboard: true,
      });
      this.lineChartComponent.mount(lineSlot);
      this.activeCharts.push(this.lineChartComponent);
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

    // Attach timeframe pill listeners
    const timeframeGroup = contentEl.querySelector("#timeframe-pill-group");
    if (timeframeGroup) {
      timeframeGroup.addEventListener("click", this._handleTimeframeClick);
    }

    // Attach View All Transactions button listener
    const viewAllBtn = contentEl.querySelector("#btn-view-all-tx");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", this._handleViewAllTxClick);
    }

    // Trigger stagger cascade entry on cards
    staggerEnter(contentEl, ".stagger-item", 8);

    // Animate KPI numbers, SVG progress gauges, and campaign target rings
    if (!isMotionReduced()) {
      const emailsValEl = contentEl.querySelector("#kpi-emails-val");
      if (emailsValEl) {
        animateNumber(emailsValEl, invoicedRevenue, (val) => formatCurrency(val));
      }
      const salesValEl = contentEl.querySelector("#kpi-sales-val");
      if (salesValEl) {
        animateNumber(salesValEl, txVolume, (val) => formatCurrency(val));
      }
      const clientsValEl = contentEl.querySelector("#kpi-clients-val");
      if (clientsValEl) {
        animateNumber(clientsValEl, activeContacts, (val) => Math.round(val).toLocaleString());
      }
      const trafficValEl = contentEl.querySelector("#kpi-traffic-val");
      if (trafficValEl) {
        animateNumber(trafficValEl, teamMembers, (val) => Math.round(val).toLocaleString());
      }

      // Animate SVG radial gauge arcs and campaign ring on frame 1
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentEl.querySelectorAll(".gauge-fill").forEach((path) => {
            const target = path.dataset.targetOffset;
            if (target !== undefined) {
              path.style.strokeDashoffset = target;
            }
          });
          contentEl.querySelectorAll(".campaign-ring-fill").forEach((circle) => {
            const target = circle.dataset.targetOffset;
            if (target !== undefined) {
              circle.style.strokeDashoffset = target;
            }
          });
        });
      });
    } else {
      // Synchronous frame-0 resolution for tests & reduced motion
      contentEl.querySelectorAll(".gauge-fill").forEach((path) => {
        const target = path.dataset.targetOffset;
        if (target !== undefined) {
          path.setAttribute("stroke-dashoffset", target);
          path.style.strokeDashoffset = target;
        }
      });
      contentEl.querySelectorAll(".campaign-ring-fill").forEach((circle) => {
        const target = circle.dataset.targetOffset;
        if (target !== undefined) {
          circle.setAttribute("stroke-dashoffset", target);
          circle.style.strokeDashoffset = target;
        }
      });
    }
  }

  _handleTimeframeClick(e) {
    const btn = e.target.closest?.(".timeframe-btn");
    if (!btn || !this.lineChartComponent) return;

    const group = this.element?.querySelector("#timeframe-pill-group");
    if (group) {
      group.querySelectorAll(".timeframe-btn").forEach((b) => b.classList.remove("active"));
    }
    btn.classList.add("active");

    const range = btn.dataset.range || "1M";
    const baseData = this.data?.charts?.revenueLine;
    if (!Array.isArray(baseData)) return;

    // Filter points based on timeframe to morph the spline curve
    let sliceLen = 12;
    let targetRevenue = 59342.32;
    if (range === "1D" || range === "24H") {
      sliceLen = 3;
      targetRevenue = 4820.5;
    } else if (range === "7D") {
      sliceLen = 5;
      targetRevenue = 16340.2;
    } else if (range === "1M" || range === "30D") {
      sliceLen = 8;
      targetRevenue = 59342.32;
    } else if (range === "1Y") {
      sliceLen = 10;
      targetRevenue = 342910.0;
    } else if (range === "ALL") {
      sliceLen = 12;
      targetRevenue = 780450.0;
    }

    const filteredData = baseData.map((series) => ({
      ...series,
      data: Array.isArray(series.data) ? series.data.slice(0, sliceLen) : [],
    }));

    this.lineChartComponent.update(filteredData);

    const headlineEl = this.element?.querySelector("#revenue-headline-val");
    if (headlineEl) {
      animateNumber(headlineEl, targetRevenue, (val) => formatCurrency(val), 350);
    }
  }

  _handleViewAllTxClick() {
    window.history.pushState({}, "", "/invoices");
    window.dispatchEvent(new PopStateEvent("popstate"));
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
        <div class="bento-card dashboard-card" style="text-align: center; padding: 2rem;">
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
    this.lineChartComponent = null;
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

    const timeframeGroup = this.element?.querySelector("#timeframe-pill-group");
    if (timeframeGroup) {
      timeframeGroup.removeEventListener("click", this._handleTimeframeClick);
    }

    const viewAllBtn = this.element?.querySelector("#btn-view-all-tx");
    if (viewAllBtn) {
      viewAllBtn.removeEventListener("click", this._handleViewAllTxClick);
    }

    if (this._unbindSpotlight) {
      this._unbindSpotlight();
      this._unbindSpotlight = null;
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
