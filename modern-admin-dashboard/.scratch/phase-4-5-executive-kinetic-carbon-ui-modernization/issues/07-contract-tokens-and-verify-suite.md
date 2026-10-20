# 07: Contract Legacy CSS Tokens, Clean Up Shell Fallbacks, and Run End-to-End Suite Verification

**What to build:** Contract legacy token aliases in `tokens.css` that are no longer referenced by any view or component. Clean up deprecated Archetype 1 styles from `main.css`. Run full suite validation: `npx vp check` (0 formatting/lint warnings), `npx vp test` (all 28+ test files and 250+ unit/integration tests pass), and Playwright E2E smoke tests (`npx playwright test e2e/smoke.spec.js`) to guarantee zero regressions.

**Blocked by:** 03: Modernize Overview Dashboard Bento Grid, KPI StatBoxes, and ChartEngine Seam, 04: Batch Migrate Data Management Views (/team, /contacts, /invoices), 05: Batch Migrate Pages Views (/form, /calendar, /faq), 06: Batch Migrate Standalone Analytics Views (/bar, /pie, /line, /geography).

**Status:** ready-for-agent

- [ ] Audit `web/src/` for legacy token usage and contract unused token aliases in `web/src/styles/tokens.css`
- [ ] Remove obsolete Archetype 1 CSS rules from `web/src/styles/main.css`
- [ ] Run `npx vp check` and verify all source and stylesheet files pass formatting and lint checks with zero errors or warnings
- [ ] Run `npx vp test` and verify all 28+ test files and 250+ unit/integration tests pass deterministically
- [ ] Run `npx playwright test e2e/smoke.spec.js` and verify end-to-end smoke suite passes across layout, theme toggling, routing, dashboard telemetry, and chart scenes
