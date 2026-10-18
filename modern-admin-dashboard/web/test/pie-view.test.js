// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PieView } from "../src/views/pie-view.js";
import { createFakeApiClient } from "../src/api/index.js";

describe("PieView Component (/pie)", () => {
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
    const pieView = new PieView();
    expect(() => pieView.mount(null)).toThrow(/target container is required/i);
  });

  it("renders scene header, breadcrumbs, and mounts pie chart", async () => {
    const fakeClient = createFakeApiClient();
    view = new PieView({ apiClient: fakeClient });
    view.mount(container);

    expect(container.querySelector(".scene-title").textContent).toContain("Pie Chart");
    expect(container.querySelector(".scene-subtitle").textContent).toContain("breakdown");

    await new Promise((resolve) => setTimeout(resolve, 10));

    const chartEl = container.querySelector('[data-testid="chart-component"]');
    expect(chartEl).not.toBeNull();
    const imgEl = container.querySelector('[role="img"]');
    expect(imgEl.dataset.chartType).toBe("pie");
  });

  it("displays error alert when fetching fails", async () => {
    const throwingClient = createFakeApiClient({
      shouldThrow: true,
      errorMessage: "Failed to load pie",
    });
    view = new PieView({ apiClient: throwingClient });
    view.mount(container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const alertEl = container.querySelector(".scene-error-alert");
    expect(alertEl).not.toBeNull();
    expect(alertEl.textContent).toContain("Failed to load pie");
  });

  it("cleans up on unmount", async () => {
    const fakeClient = createFakeApiClient();
    view = new PieView({ apiClient: fakeClient });
    view.mount(container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    view.unmount();
    expect(container.innerHTML).toBe("");
  });
});
