# 06: End-to-End Playwright Smoke Test

**What to build:** An automated end-to-end browser smoke test verifying the integrated walking skeleton across all layers: app shell rendering, theme toggling, client-side route transitions, and live backend database health display.

**Blocked by:** 05: Vertical Tracer-Bullet Health Check and API Client Seam

**Status:** resolved

- [x] End-to-end browser testing suite is configured and executable through unified workspace tasks
- [x] Automated smoke test launches the web application in a headless browser and validates proper app shell structure
- [x] Automated smoke test interacts with the theme toggle, verifying root theme attribute changes and visual styling transitions
- [x] Automated smoke test clicks sidebar navigation links, verifying client-side routing, URL updates, and placeholder stub rendering
- [x] Automated smoke test confirms that the dashboard successfully requests, receives, and displays live database health status from the backend API
- [x] Complete end-to-end test executes cleanly and passes against live local services

## Comments

### Implementation Details
- **Playwright Configuration (`playwright.config.js`)**: Configured headless Chromium testing with automated orchestrator `webServer` managing both the Fastify backend API (port 8080) and the Vite frontend dev server (port 5173).
- **Workspace Integration (`package.json`)**: Added unified `test:e2e` task (`pnpm test:e2e`).
- **Comprehensive Smoke Suite (`e2e/smoke.spec.js`)**:
  1. Validates Light DOM app shell composition, brand header (`ADMIN OPS`), and operator identity (`System Operator - Administrator`).
  2. Verifies instant dark/light visual theme toggling on `<html data-theme>`.
  3. Tests sidebar collapse and expand interactions (`.sidebar-container.collapsed`).
  4. Tests deep client-side routing across placeholder scene stubs (`/team`, `/contacts`, `/invoices`, `/`) with URL updates and breadcrumb validation.
  5. Verifies live vertical tracer-bullet telemetry response from backend API `/api/v1/health` with database status, latency, and environment indicators.
- **Verification**: 5/5 Playwright tests passing in 1.8s; 37/37 Vitest tests passing in 345ms; 100% formatted with 0 lint warnings via `vp check`.
