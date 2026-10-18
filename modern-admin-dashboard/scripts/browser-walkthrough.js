import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ARTIFACTS_DIR =
  "/Users/jamores/.gemini/antigravity/brain/3cb81c14-e35e-44b5-bc82-b59c77986b2c";
const BASE_URL = "http://127.0.0.1:5173";

async function run() {
  console.log("Launching headless browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("1. Navigating to Dashboard (Dark Mode)...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="statbox-emails"]', { timeout: 15000 });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1000); // Allow Chart.js animations to complete

  const darkPath = path.join(ARTIFACTS_DIR, "dashboard-overview-dark.png");
  await page.screenshot({ path: darkPath, fullPage: true });
  console.log(`Saved screenshot: ${darkPath}`);

  console.log("2. Testing Download Reports CSV export...");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click('[data-testid="download-reports-btn"]'),
  ]);
  const suggestedFilename = download.suggestedFilename();
  console.log(`CSV Download triggered: ${suggestedFilename}`);
  const csvDownloadPath = path.join(ARTIFACTS_DIR, suggestedFilename);
  await download.saveAs(csvDownloadPath);
  const csvContent = fs.readFileSync(csvDownloadPath, "utf8");
  console.log("CSV Preview (first 5 lines):");
  console.log(csvContent.split("\n").slice(0, 5).join("\n"));

  console.log("3. Toggling Theme to Light Mode...");
  await page.click("#theme-toggle");
  await page.waitForTimeout(800);
  const lightPath = path.join(ARTIFACTS_DIR, "dashboard-overview-light.png");
  await page.screenshot({ path: lightPath, fullPage: true });
  console.log(`Saved screenshot: ${lightPath}`);

  // Switch back to dark mode for analytics views
  await page.click("#theme-toggle");
  await page.waitForTimeout(500);

  const scenes = [
    { route: "/bar", selector: "#bar-title", filename: "chart-bar.png" },
    { route: "/pie", selector: "#pie-title", filename: "chart-pie.png" },
    { route: "/line", selector: "#line-title", filename: "chart-line.png" },
    { route: "/geography", selector: "#geography-title", filename: "chart-geography.png" },
  ];

  for (const scene of scenes) {
    console.log(`Navigating to ${scene.route}...`);
    await page.goto(`${BASE_URL}${scene.route}`, { waitUntil: "networkidle" });
    await page.waitForSelector(scene.selector, { timeout: 15000 });
    await page.waitForSelector("canvas", { timeout: 15000 });
    await page.waitForTimeout(1000); // Allow Chart.js animations to finish

    const scenePath = path.join(ARTIFACTS_DIR, scene.filename);
    await page.screenshot({ path: scenePath });
    console.log(`Saved screenshot: ${scenePath}`);
  }

  await browser.close();
  console.log("Browser walkthrough completed successfully!");
}

run().catch((err) => {
  console.error("Error during walkthrough:", err);
  process.exit(1);
});
