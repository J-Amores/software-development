# 05: Main Overview Dashboard 12-Column Grid & Client-Side Operational Report Export

**What to build:** Replace the Phase 1 tracer-bullet stub in `web/src/views/DashboardView.js` with the full 12-column responsive CSS Grid operational dashboard. Implement 4 KPI StatBox cards with circular progress rings and percentage badges, Revenue Generated Line Chart card (8 cols), Recent Transactions scrollable feed card (4 cols), Campaign Revenue progress card (4 cols), Sales Quantity Bar Chart card (4 cols), and Geography Based Traffic map card (4 cols). Implement client-side CSV report generation and download (`admin-operational-report-YYYY-MM-DD.csv`) wired to the "Download Reports" header button.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] `DashboardView` renders 12-column responsive CSS Grid with theme token styling
- [ ] Row 1: 4 KPI StatBoxes (Emails Sent/Invoiced Revenue, Sales Obtained/Transaction Volume, New Clients/Active Contacts, Traffic Received/Team Members) with circular progress rings (`--progress` / SVG offset) and increase badges
- [ ] Row 2: Revenue Generated multi-series Line Chart (8 cols) and Recent Transactions scrollable list (4 cols) with sticky headers and formatted transaction rows
- [ ] Row 3: Campaign Revenue card (4 cols), Sales Quantity Bar Chart (4 cols), and Geography Based Traffic map (4 cols)
- [ ] Responsive media queries collapse 12-column grid to single-column card stacks below 992px
- [ ] "Download Reports" header button generates and triggers client-side download of `admin-operational-report-YYYY-MM-DD.csv` bundling KPI summary and itemized transactions
- [ ] Unit tests in `web/test/dashboard-view.test.js` verify grid layout, data binding, report generation download trigger, and unmount cleanup
- [ ] `vp test` and `vp check` pass cleanly

## Comments
