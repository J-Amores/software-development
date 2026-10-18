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
      command: "HOST=127.0.0.1 MOCK_DB=true node api/src/server.js",
      url: "http://127.0.0.1:8080/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "vp dev web --host 127.0.0.1 --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
