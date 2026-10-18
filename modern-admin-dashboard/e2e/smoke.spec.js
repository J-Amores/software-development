import { test, expect } from "@playwright/test";

test.describe("Modern Admin Dashboard - Walking Skeleton E2E Smoke Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto("/");
    // Wait for the app-shell custom element to be rendered
    await page.waitForSelector("app-shell");
  });

  test("validates app shell layout structure and operator identity", async ({ page }) => {
    // Verify custom element composition in Light DOM
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

    // Initial theme defaults to dark (or system preference)
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

    // Initially expanded
    await expect(sidebarContainer).not.toHaveClass(/collapsed/);

    // Click collapse
    await sidebarToggleBtn.click();
    await expect(sidebarContainer).toHaveClass(/collapsed/);

    // Click expand
    await sidebarToggleBtn.click();
    await expect(sidebarContainer).not.toHaveClass(/collapsed/);
  });

  test("navigates routes client-side without full page reload and renders live views", async ({
    page,
  }) => {
    // 1. Navigate to Manage Team
    await page.click('a[href="/team"]');
    await expect(page).toHaveURL(/\/team$/);
    await expect(page.locator("#team-title")).toHaveText("Manage Team");

    // 2. Navigate to Contacts Information
    await page.click('a[href="/contacts"]');
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.locator("#contacts-title")).toHaveText("Contacts Information");

    // 3. Navigate to Invoices Balances
    await page.click('a[href="/invoices"]');
    await expect(page).toHaveURL(/\/invoices$/);
    await expect(page.locator("#invoices-title")).toHaveText("Invoices Balances");

    // 4. Navigate to Calendar
    await page.click('a[href="/calendar"]');
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.locator("#calendar-title")).toHaveText("Calendar");

    // 5. Navigate to FAQ Page
    await page.click('a[href="/faq"]');
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.locator("#faq-title")).toHaveText("FAQ Page");

    // 6. Return to Dashboard via link
    await page.click('a[href="/"]');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#dashboard-title")).toHaveText("Administrative Dashboard");
  });

  test("displays live operational telemetry indicators from the backend tracer bullet", async ({
    page,
  }) => {
    // Ensure on dashboard
    await expect(page.locator("#dashboard-title")).toHaveText("Administrative Dashboard");

    // Wait for the tracer-bullet telemetry response
    const apiStatus = page.locator('[data-testid="api-status"]');
    await expect(apiStatus).toBeVisible({ timeout: 10000 });
    await expect(apiStatus).toContainText("Operational");

    const dbLatency = page.locator('[data-testid="db-latency"]');
    await expect(dbLatency).toBeVisible();
    await expect(dbLatency).toContainText("ms");

    const dbStatus = page.locator('[data-testid="db-status"]');
    await expect(dbStatus).toBeVisible();
    await expect(dbStatus).toContainText("connected");

    const envMode = page.locator('[data-testid="env-mode"]');
    await expect(envMode).toBeVisible();
    await expect(envMode).toContainText(/development|test/i);
  });
});
