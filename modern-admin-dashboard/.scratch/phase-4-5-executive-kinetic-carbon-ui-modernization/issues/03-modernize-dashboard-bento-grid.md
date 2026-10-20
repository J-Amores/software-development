# 03: Modernize Overview Dashboard Bento Grid, KPI StatBoxes, and ChartEngine Seam

**What to build:** Refactor the main dashboard view (`/`) to the 12-column Bento Grid matching the canonical Stitch design. Modernize header telemetry chips and CSV report download. Render Row 1 KPI cards (`EMAILS SENT`, `SALES OBTAINED`, `NEW CLIENTS`, `TRAFFIC RECEIVED`) with live DB metrics, animated SVG radial gauges, Material Symbols, and emerald trend pills. Render Row 2 with an 8-col `Revenue Generated` card (`$59,342.32`, `+18.4% YOY`, series legends, interactive `1D / 7D / 1M / 1Y / ALL` timeframe filters, and live `ChartComponent` line chart) and a 4-col `Recent Transactions` ledger card (`+$200.95` pills, `View All Transactions ➔ /invoices`). Render Row 3 with a 4-col `Campaign` card (`84% TARGET` dual-segment ring), 4-col `Sales Quantity` grouped bar card, and 4-col `Geography Based Traffic` map card with country metrics breakdown table. Bind cursor spotlight on canvas and synchronize the Chart.js palette in `web/src/components/chart/` with Stitch tokens. Update line 67 in `dashboard-view.test.js` to `+8.1%`.

**Blocked by:** 01: Expand Executive Kinetic Carbon Tokens, Typography Fonts, and App Shell Layout, 02: Implement Deep Motion Utility Module and Cross-Route View Transitions.

**Status:** ready-for-agent

- [ ] Refactor `web/src/views/dashboard-view.js` to the 12-column Bento Grid structure matching `code.html` and `screen.png`
- [ ] Render canvas header strip with breadcrumb (`Overview / Dashboard`), `Administrative Dashboard` title, live chips (`data-testid="api-status"` and `data-testid="db-status"`), and working `data-testid="download-reports-btn"`
- [ ] Render Bento Row 1 with 4 KPI cards (`statbox-emails`, `statbox-sales`, `statbox-clients`, `statbox-traffic`) using live DB values, animated SVG radial gauges, Material Symbols, and trend pills (`+14.2%`, `+21.4%`, `+8.1%`, `+43.5%`)
- [ ] Render Bento Row 2 with 8-col `Revenue Generated` card (`data-testid="card-revenue-chart"`) with `$59,342.32`, `+18.4% YOY` badge, series legends, interactive `1D / 7D / 1M / 1Y / ALL` timeframe filter buttons, and live `ChartComponent` line chart
- [ ] Render Bento Row 2 with 4-col `Recent Transactions` card (`data-testid="card-recent-transactions"`) with monospace amount pills (`+$200.95`, `data-testid="transaction-row"`) and `View All Transactions ➔` button navigating to `/invoices`
- [ ] Render Bento Row 3 with 4-col `Campaign` card (`data-testid="card-campaign"`) with SVG dual-segment target ring (`84% TARGET`), `$48,352 revenue generated`, and Target/Efficiency footer
- [ ] Render Bento Row 3 with 4-col `Sales Quantity` card (`data-testid="card-sales-chart"`) with `Q3 / Q4` badge and live `ChartComponent` bar chart
- [ ] Render Bento Row 3 with 4-col `Geography Based Traffic` card (`data-testid="card-geography-chart"`) with live `ChartComponent` choropleth map and country percentage breakdown table
- [ ] Bind `bindBentoSpotlight` cursor spotlight to dashboard canvas on mount, tearing down cleanly in `unmount()`
- [ ] Synchronize `web/src/components/chart/index.js` palette to Executive Kinetic Carbon tokens (`#c0c1ff`, `#4edea3`, `#7bd0ff`, `#ffb4ab`, dashed gridlines)
- [ ] Update line 67 in `web/test/dashboard-view.test.js` from `+5%` to `+8.1%` and verify `web/test/dashboard-view.test.js` passes with zero regressions
