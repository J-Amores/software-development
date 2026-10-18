// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ChartComponent } from "../src/components/chart/index.js";
import { themeManager } from "../src/theme/index.js";

describe("ChartComponent Deep Module Seam", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe("Lifecycle & DOM Rendering", () => {
    it("mounts into container and renders semantic role='img' and aria-label", () => {
      const chart = new ChartComponent({
        type: "bar",
        data: [{ country: "AD", "hot dog": 137, burger: 96 }],
      });

      chart.mount(container);

      const componentEl = container.querySelector('[data-testid="chart-component"]');
      expect(componentEl).not.toBeNull();

      const imgEl = container.querySelector('[role="img"]');
      expect(imgEl).not.toBeNull();
      expect(imgEl.getAttribute("aria-label")).toContain("bar");
      expect(imgEl.dataset.chartType).toBe("bar");
      expect(imgEl.dataset.isDashboard).toBe("false");

      chart.unmount();
      expect(container.innerHTML).toBe("");
    });

    it("supports mount with isDashboard=true option", () => {
      const chart = new ChartComponent({
        type: "line",
        data: [{ id: "revenue", data: [{ x: "Jan", y: 100 }] }],
        isDashboard: true,
      });

      chart.mount(container);

      const imgEl = container.querySelector('[role="img"]');
      expect(imgEl.dataset.isDashboard).toBe("true");

      chart.unmount();
    });

    it("throws an error if mount is called without a container", () => {
      const chart = new ChartComponent({ type: "pie", data: [] });
      expect(() => chart.mount(null)).toThrow(/target container is required/i);
    });

    it("updates data via update(data, options) and refreshes summary", () => {
      const chart = new ChartComponent({
        type: "pie",
        data: [{ id: "hack", label: "hack", value: 239 }],
      });

      chart.mount(container);

      let summary = container.querySelector('[data-testid="chart-summary"]');
      expect(summary.textContent).toContain("hack");
      expect(summary.textContent).toContain("239");

      chart.update([{ id: "make", label: "make", value: 500 }]);

      summary = container.querySelector('[data-testid="chart-summary"]');
      expect(summary.textContent).toContain("make");
      expect(summary.textContent).toContain("500");

      chart.unmount();
    });
  });

  describe("Chart Types & Semantic Summaries", () => {
    it("renders Bar chart semantic series summary", () => {
      const barData = [
        { country: "AD", "hot dog": 137, burger: 96 },
        { country: "AE", "hot dog": 55, burger: 28 },
      ];
      const chart = new ChartComponent({
        type: "bar",
        data: barData,
      });

      chart.mount(container);

      const summary = container.querySelector('[data-testid="chart-summary"]');
      expect(summary.textContent).toContain("AD");
      expect(summary.textContent).toContain("137");
      expect(summary.textContent).toContain("AE");

      chart.unmount();
    });

    it("renders Pie chart semantic slice summary", () => {
      const pieData = [
        { id: "hack", label: "hack", value: 239 },
        { id: "make", label: "make", value: 170 },
      ];
      const chart = new ChartComponent({
        type: "pie",
        data: pieData,
      });

      chart.mount(container);

      const summary = container.querySelector('[data-testid="chart-summary"]');
      expect(summary.textContent).toContain("hack: 239");
      expect(summary.textContent).toContain("make: 170");

      chart.unmount();
    });

    it("renders Line chart multi-series summary", () => {
      const lineData = [
        {
          id: "japan",
          data: [
            { x: "plane", y: 101 },
            { x: "helicopter", y: 75 },
          ],
        },
      ];
      const chart = new ChartComponent({
        type: "line",
        data: lineData,
      });

      chart.mount(container);

      const summary = container.querySelector('[data-testid="chart-summary"]');
      expect(summary.textContent).toContain("japan");
      expect(summary.textContent).toContain("2 points");

      chart.unmount();
    });

    it("renders Geography Choropleth chart country traffic summary", () => {
      const geoData = [
        { id: "AFG", value: 520600 },
        { id: "USA", value: 800000 },
      ];
      const chart = new ChartComponent({
        type: "geography",
        data: geoData,
      });

      chart.mount(container);

      const summary = container.querySelector('[data-testid="chart-summary"]');
      expect(summary.textContent).toContain("AFG: 520600");
      expect(summary.textContent).toContain("USA: 800000");

      chart.unmount();
    });
  });

  describe("Theme Synchronization", () => {
    it("subscribes to themeManager changes and updates styling without throwing", () => {
      const chart = new ChartComponent({
        type: "bar",
        data: [{ country: "AD", "hot dog": 100 }],
      });

      chart.mount(container);

      // Toggle theme
      themeManager.setTheme("light");
      themeManager.setTheme("dark");

      const imgEl = container.querySelector('[role="img"]');
      expect(imgEl).not.toBeNull();

      chart.unmount();
    });
  });

  describe("Error & Edge Case Resilience", () => {
    it("gracefully handles null or empty dataset", () => {
      const chart = new ChartComponent({
        type: "bar",
        data: null,
      });

      expect(() => chart.mount(container)).not.toThrow();

      const summary = container.querySelector('[data-testid="chart-summary"]');
      expect(summary.textContent).toContain("No data available");

      chart.unmount();
    });

    it("calling unmount when not mounted does not throw", () => {
      const chart = new ChartComponent({ type: "bar", data: [] });
      expect(() => chart.unmount()).not.toThrow();
    });
  });
});
