import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Configuration for the Modern Admin Dashboard walking skeleton.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "MOCK_DB=true node api/src/server.js",
      port: 8080,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "vp dev web --port 5173",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
