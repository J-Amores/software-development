import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const DOCS_DIR = path.resolve(process.cwd(), "docs/screenshots");
fs.mkdirSync(DOCS_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
];

test.describe("Stitch Design Audit Gate - Responsive & Overflow Verification", () => {
  for (const vp of VIEWPORTS) {
    test(`Mandatory Viewport Audit: ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForSelector("app-shell");
      await expect(page.locator("#dashboard-title")).toHaveText("Administrative Dashboard");
      await expect(page.locator('[data-testid="statbox-emails"]')).toBeVisible({ timeout: 10000 });

      // Settle animations
      await page.waitForTimeout(600);

      // Check Zero Horizontal Scroll Policy: scrollWidth <= clientWidth
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const docScrollWidth = doc.scrollWidth;
        const docClientWidth = doc.clientWidth;
        const bodyScrollWidth = body.scrollWidth;
        const bodyClientWidth = body.clientWidth;

        const hasOverflow = docScrollWidth > docClientWidth || bodyScrollWidth > bodyClientWidth;
        const culprits = [];

        if (hasOverflow) {
          const all = document.querySelectorAll("*");
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > docClientWidth + 1 || el.scrollWidth > docClientWidth + 1) {
              culprits.push({
                tag: el.tagName,
                id: el.id,
                className: el.className,
                scrollWidth: el.scrollWidth,
                clientWidth: docClientWidth,
                right: rect.right,
              });
            }
          }
        }

        return {
          hasOverflow,
          docScrollWidth,
          docClientWidth,
          bodyScrollWidth,
          bodyClientWidth,
          culprits: culprits.slice(0, 10),
        };
      });

      expect(
        overflow.hasOverflow,
        `Detected horizontal overflow on viewport ${vp.name} (${vp.width}x${vp.height}): doc.scrollWidth (${overflow.docScrollWidth}) > doc.clientWidth (${overflow.docClientWidth}). Culprits: ${JSON.stringify(overflow.culprits)}`,
      ).toBe(false);

      // Capture screenshot
      const shotPath = path.join(DOCS_DIR, `audit-${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      const fullPath = path.join(DOCS_DIR, `audit-${vp.name}-full.png`);
      await page.screenshot({ path: fullPath, fullPage: true });
      console.log(`Saved audit snapshot for ${vp.name}: ${shotPath}`);
    });
  }

  test("Mobile Drawer Toggle Interaction", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForSelector("app-shell");

    // Click mobile toggle
    const toggleBtn = page.locator("#mobile-sidebar-toggle");
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify backdrop active and sidebar open
    const backdrop = page.locator("#sidebar-backdrop");
    await expect(backdrop).toHaveClass(/active/);
    const sidebar = page.locator("app-sidebar");
    await expect(sidebar).toHaveClass(/drawer-open/);

    // Wait for slide-in animation to complete
    await page.waitForTimeout(350);

    // Capture drawer screenshot
    const drawerShotPath = path.join(DOCS_DIR, "audit-mobile-drawer.png");
    await page.screenshot({ path: drawerShotPath });
    console.log(`Saved mobile drawer snapshot: ${drawerShotPath}`);

    // Click backdrop to close
    await backdrop.click({ position: { x: 300, y: 100 } });
    await expect(backdrop).not.toHaveClass(/active/);
    await expect(sidebar).not.toHaveClass(/drawer-open/);
  });
});
