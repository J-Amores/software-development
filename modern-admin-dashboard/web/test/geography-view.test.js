// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GeographyView } from "../src/views/geography-view.js";
import { createFakeApiClient } from "../src/api/index.js";

describe("GeographyView Component (/geography)", () => {
  let container;
  let view;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      view.unmount();
      view = null;
    }
    if (container && container.parentNode) {
      container.remove();
    }
  });

  it("throws an error when mounted without a container", () => {
    const geoView = new GeographyView();
    expect(() => geoView.mount(null)).toThrow(/target container is required/i);
  });

  it("renders scene header, breadcrumbs, and mounts geography choropleth chart", async () => {
    const fakeClient = createFakeApiClient();
    view = new GeographyView({ apiClient: fakeClient });
    view.mount(container);

    expect(container.querySelector(".scene-title").textContent).toContain("Geography Chart");
    expect(container.querySelector(".scene-subtitle").textContent).toContain("traffic");

    await new Promise((resolve) => setTimeout(resolve, 10));

    const chartEl = container.querySelector('[data-testid="chart-component"]');
    expect(chartEl).not.toBeNull();
    const imgEl = container.querySelector('[role="img"]');
    expect(imgEl.dataset.chartType).toBe("geography");
  });

  it("displays error alert when fetching fails", async () => {
    const throwingClient = createFakeApiClient({
      shouldThrow: true,
      errorMessage: "Failed to load geography",
    });
    view = new GeographyView({ apiClient: throwingClient });
    view.mount(container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const alertEl = container.querySelector(".scene-error-alert");
    expect(alertEl).not.toBeNull();
    expect(alertEl.textContent).toContain("Failed to load geography");
  });

  it("cleans up on unmount", async () => {
    const fakeClient = createFakeApiClient();
    view = new GeographyView({ apiClient: fakeClient });
    view.mount(container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    view.unmount();
    expect(container.innerHTML).toBe("");
  });
});
