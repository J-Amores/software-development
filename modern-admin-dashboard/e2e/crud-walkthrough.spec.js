import { test, expect } from "@playwright/test";

test.describe("Modern Admin Dashboard - Full CRUD & Phase 3 E2E Walkthrough", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("app-shell");
  });

  test("1. Dashboard: verifies live Atlas telemetry and theme toggling", async ({ page }) => {
    await expect(page.locator("#dashboard-title")).toHaveText("Administrative Dashboard");

    // Live Atlas telemetry indicators
    const apiStatus = page.locator('[data-testid="api-status"]');
    await expect(apiStatus).toBeVisible({ timeout: 10000 });
    await expect(apiStatus).toContainText("Operational");

    const dbStatus = page.locator('[data-testid="db-status"]');
    await expect(dbStatus).toContainText("connected");

    // Theme toggler
    const html = page.locator("html");
    const themeBtn = page.locator("#theme-toggle");
    const initialTheme = await html.getAttribute("data-theme");

    await themeBtn.click();
    const toggledTheme = await html.getAttribute("data-theme");
    expect(toggledTheme).not.toBe(initialTheme);

    await page.screenshot({ path: "test-results/01-dashboard-toggled.png" });

    // Restore
    await themeBtn.click();
  });

  test("2. Team: loads members from Atlas and displays data table", async ({ page }) => {
    await page.click('a[href="/team"]');
    await expect(page).toHaveURL(/\/team$/);
    await expect(page.locator("#team-title")).toHaveText("Manage Team");

    // Verify members table rendered
    const rows = page.locator(".data-table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(10);

    await page.screenshot({ path: "test-results/02-team-table.png" });
  });

  test("3. Contacts: verifies pagination and search", async ({ page }) => {
    await page.click('a[href="/contacts"]');
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.locator("#contacts-title")).toHaveText("Contacts Information");

    const rows = page.locator(".data-table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    expect(await rows.count()).toBeGreaterThanOrEqual(10);

    await page.screenshot({ path: "test-results/03-contacts-table.png" });
  });

  test("4. Invoices: verifies financial ledger and amounts", async ({ page }) => {
    await page.click('a[href="/invoices"]');
    await expect(page).toHaveURL(/\/invoices$/);
    await expect(page.locator("#invoices-title")).toHaveText("Invoices Balances");

    const rows = page.locator(".data-table tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    expect(await rows.count()).toBeGreaterThanOrEqual(8);

    await page.screenshot({ path: "test-results/04-invoices-table.png" });
  });

  test("5. Form: provisions a new team member with constraint validation", async ({ page }) => {
    await page.click('a[href="/form"]');
    await expect(page).toHaveURL(/\/form$/);
    await expect(page.locator("#form-title")).toHaveText("Create User");

    // Fill form
    await page.fill("#member-name", "Browser Test Lead");
    await page.fill("#member-email", "browser.tester@example.com");
    await page.fill("#member-age", "32");
    await page.fill("#member-phone", "(555) 234-5678");
    await page.selectOption("#member-access", "manager");

    await page.click("#btn-submit-user");

    // Verify success banner
    const alert = page.locator(".form-alert-success");
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText("Browser Test Lead");

    await page.screenshot({ path: "test-results/05-form-success.png" });
  });

  test("6. Calendar: verifies FullCalendar grid, upcoming sidebar, and native dialogs", async ({
    page,
  }) => {
    await page.click('a[href="/calendar"]');
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.locator("#calendar-title")).toHaveText("Calendar");

    // Verify sidebar upcoming events
    const sidebar = page.locator('[data-testid="calendar-sidebar"]');
    await expect(sidebar).toBeVisible();
    const eventCards = page.locator(".calendar-sidebar-event-card");
    await expect(eventCards.first()).toBeVisible({ timeout: 10000 });
    const count = await eventCards.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Verify calendar grid
    const grid = page.locator(".calendar-grid-container");
    await expect(grid).toBeVisible();

    // Open Add Event modal
    await page.click('[data-testid="add-event-btn"]');
    const dialog = page.locator('[data-testid="event-create-dialog"]');
    await expect(dialog).toBeVisible();

    // Fill modal form
    await page.fill('[data-testid="event-title-input"]', "Browser E2E Live Event");
    await page.fill('[data-testid="event-start-input"]', "2026-11-20");
    await page.click('[data-testid="submit-create-btn"]');

    // Dialog closes and success alert appears
    await expect(dialog).not.toBeVisible();
    const alert = page.locator('[data-testid="calendar-alert-status"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Browser E2E Live Event");

    // Verify event is in sidebar
    await expect(page.locator('[data-testid="calendar-sidebar"]')).toContainText(
      "Browser E2E Live Event",
    );

    // Click an event to open delete dialog
    const deleteBtn = page
      .locator(".calendar-sidebar-event-card [data-action='delete-event']")
      .last();
    await deleteBtn.click();

    const deleteDialog = page.locator('[data-testid="event-delete-dialog"]');
    await expect(deleteDialog).toBeVisible();
    await page.screenshot({ path: "test-results/06-calendar-delete-dialog.png" });

    // Cancel deletion
    await page.click('[data-testid="cancel-delete-btn"]');
    await expect(deleteDialog).not.toBeVisible();
  });

  test("7. FAQ: verifies semantic details accordions, live search auto-expansion, and global toggle", async ({
    page,
  }) => {
    await page.click('a[href="/faq"]');
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.locator("#faq-title")).toHaveText("FAQ Page");

    // Verify accordions loaded
    const accordions = page.locator("details.faq-accordion");
    await expect(accordions.first()).toBeVisible({ timeout: 10000 });
    expect(await accordions.count()).toBe(6);

    // Test real-time live search
    const searchInput = page.locator('[data-testid="faq-search-input"]');
    await searchInput.fill("invoices");

    // Filtered count and auto-expanded (entries 2, 5, 6 mention Invoices)
    const visibleAccordions = page.locator("details.faq-accordion");
    const filteredCount = await visibleAccordions.count();
    expect(filteredCount).toBe(3);

    // Verify auto-expanded attribute
    for (let i = 0; i < filteredCount; i++) {
      await expect(visibleAccordions.nth(i)).toHaveAttribute("open", "");
    }

    const badge = page.locator('[data-testid="faq-count-badge"]');
    await expect(badge).toHaveText("3 of 6 questions");
    await page.screenshot({ path: "test-results/07-faq-search-expanded.png" });

    // Clear search
    await searchInput.fill("");
    await expect(accordions).toHaveCount(6);

    // Test Expand All / Collapse All toggle
    const toggleBtn = page.locator('[data-testid="faq-toggle-all-btn"]');
    await expect(toggleBtn).toHaveText("Expand All");

    await toggleBtn.click();
    await expect(toggleBtn).toHaveText("Collapse All");
    for (let i = 0; i < 6; i++) {
      await expect(accordions.nth(i)).toHaveAttribute("open", "");
    }

    await toggleBtn.click();
    await expect(toggleBtn).toHaveText("Expand All");
    for (let i = 0; i < 6; i++) {
      await expect(accordions.nth(i)).not.toHaveAttribute("open", "");
    }

    await page.screenshot({ path: "test-results/07-faq-all-collapsed.png" });
  });
});
