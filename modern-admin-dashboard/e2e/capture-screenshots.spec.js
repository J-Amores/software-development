import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR =
  "/Users/jamores/.gemini/antigravity/brain/c46a8a06-c0f1-4949-a5b9-ce062f03fb87/screenshots";
const DOCS_DIR = path.resolve(process.cwd(), "docs/screenshots");

// Ensure directories exist
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(DOCS_DIR, { recursive: true });

async function captureScreen(page, filename) {
  // Wait a moment for any render transitions / canvas drawing to settle
  await page.waitForTimeout(600);

  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const docsPath = path.join(DOCS_DIR, filename);

  await page.screenshot({ path: artifactPath, fullPage: false });
  fs.copyFileSync(artifactPath, docsPath);
  console.log(`Captured screenshot: ${filename}`);
}

async function setTheme(page, theme) {
  const currentTheme = await page.locator("html").getAttribute("data-theme");
  if (currentTheme !== theme) {
    await page.click("#theme-toggle");
    await page.waitForTimeout(300);
  }
}

test.describe("Dashboard Screenshot Capture Suite", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  test("Capture screenshots of every screen in dark and light modes", async ({ page }) => {
    test.setTimeout(120000);

    // 1. DASHBOARD
    await page.goto("/");
    await page.waitForSelector("app-shell");
    await expect(page.locator("#dashboard-title")).toHaveText("Administrative Dashboard");
    await expect(page.locator('[data-testid="statbox-emails"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="api-status"]')).toBeVisible({ timeout: 10000 });

    await setTheme(page, "dark");
    await captureScreen(page, "01-dashboard-dark.png");

    await setTheme(page, "light");
    await captureScreen(page, "01-dashboard-light.png");
    await setTheme(page, "dark");

    // 2. MANAGE TEAM
    await page.click('a[href="/team"]');
    await expect(page).toHaveURL(/\/team$/);
    await expect(page.locator("#team-title")).toHaveText("Manage Team");
    await expect(page.locator(".data-table tbody tr").first()).toBeVisible({ timeout: 10000 });

    await captureScreen(page, "02-team-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "02-team-light.png");
    await setTheme(page, "dark");

    // 3. CONTACTS INFORMATION
    await page.click('a[href="/contacts"]');
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.locator("#contacts-title")).toHaveText("Contacts Information");
    await expect(page.locator(".data-table tbody tr").first()).toBeVisible({ timeout: 10000 });

    await captureScreen(page, "03-contacts-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "03-contacts-light.png");
    await setTheme(page, "dark");

    // 4. INVOICES BALANCES
    await page.click('a[href="/invoices"]');
    await expect(page).toHaveURL(/\/invoices$/);
    await expect(page.locator("#invoices-title")).toHaveText("Invoices Balances");
    await expect(page.locator(".data-table tbody tr").first()).toBeVisible({ timeout: 10000 });

    await captureScreen(page, "04-invoices-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "04-invoices-light.png");
    await setTheme(page, "dark");

    // 5. PROFILE FORM
    await page.click('a[href="/form"]');
    await expect(page).toHaveURL(/\/form$/);
    await expect(page.locator("#form-title")).toHaveText("Create User");
    await expect(page.locator("#btn-submit-user")).toBeVisible();

    await captureScreen(page, "05-form-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "05-form-light.png");
    await setTheme(page, "dark");

    // 6. CALENDAR
    await page.click('a[href="/calendar"]');
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.locator("#calendar-title")).toHaveText("Calendar");
    await expect(page.locator(".calendar-grid-container")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".calendar-sidebar-event-card").first()).toBeVisible({
      timeout: 10000,
    });

    await captureScreen(page, "06-calendar-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "06-calendar-light.png");
    await setTheme(page, "dark");

    // Calendar Modal
    await page.click('[data-testid="add-event-btn"]');
    await expect(page.locator('[data-testid="event-create-dialog"]')).toBeVisible();
    await captureScreen(page, "06-calendar-modal-dark.png");
    await page.click('[data-testid="cancel-create-btn"]');
    await expect(page.locator('[data-testid="event-create-dialog"]')).not.toBeVisible();

    // 7. FAQ PAGE
    await page.click('a[href="/faq"]');
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.locator("#faq-title")).toHaveText("FAQ Page");
    await expect(page.locator("details.faq-accordion").first()).toBeVisible({ timeout: 10000 });

    await captureScreen(page, "07-faq-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "07-faq-light.png");
    await setTheme(page, "dark");

    // FAQ Expanded
    await page.click('[data-testid="faq-toggle-all-btn"]');
    await page.waitForTimeout(300);
    await captureScreen(page, "07-faq-expanded-dark.png");

    // 8. BAR CHART
    await page.click('a[href="/bar"]');
    await expect(page).toHaveURL(/\/bar$/);
    await expect(page.locator("#bar-title")).toHaveText("Bar Chart");
    await expect(page.locator('[data-testid="chart-component"] canvas')).toBeVisible({
      timeout: 10000,
    });

    await captureScreen(page, "08-bar-chart-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "08-bar-chart-light.png");
    await setTheme(page, "dark");

    // 9. PIE CHART
    await page.click('a[href="/pie"]');
    await expect(page).toHaveURL(/\/pie$/);
    await expect(page.locator("#pie-title")).toHaveText("Pie Chart");
    await expect(page.locator('[data-testid="chart-component"] canvas')).toBeVisible({
      timeout: 10000,
    });

    await captureScreen(page, "09-pie-chart-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "09-pie-chart-light.png");
    await setTheme(page, "dark");

    // 10. LINE CHART
    await page.click('a[href="/line"]');
    await expect(page).toHaveURL(/\/line$/);
    await expect(page.locator("#line-title")).toHaveText("Line Chart");
    await expect(page.locator('[data-testid="chart-component"] canvas')).toBeVisible({
      timeout: 10000,
    });

    await captureScreen(page, "10-line-chart-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "10-line-chart-light.png");
    await setTheme(page, "dark");

    // 11. GEOGRAPHY CHART
    await page.click('a[href="/geography"]');
    await expect(page).toHaveURL(/\/geography$/);
    await expect(page.locator("#geography-title")).toHaveText("Geography Chart");
    await expect(page.locator('[data-testid="chart-component"] canvas')).toBeVisible({
      timeout: 10000,
    });

    await captureScreen(page, "11-geography-chart-dark.png");
    await setTheme(page, "light");
    await captureScreen(page, "11-geography-chart-light.png");
  });
});
