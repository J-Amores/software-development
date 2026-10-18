/**
 * Chart Component Module
 * Zero-framework deep module encapsulating Chart.js and chartjs-chart-geo.
 * Adheres strictly to ADR 0005: callers and tests must never import chart.js directly.
 */

import {
  Chart,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { ChoroplethController, GeoFeature, ColorScale, ProjectionScale } from "chartjs-chart-geo";
import { geoFeatures } from "../../../../data/mockGeoFeatures.js";
import { themeManager } from "../../theme/index.js";

let isRegistered = false;

function ensureChartRegistered() {
  if (isRegistered) return;
  try {
    Chart.register(
      BarController,
      BarElement,
      PieController,
      ArcElement,
      LineController,
      LineElement,
      PointElement,
      CategoryScale,
      LinearScale,
      Title,
      Tooltip,
      Legend,
      Colors,
      ChoroplethController,
      GeoFeature,
      ColorScale,
      ProjectionScale,
    );
    isRegistered = true;
  } catch {
    // Graceful catch for test environments where registration might be partially mocked
  }
}

/**
 * Checks whether canvas 2D rendering context is available.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {boolean}
 */
function hasCanvas2D(canvas) {
  if (!canvas || typeof canvas.getContext !== "function") return false;
  try {
    const ctx = canvas.getContext("2d");
    return Boolean(ctx && typeof ctx.fillText === "function");
  } catch {
    return false;
  }
}

/**
 * Retrieves CSS custom property token colors for theme synchronization.
 */
function getThemeColors() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      textColor: "#858585",
      borderColor: "#333333",
      primaryColor: "#4cceac",
      accentColor: "#6870fa",
      cardBg: "#1F2A40",
    };
  }
  const styles = getComputedStyle(document.documentElement);
  return {
    textColor: styles.getPropertyValue("--text-secondary").trim() || "#858585",
    borderColor: styles.getPropertyValue("--border-color").trim() || "#333333",
    primaryColor: styles.getPropertyValue("--color-primary").trim() || "#4cceac",
    accentColor: styles.getPropertyValue("--color-accent").trim() || "#6870fa",
    cardBg: styles.getPropertyValue("--bg-card").trim() || "#1F2A40",
  };
}

export class ChartComponent {
  /**
   * @param {Object} options
   * @param {'bar' | 'pie' | 'line' | 'geography'} options.type - Chart visualization type
   * @param {any} options.data - Chart dataset payload
   * @param {Object} [options.options={}] - Custom visualization overrides
   * @param {boolean} [options.isDashboard=false] - Whether chart is rendered in compact dashboard card
   * @param {boolean} [options.forceFallback=false] - Whether to force semantic headless fallback
   */
  constructor(options = {}) {
    this.type = options.type || "bar";
    this.data = options.data || null;
    this.customOptions = options.options || {};
    this.isDashboard = Boolean(options.isDashboard);
    this.forceFallback = Boolean(options.forceFallback);

    this.container = null;
    this.element = null;
    this.canvas = null;
    this.chart = null;
    this.isMounted = false;
    this.isFallback = false;

    this._unsubscribeTheme = null;
  }

  /**
   * Mounts the chart component into the target DOM container.
   *
   * @param {HTMLElement} container
   * @param {Object} [mountOptions={}]
   */
  mount(container, mountOptions = {}) {
    if (!container) {
      throw new Error("Target container is required to mount ChartComponent");
    }

    if (mountOptions.type) this.type = mountOptions.type;
    if (mountOptions.data !== undefined) this.data = mountOptions.data;
    if (mountOptions.options) this.customOptions = mountOptions.options;
    if (mountOptions.isDashboard !== undefined) {
      this.isDashboard = Boolean(mountOptions.isDashboard);
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("div");
    this.element.className = `chart-component chart-${this.type}${this.isDashboard ? " chart-dashboard" : ""}`;
    this.element.dataset.testid = "chart-component";

    const wrapper = document.createElement("div");
    wrapper.className = "chart-canvas-wrapper";
    wrapper.setAttribute("role", "img");
    wrapper.setAttribute("aria-label", `Chart: ${this.type} visualization`);
    wrapper.dataset.chartType = this.type;
    wrapper.dataset.isDashboard = String(this.isDashboard);

    this.canvas = document.createElement("canvas");
    this.canvas.className = "chart-canvas";
    wrapper.appendChild(this.canvas);

    // Create semantic accessible data summary
    const summaryEl = document.createElement("div");
    summaryEl.className = "chart-summary sr-only";
    summaryEl.dataset.testid = "chart-summary";
    summaryEl.innerHTML = this._generateSummaryHtml();
    wrapper.appendChild(summaryEl);

    this.element.appendChild(wrapper);
    this.container.appendChild(this.element);

    // Check if canvas 2D context is available
    const canRenderCanvas = !this.forceFallback && hasCanvas2D(this.canvas);

    if (canRenderCanvas) {
      this._initChart();
    } else {
      this.isFallback = true;
    }

    // Subscribe to theme switching
    this._unsubscribeTheme = themeManager.subscribe(() => {
      this._handleThemeChange();
    });
  }

  /**
   * Updates chart data and refreshes rendering.
   *
   * @param {any} data
   * @param {Object} [options={}]
   */
  update(data, options = {}) {
    if (data !== undefined) this.data = data;
    if (options) this.customOptions = { ...this.customOptions, ...options };

    // Update semantic summary
    if (this.element) {
      const summaryEl = this.element.querySelector('[data-testid="chart-summary"]');
      if (summaryEl) {
        summaryEl.innerHTML = this._generateSummaryHtml();
      }
    }

    if (this.chart) {
      const config = this._buildChartConfig();
      this.chart.data = config.data;
      this.chart.options = config.options;
      this.chart.update();
    }
  }

  /**
   * Cleans up chart instance and removes DOM nodes.
   */
  unmount() {
    if (!this.isMounted) return;

    if (this._unsubscribeTheme) {
      this._unsubscribeTheme();
      this._unsubscribeTheme = null;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.canvas = null;
    this.container = null;
    this.isMounted = false;
  }

  _initChart() {
    ensureChartRegistered();
    try {
      const config = this._buildChartConfig();
      this.chart = new Chart(this.canvas, config);
    } catch (err) {
      console.warn("Chart.js initialization failed, falling back to accessible summary:", err);
      this.isFallback = true;
    }
  }

  _handleThemeChange() {
    if (!this.chart) return;
    const colors = getThemeColors();

    if (this.chart.options.scales) {
      for (const scale of Object.values(this.chart.options.scales)) {
        if (scale.ticks) scale.ticks.color = colors.textColor;
        if (scale.grid) scale.grid.color = colors.borderColor;
      }
    }

    if (this.chart.options.plugins?.legend?.labels) {
      this.chart.options.plugins.legend.labels.color = colors.textColor;
    }

    this.chart.update();
  }

  _buildChartConfig() {
    const colors = getThemeColors();

    switch (this.type) {
      case "pie":
        return this._buildPieConfig(colors);
      case "line":
        return this._buildLineConfig(colors);
      case "geography":
        return this._buildGeoConfig(colors);
      case "bar":
      default:
        return this._buildBarConfig(colors);
    }
  }

  _buildBarConfig(colors) {
    const items = Array.isArray(this.data) ? this.data : [];
    const labels = items.map((item) => item.country || item.id || "");

    // Extract all series keys (excluding country, id, and color keys)
    const keys = new Set();
    for (const item of items) {
      for (const k of Object.keys(item)) {
        if (k !== "country" && k !== "id" && !k.endsWith("Color")) {
          keys.add(k);
        }
      }
    }

    const defaultColors = [
      colors.primaryColor,
      colors.accentColor,
      "#f2c94c",
      "#eb5757",
      "#56ccf2",
      "#bb6bd9",
    ];

    const datasets = Array.from(keys).map((key, idx) => ({
      label: key,
      data: items.map((item) => Number(item[key]) || 0),
      backgroundColor: defaultColors[idx % defaultColors.length],
      borderRadius: 4,
    }));

    return {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !this.isDashboard,
            labels: { color: colors.textColor },
          },
        },
        scales: {
          x: {
            ticks: { color: colors.textColor },
            grid: { display: false },
          },
          y: {
            ticks: { color: colors.textColor },
            grid: { color: colors.borderColor },
          },
        },
      },
    };
  }

  _buildPieConfig(colors) {
    const items = Array.isArray(this.data) ? this.data : [];
    const labels = items.map((item) => item.label || item.id || "");
    const dataValues = items.map((item) => Number(item.value) || 0);
    const backgroundColors = items.map((item, idx) => {
      if (item.color) return item.color;
      const palette = ["#4cceac", "#6870fa", "#f2c94c", "#eb5757", "#56ccf2"];
      return palette[idx % palette.length];
    });

    return {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: colors.cardBg,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: this.isDashboard ? "bottom" : "right",
            labels: { color: colors.textColor },
          },
        },
      },
    };
  }

  _buildLineConfig(colors) {
    const seriesList = Array.isArray(this.data) ? this.data : [];
    const allX = new Set();
    for (const s of seriesList) {
      if (Array.isArray(s.data)) {
        for (const pt of s.data) {
          if (pt.x !== undefined) allX.add(pt.x);
        }
      }
    }
    const labels = Array.from(allX);

    const datasets = seriesList.map((series, idx) => {
      const pointMap = new Map();
      if (Array.isArray(series.data)) {
        for (const pt of series.data) {
          pointMap.set(pt.x, pt.y);
        }
      }

      const seriesColor = series.color || (idx === 0 ? colors.primaryColor : colors.accentColor);

      return {
        label: series.id,
        data: labels.map((x) => pointMap.get(x) ?? null),
        borderColor: seriesColor,
        backgroundColor: seriesColor,
        tension: 0.3,
        fill: false,
      };
    });

    return {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !this.isDashboard,
            labels: { color: colors.textColor },
          },
        },
        scales: {
          x: {
            ticks: { color: colors.textColor },
            grid: { color: colors.borderColor },
          },
          y: {
            ticks: { color: colors.textColor },
            grid: { color: colors.borderColor },
          },
        },
      },
    };
  }

  _buildGeoConfig(_colors) {
    const metrics = Array.isArray(this.data) ? this.data : [];
    const metricMap = new Map(metrics.map((m) => [m.id, m.value]));

    const features = geoFeatures.features || [];

    return {
      type: "choropleth",
      data: {
        labels: features.map((d) => d.properties?.name || d.id),
        datasets: [
          {
            label: "Traffic Distribution",
            data: features.map((d) => ({
              feature: d,
              value: metricMap.get(d.id) ?? 0,
            })),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        showOutline: true,
        showGraticule: !this.isDashboard,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          projection: {
            axis: "x",
            projection: "equalEarth",
          },
          color: {
            axis: "x",
            quantize: 5,
            legend: {
              position: "bottom-right",
              align: "bottom",
            },
          },
        },
      },
    };
  }

  _generateSummaryHtml() {
    if (!this.data || (Array.isArray(this.data) && this.data.length === 0)) {
      return "<p>No data available for this chart.</p>";
    }

    if (this.type === "bar" && Array.isArray(this.data)) {
      const items = this.data
        .map((item) => {
          const metricsStr = Object.entries(item)
            .filter(([k]) => k !== "country" && k !== "id" && !k.endsWith("Color"))
            .map(([k, v]) => `${k}=${v}`)
            .join(", ");
          return `<li>${item.country || item.id}: ${metricsStr}</li>`;
        })
        .join("");
      return `<ul>${items}</ul>`;
    }

    if (this.type === "pie" && Array.isArray(this.data)) {
      const items = this.data
        .map((item) => `<li>${item.label || item.id}: ${item.value}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }

    if (this.type === "line" && Array.isArray(this.data)) {
      const items = this.data
        .map((series) => `<li>${series.id}: ${series.data?.length || 0} points</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }

    if (this.type === "geography" && Array.isArray(this.data)) {
      const items = this.data.map((item) => `<li>${item.id}: ${item.value}</li>`).join("");
      return `<ul>${items}</ul>`;
    }

    return "<p>Chart visual representation loaded.</p>";
  }
}

export default ChartComponent;
