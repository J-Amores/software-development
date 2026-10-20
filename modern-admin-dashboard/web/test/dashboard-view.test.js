// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DashboardView } from "../src/views/dashboard-view.js";
import { createFakeApiClient } from "../src/api/index.js";
import * as reportExporter from "../src/utils/reportExporter.js";

describe("DashboardView (12-Column Overview Dashboard Seam)", () => {
  let container;
  let view;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-view-container";
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

  it("renders loading state initially while fetching dashboard summary", () => {
    const fakeClient = createFakeApiClient({
      delayMs: 100,
    });

    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    const loadingEl = container.querySelector(".dashboard-loading");
    expect(loadingEl).not.toBeNull();
    expect(loadingEl.textContent).toContain("Loading operational dashboard");
  });

  it("renders full 12-column grid with 4 StatBoxes on successful load", async () => {
    const fakeClient = createFakeApiClient();
    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    // Header validation
    expect(container.querySelector(".scene-title").textContent).toBe("Administrative Dashboard");
    expect(container.querySelector(".scene-subtitle").textContent).toContain(
      "Welcome to your dashboard",
    );

    // StatBoxes
    const emailsBox = container.querySelector('[data-testid="statbox-emails"]');
    expect(emailsBox).not.toBeNull();
    expect(emailsBox.textContent).toContain("Emails Sent");
    expect(emailsBox.textContent).toContain("+14.2%");

    const salesBox = container.querySelector('[data-testid="statbox-sales"]');
    expect(salesBox).not.toBeNull();
    expect(salesBox.textContent).toContain("Sales Obtained");
    expect(salesBox.textContent).toContain("+21.4%");

    const clientsBox = container.querySelector('[data-testid="statbox-clients"]');
    expect(clientsBox).not.toBeNull();
    expect(clientsBox.textContent).toContain("New Clients");
    expect(clientsBox.textContent).toContain("+8.1%");

    const trafficBox = container.querySelector('[data-testid="statbox-traffic"]');
    expect(trafficBox).not.toBeNull();
    expect(trafficBox.textContent).toContain("Traffic Received");
    expect(trafficBox.textContent).toContain("+43.5%");
  });

  it("renders Revenue Line Chart, Recent Transactions, and Row 3 cards", async () => {
    const fakeClient = createFakeApiClient();
    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    // Row 2
    const revenueCard = container.querySelector('[data-testid="card-revenue-chart"]');
    expect(revenueCard).not.toBeNull();
    expect(revenueCard.textContent).toContain("Revenue Generated");

    const txCard = container.querySelector('[data-testid="card-recent-transactions"]');
    expect(txCard).not.toBeNull();
    expect(txCard.textContent).toContain("Recent Transactions");
    const txRows = txCard.querySelectorAll('[data-testid="transaction-row"]');
    expect(txRows.length).toBeGreaterThan(0);

    // Row 3
    const campaignCard = container.querySelector('[data-testid="card-campaign"]');
    expect(campaignCard).not.toBeNull();
    expect(campaignCard.textContent).toContain("Campaign");
    expect(campaignCard.textContent).toContain("$48,352");

    const salesChart = container.querySelector('[data-testid="card-sales-chart"]');
    expect(salesChart).not.toBeNull();

    const geoChart = container.querySelector('[data-testid="card-geography-chart"]');
    expect(geoChart).not.toBeNull();
  });

  it("triggers operational report export when 'Download Reports' button is clicked", async () => {
    const fakeClient = createFakeApiClient();
    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const exportSpy = vi.spyOn(reportExporter, "downloadOperationalReport");

    const downloadBtn = container.querySelector('[data-testid="download-reports-btn"]');
    expect(downloadBtn).not.toBeNull();
    downloadBtn.click();

    expect(exportSpy).toHaveBeenCalled();
    exportSpy.mockRestore();
  });

  it("renders accessible error fallback and handles retry", async () => {
    let attempts = 0;
    const clientWithRetry = {
      async getDashboardSummary() {
        attempts++;
        if (attempts === 1) {
          throw new Error("Failed to reach dashboard API");
        }
        return {
          summary: {
            invoicedRevenue: { total: 100, count: 1 },
            transactionVolume: { total: 50, count: 1 },
            activeContacts: 2,
            teamMembers: 2,
            ratios: { emails: 0.75, sales: 0.5, clients: 0.3, traffic: 0.8 },
          },
          recentTransactions: [],
          charts: {},
        };
      },
    };

    view = new DashboardView({ apiClient: clientWithRetry });
    view.mount(container);

    await view.fetchPromise;

    const errorEl = container.querySelector('[data-testid="dashboard-error"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent).toContain("Failed to reach dashboard API");

    const retryBtn = container.querySelector("#retry-dashboard-btn");
    expect(retryBtn).not.toBeNull();
    retryBtn.click();

    await view.fetchPromise;

    expect(container.querySelector('[data-testid="statbox-emails"]')).not.toBeNull();
    expect(attempts).toBe(2);
  });

  it("cleans up resources and unmounts DOM element cleanly", () => {
    const fakeClient = createFakeApiClient();
    view = new DashboardView({ apiClient: fakeClient });
    view.mount(container);

    expect(container.querySelector(".dashboard-scene")).not.toBeNull();

    view.unmount();
    expect(container.querySelector(".dashboard-scene")).toBeNull();
  });
});
