import { test, expect } from "@playwright/test";

test.describe("Modern Admin Dashboard - Full E2E Smoke Suite (Phases 1-4)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto("/");
    // Wait for the app-shell custom element to be rendered
    await page.waitForSelector("app-shell");
  });

  test("validates app shell layout structure and operator identity", async ({ page }) => {
    const shell = page.locator("app-shell");
    await expect(shell).toBeVisible();

    const topbar = page.locator("app-topbar");
    await expect(topbar).toBeVisible();

    const sidebar = page.locator("app-sidebar");
    await expect(sidebar).toBeVisible();

    // Verify operator profile details
    await expect(page.locator(".operator-name")).toHaveText("System Operator");
    await expect(page.locator(".operator-role")).toHaveText("Administrator");

    // Verify brand header
    await expect(page.locator(".sidebar-brand")).toHaveText("ADMIN OPS");
  });

  test("toggles visual theme between dark and light modes with persistent attribute updates", async ({
    page,
  }) => {
    const html = page.locator("html");
    const themeToggleBtn = page.locator("#theme-toggle");

    const initialTheme = await html.getAttribute("data-theme");
    expect(["dark", "light"]).toContain(initialTheme);

    // Toggle theme
    await themeToggleBtn.click();
    const toggledTheme = await html.getAttribute("data-theme");
    expect(toggledTheme).not.toBe(initialTheme);

    // Toggle back
    await themeToggleBtn.click();
    const restoredTheme = await html.getAttribute("data-theme");
    expect(restoredTheme).toBe(initialTheme);
  });

  test("collapses and expands the navigation sidebar", async ({ page }) => {
    const sidebarContainer = page.locator(".sidebar-container");
    const sidebarToggleBtn = page.locator("#sidebar-toggle");

    await expect(sidebarContainer).not.toHaveClass(/collapsed/);

    await sidebarToggleBtn.click();
    await expect(sidebarContainer).toHaveClass(/collapsed/);

    await sidebarToggleBtn.click();
    await expect(sidebarContainer).not.toHaveClass(/collapsed/);
  });

  test("navigates all routes client-side without full page reload and renders live views", async ({
    page,
  }) => {
    // 1. Manage Team
    await page.click('a[href="/team"]');
    await expect(page).toHaveURL(/\/team$/);
    await expect(page.locator("#team-title")).toHaveText("Manage Team");

    // 2. Contacts Information
    await page.click('a[href="/contacts"]');
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.locator("#contacts-title")).toHaveText("Contacts Information");

    // 3. Invoices Balances
    await page.click('a[href="/invoices"]');
    await expect(page).toHaveURL(/\/invoices$/);
    await expect(page.locator("#invoices-title")).toHaveText("Invoices Balances");

    // 4. Calendar
    await page.click('a[href="/calendar"]');
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.locator("#calendar-title")).toHaveText("Calendar");

    // 5. FAQ Page
    await page.click('a[href="/faq"]');
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.locator("#faq-title")).toHaveText("FAQ Page");

    // 6. Bar Chart
    await page.click('a[href="/bar"]');
    await expect(page).toHaveURL(/\/bar$/);
    await expect(page.locator("#bar-title")).toHaveText("Bar Chart");

    // 7. Pie Chart
    await page.click('a[href="/pie"]');
    await expect(page).toHaveURL(/\/pie$/);
    await expect(page.locator("#pie-title")).toHaveText("Pie Chart");

    // 8. Line Chart
    await page.click('a[href="/line"]');
    await expect(page).toHaveURL(/\/line$/);
    await expect(page.locator("#line-title")).toHaveText("Line Chart");

    // 9. Geography Chart
    await page.click('a[href="/geography"]');
    await expect(page).toHaveURL(/\/geography$/);
    await expect(page.locator("#geography-title")).toHaveText("Geography Chart");

    // 10. Return to Overview Dashboard
    await page.click('a[href="/"]');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#dashboard-title")).toHaveText("Administrative Dashboard");
  });

  test("renders 12-column overview dashboard with StatBoxes, charts, and recent transactions", async ({
    page,
  }) => {
    await expect(page.locator("#dashboard-title")).toHaveText("Administrative Dashboard");

    // 4 KPI StatBoxes
    await expect(page.locator('[data-testid="statbox-emails"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="statbox-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="statbox-clients"]')).toBeVisible();
    await expect(page.locator('[data-testid="statbox-traffic"]')).toBeVisible();

    // Row 2: Revenue Line Chart & Recent Transactions
    await expect(page.locator('[data-testid="card-revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-recent-transactions"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-row"]').first()).toBeVisible();

    // Row 3: Campaign, Sales Bar, Geography Map
    await expect(page.locator('[data-testid="card-campaign"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-sales-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-geography-chart"]')).toBeVisible();

    // Verify Download Reports button is visible and active
    const downloadBtn = page.locator('[data-testid="download-reports-btn"]');
    await expect(downloadBtn).toBeVisible();
  });

  test("triggers operational report CSV download on button click", async ({ page }) => {
    await expect(page.locator('[data-testid="statbox-emails"]')).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent("download");
    await page.click('[data-testid="download-reports-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("admin-operational-report-");
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("renders standalone analytics scenes directly (/bar, /pie, /line, /geography)", async ({
    page,
  }) => {
    // Direct navigate to /bar
    await page.goto("/bar");
    await expect(page.locator("#bar-title")).toHaveText("Bar Chart");
    await expect(page.locator('[data-testid="chart-component"]')).toBeVisible({ timeout: 10000 });

    // Direct navigate to /pie
    await page.goto("/pie");
    await expect(page.locator("#pie-title")).toHaveText("Pie Chart");
    await expect(page.locator('[data-testid="chart-component"]')).toBeVisible({ timeout: 10000 });

    // Direct navigate to /line
    await page.goto("/line");
    await expect(page.locator("#line-title")).toHaveText("Line Chart");
    await expect(page.locator('[data-testid="chart-component"]')).toBeVisible({ timeout: 10000 });

    // Direct navigate to /geography
    await page.goto("/geography");
    await expect(page.locator("#geography-title")).toHaveText("Geography Chart");
    await expect(page.locator('[data-testid="chart-component"]')).toBeVisible({ timeout: 10000 });
  });
});
