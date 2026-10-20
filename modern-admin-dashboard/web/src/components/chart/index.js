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
import { isMotionReduced } from "../../utils/motion.js";

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
      textColor: "#c7c4d7",
      borderColor: "rgba(255, 255, 255, 0.05)",
      primaryColor: "#c0c1ff",
      secondaryColor: "#4edea3",
      tertiaryColor: "#7bd0ff",
      accentColor: "#4edea3",
      errorColor: "#ffb4ab",
      cardBg: "#1c1b1d",
    };
  }
  const styles = getComputedStyle(document.documentElement);
  return {
    textColor: styles.getPropertyValue("--text-secondary").trim() || "#c7c4d7",
    borderColor: styles.getPropertyValue("--border-subtle").trim() || "rgba(255, 255, 255, 0.05)",
    primaryColor: styles.getPropertyValue("--color-primary").trim() || "#c0c1ff",
    secondaryColor: styles.getPropertyValue("--color-secondary").trim() || "#4edea3",
    tertiaryColor: styles.getPropertyValue("--color-tertiary").trim() || "#7bd0ff",
    accentColor: styles.getPropertyValue("--color-accent").trim() || "#4edea3",
    errorColor: styles.getPropertyValue("--color-error-light").trim() || "#ffb4ab",
    cardBg: styles.getPropertyValue("--bg-surface-low").trim() || "#1c1b1d",
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
      this.chart.update(isMotionReduced() ? "none" : undefined);
    }
  }

  /**
   * Generates animation configuration respecting motion reduction guardrails.
   * Resolves instantly with false in test runners and prefers-reduced-motion.
   */
  _getAnimationOptions() {
    if (isMotionReduced()) {
      return false;
    }
    return {
      duration: 850,
      easing: "easeOutQuart",
    };
  }

  /**
   * Generates high-density Executive Kinetic Carbon tooltip configuration.
   */
  _getTooltipOptions(_colors) {
    return {
      enabled: true,
      backgroundColor: "rgba(20, 20, 22, 0.94)",
      titleColor: "#e5e1e4",
      bodyColor: "#c7c4d7",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderWidth: 1,
      cornerRadius: 6,
      padding: { top: 8, bottom: 8, left: 12, right: 12 },
      boxPadding: 4,
      usePointStyle: true,
      titleFont: { family: "'Inter', sans-serif", weight: 600, size: 12 },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
    };
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
      colors.errorColor,
      colors.secondaryColor,
      colors.tertiaryColor,
      "#e1e0ff",
      "#00a572",
    ];

    const datasets = Array.from(keys).map((key, idx) => ({
      label: key,
      data: items.map((item) => Number(item[key]) || 0),
      backgroundColor: defaultColors[idx % defaultColors.length],
      borderRadius: 4,
      borderSkipped: false,
    }));

    return {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: this._getAnimationOptions(),
        interaction: {
          mode: "index",
          intersect: false,
        },
        hover: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: !this.isDashboard,
            labels: { color: colors.textColor },
          },
          tooltip: this._getTooltipOptions(colors),
        },
        scales: {
          x: {
            ticks: {
              color: colors.textColor,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { display: false },
          },
          y: {
            ticks: {
              color: colors.textColor,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { color: "rgba(255, 255, 255, 0.05)", borderDash: [4, 4] },
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
      const palette = ["#c0c1ff", "#4edea3", "#7bd0ff", "#ffb4ab", "#e1e0ff"];
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
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: this._getAnimationOptions(),
        plugins: {
          legend: {
            position: this.isDashboard ? "bottom" : "right",
            labels: { color: colors.textColor },
          },
          tooltip: this._getTooltipOptions(colors),
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

    const stitchColors = [colors.primaryColor, colors.secondaryColor, colors.errorColor];

    const datasets = seriesList.map((series, idx) => {
      const pointMap = new Map();
      if (Array.isArray(series.data)) {
        for (const pt of series.data) {
          pointMap.set(pt.x, pt.y);
        }
      }

      const seriesColor = this.isDashboard
        ? stitchColors[idx % stitchColors.length]
        : series.color || stitchColors[idx % stitchColors.length];

      let fillColor = false;
      if (this.isDashboard && idx === 0) {
        fillColor = "rgba(192, 193, 255, 0.12)";
        if (this.canvas && typeof this.canvas.getContext === "function") {
          try {
            const ctx = this.canvas.getContext("2d");
            if (ctx && typeof ctx.createLinearGradient === "function") {
              const gradient = ctx.createLinearGradient(0, 0, 0, 240);
              gradient.addColorStop(0, "rgba(192, 193, 255, 0.28)");
              gradient.addColorStop(1, "rgba(192, 193, 255, 0.0)");
              fillColor = gradient;
            }
          } catch {
            fillColor = "rgba(192, 193, 255, 0.12)";
          }
        }
      }

      return {
        label: series.id,
        data: labels.map((x) => pointMap.get(x) ?? null),
        borderColor: seriesColor,
        backgroundColor: fillColor || seriesColor,
        tension: 0.4,
        fill: Boolean(fillColor),
        borderWidth: this.isDashboard ? 2.5 : 2,
        pointRadius: this.isDashboard ? 3.5 : 3,
        pointHoverRadius: 6.5,
        pointBackgroundColor: colors.cardBg,
        pointBorderColor: seriesColor,
        pointBorderWidth: 2,
        pointHoverBackgroundColor: seriesColor,
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
        borderDash: this.isDashboard && idx === 2 ? [3, 3] : undefined,
      };
    });

    return {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: this._getAnimationOptions(),
        interaction: {
          mode: "index",
          intersect: false,
        },
        hover: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: !this.isDashboard,
            labels: { color: colors.textColor },
          },
          tooltip: this._getTooltipOptions(colors),
        },
        scales: {
          x: {
            ticks: {
              color: colors.textColor,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { display: false },
          },
          y: {
            ticks: {
              color: colors.textColor,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { color: "rgba(255, 255, 255, 0.05)", borderDash: [4, 4] },
          },
        },
      },
    };
  }

  _buildGeoConfig(colors) {
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
            borderColor: "rgba(255, 255, 255, 0.08)",
            borderWidth: 0.5,
            hoverBorderColor: "#c0c1ff",
            hoverBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        showOutline: true,
        showGraticule: !this.isDashboard,
        animation: this._getAnimationOptions(),
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            ...this._getTooltipOptions(colors),
            callbacks: {
              label: (context) => {
                const val = context.raw?.value ?? 0;
                return ` Traffic: ${val.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          projection: {
            axis: "x",
            projection: "equalEarth",
          },
          color: {
            axis: "x",
            interpolate: (v) => {
              if (v === 0) return "#201f22";
              if (v < 0.25) return "#2a2a2c";
              if (v < 0.5) return "rgba(123, 208, 255, 0.45)";
              if (v < 0.75) return "rgba(123, 208, 255, 0.85)";
              return "#4edea3";
            },
            legend: {
              display: false,
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
