# 06: Batch Migrate Standalone Analytics Views (/bar, /pie, /line, /geography)

**What to build:** Modernize the standalone analytics views (`/bar`, `/pie`, `/line`, `/geography`) to the Executive Kinetic Carbon design system. Enclose each visualization inside a `.bento-card` container with header badges, description telemetry, responsive canvas sizing, and theme-synchronized Chart.js palettes (`#c0c1ff`, `#4edea3`, `#7bd0ff`, `#ffb4ab`, dashed gridlines). Verify headless accessible summary fallbacks and unit tests stay 100% green.

**Blocked by:** 01: Expand Executive Kinetic Carbon Tokens, Typography Fonts, and App Shell Layout, 03: Modernize Overview Dashboard Bento Grid, KPI StatBoxes, and ChartEngine Seam.

**Status:** ready-for-agent

- [ ] Modernize `BarView` (`/bar`) enclosing the Chart.js grouped bar chart in a `.bento-card` container with department category badges and responsive canvas wrapper
- [ ] Modernize `PieView` (`/pie`) enclosing the Chart.js doughnut chart in a `.bento-card` container with expenditure breakdown legends and proportional arc colors
- [ ] Modernize `LineView` (`/line`) enclosing the multi-series Chart.js spline line chart in a `.bento-card` container with metric series legend chips and dashed gridlines
- [ ] Modernize `GeographyView` (`/geography`) enclosing the Chart.js choropleth map in a `.bento-card` container with country engagement indicators and edge node telemetry
- [ ] Verify chart color theme synchronization during dark/light mode toggles across all standalone scenes
- [ ] Verify `web/test/bar-view.test.js`, `web/test/pie-view.test.js`, `web/test/line-view.test.js`, and `web/test/geography-view.test.js` pass with zero regressions
