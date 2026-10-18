# 06: End-to-End Playwright Smoke Tests & Full System Verification

**What to build:** Extend the Playwright smoke test suite in `e2e/smoke.spec.js` to verify live rendering of `/`, `/bar`, `/pie`, `/line`, and `/geography` against running backend and frontend services. Verify zero console errors, correct DOM structures, chart container rendering, report export interaction, and responsive layouts. Run full test suite (`vp test`) and linting (`vp check`) across all packages.

**Blocked by:** 04, 05

**Status:** ready-for-agent

- [ ] Playwright smoke test visits `/` and verifies KPI StatBoxes, Recent Transactions, and dashboard mini-charts
- [ ] Playwright smoke test visits `/bar`, `/pie`, `/line`, and `/geography` verifying chart scenes
- [ ] Playwright smoke test verifies "Download Reports" interaction triggers export
- [ ] Theme switching test verifies charts update without crashing or console errors
- [ ] Full automated test suite passes 100% across all packages (`vp test`)
- [ ] Static analysis, format, and lint checks pass cleanly with 0 warnings (`vp check`)

## Comments
