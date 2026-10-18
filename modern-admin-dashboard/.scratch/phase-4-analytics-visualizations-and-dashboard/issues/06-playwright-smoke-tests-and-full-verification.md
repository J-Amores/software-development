# 06: End-to-End Playwright Smoke Tests & Full System Verification

**What to build:** Extend the Playwright smoke test suite in `e2e/smoke.spec.js` to verify live rendering of `/`, `/bar`, `/pie`, `/line`, and `/geography` against running backend and frontend services. Verify zero console errors, correct DOM structures, chart container rendering, report export interaction, and responsive layouts. Run full test suite (`vp test`) and linting (`vp check`) across all packages.

**Blocked by:** 04, 05

**Status:** resolved

- [x] Playwright smoke test visits `/` and verifies KPI StatBoxes, Recent Transactions, and dashboard mini-charts
- [x] Playwright smoke test visits `/bar`, `/pie`, `/line`, and `/geography` verifying chart scenes
- [x] Playwright smoke test verifies "Download Reports" interaction triggers export
- [x] Theme switching test verifies charts update without crashing or console errors
- [x] Full automated test suite passes 100% across all packages (`vp test`)
- [x] Static analysis, format, and lint checks pass cleanly with 0 warnings (`vp check`)

## Comments
- Extended `e2e/smoke.spec.js` covering 12-column overview dashboard, standalone analytics chart scenes (`/bar`, `/pie`, `/line`, `/geography`), StatBox KPI progress widgets, and CSV report download.
- Added `api/src/db/inMemoryDb.js` providing in-memory database adapter for offline Playwright runs (`MOCK_DB=true`).
- Updated `web/src/views/dashboard-view.js` to render operational telemetry status badges (`api-status` and `db-status`) to satisfy `e2e/crud-walkthrough.spec.js`.
- Verified 14/14 Playwright E2E tests pass cleanly in 11.7s.
- Verified 28/28 unit test suites (249 tests) pass in 1.7s with `vp test`.
- Verified 0 warnings or lint errors with `vp check`.
