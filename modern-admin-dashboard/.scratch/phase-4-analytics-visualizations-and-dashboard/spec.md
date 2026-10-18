# Specification: Phase 4 — Analytics Visualizations & Main Dashboard Overview

**Status**: ready-for-agent

## Problem Statement

Operators and administrators currently encounter placeholder stub views across all analytics routes—Bar Chart (`/bar`), Pie Chart (`/pie`), Line Chart (`/line`), and Geography Chart (`/geography`)—and a minimal Phase 1 tracer-bullet diagnostic card on the primary administrative overview (`/`). The legacy dashboard relied heavily on React chart libraries (`@nivo/*`) tightly coupled to React virtual DOM lifecycles, and lacked a unified operational dashboard capable of presenting aggregated business metrics, real-time transaction telemetry, interactive circular progress indicators, and an exportable operational report.

Furthermore, the backend lacks endpoints for querying isolated analytics metric series, recent financial transactions, and composite dashboard key performance indicators. The frontend lacks a zero-framework, framework-agnostic chart engine deep module that integrates cleanly with our CSS custom property design system and responds dynamically to dark and light theme switching while executing deterministically in headless automated test environments.

## Solution

Deliver the complete operational analytics visualization suite and composite administrative overview dashboard using standard web technologies, Fastify, the native MongoDB driver, and an encapsulated plug-in chart engine:

1. **Database Persistence & Seeding**: Verify and extend the MongoDB Atlas database seeding routines to idempotently populate the `transactions` collection with itemized commercial transaction records and the `metrics` collection with partitioned analytics datasets (`bar`, `pie`, `line`, `geography`).
2. **Backend Fastify REST API**: Expose REST endpoints with strict JSON Schema validation:
   - `GET /api/v1/metrics/:dataset` for querying isolated analytics datasets (`bar`, `pie`, `line`, `geography`).
   - `GET /api/v1/transactions` for querying recent commercial transactions sorted chronologically.
   - `GET /api/v1/dashboard` composite endpoint aggregating live collection counts and financial sums (`invoices`, `transactions`, `contacts`, `members`), recent transaction activity, and embedded chart data in a single roundtrip.
3. **Encapsulated Deep Chart Module**: Encapsulate vanilla Chart.js, Choropleth Geo plugins, and TopoJSON client utilities inside a single custom deep module exposing a minimal DOM lifecycle interface (`mount`, `update`, `unmount`). Synchronize chart palettes, grid lines, and tooltips directly with `ThemeManager` CSS custom properties, and provide an accessible, semantic HTML fallback when running under headless DOM testing environments lacking Canvas 2D contexts.
4. **Decoupled Geospatial Topology**: Decouple static world map polygon topology from the database layer by bundling GeoJSON geometries as a client asset, joining them dynamically with country engagement metrics retrieved from the API.
5. **Standalone Analytics Views**: Replace placeholder stubs on `/bar`, `/pie`, `/line`, and `/geography` with dedicated, responsive visualization scenes providing interactive legends, category filtering, and accessible summaries.
6. **Main Administrative Overview Dashboard (`/`)**: Replace the Phase 1 tracer bullet with a responsive 12-column CSS Grid operational dashboard:
   - **Row 1**: 4 KPI StatBox cards featuring pure CSS `conic-gradient()` / SVG circular progress rings and percentage badges.
   - **Row 2**: Revenue Generated multi-series Line Chart (8 columns) paired with a scrollable Recent Transactions feed (4 columns).
   - **Row 3**: Campaign Revenue progress card (4 columns), Sales Quantity Bar Chart (4 columns), and Geography Based Traffic map (4 columns).
7. **Operational Report Export**: Wire the "Download Reports" header action to compile and trigger a direct browser download of a client-side formatted CSV report (`admin-operational-report-YYYY-MM-DD.csv`) bundling top-level KPI metrics and recent transaction records.
8. **Deterministic Testing**: Verify all backend endpoints through Fastify `.inject()`, all frontend components and views through the injectable `ApiClient` and canvas fallback seams in `vp test`, and end-to-end functionality via Playwright.

## User Stories

1. As an Operator, I want the system database to idempotently seed commercial Transaction records and partitioned Campaign Metric datasets, so that local development and deployment environments start with predictable analytics data.
2. As an Operator, I want commercial Transactions in the database to record unique transaction codes (`txId`), payer usernames (`user`), ISO-8601 timestamps (`date`), and settled monetary amounts (`amount`), so that financial activities are tracked accurately.
3. As an Operator, I want partitioned Campaign Metric datasets for bar, pie, line, and geography visualizations to be indexed by a unique metric key, so that analytics queries execute efficiently without full collection scans.
4. As an Operator, I want to query `GET /api/v1/metrics/:dataset` to retrieve specific visualization payloads, receiving 400 Bad Request if an unsupported dataset key is requested.
5. As an Operator, I want to query `GET /api/v1/transactions` to retrieve recent financial settlements sorted chronologically with an optional query limit, so that the latest commercial activity is immediately accessible.
6. As an Operator, I want to query `GET /api/v1/dashboard` to receive a composite operational payload containing live KPI counts, recent transactions, and chart datasets in a single request, so that the overview page renders with minimal latency and zero waterfall requests.
7. As an Operator, I want the composite dashboard endpoint to calculate live summary values directly from the database—including total invoice revenue, total transaction settlements, active contacts count, and team members count—so that top-level statistics reflect real database state.
8. As an Operator, I want chart rendering to be encapsulated inside a deep module that hides underlying third-party visualization libraries behind a clean DOM lifecycle interface (`mount`, `update`, `unmount`), so that views remain decoupled from visualization implementation details.
9. As an Operator, I want the chart module to synchronize with the application theme, so that switching between dark and light modes dynamically updates axis labels, legends, tooltips, and grid lines without manual page reloads.
10. As an Operator, I want charts to render an accessible semantic HTML fallback when running under automated headless test environments lacking Canvas 2D contexts, so that test suites execute deterministically without native canvas dependencies.
11. As an Operator, I want to navigate to `/bar` and view an interactive Bar Chart comparing department metrics across food category distributions, complete with interactive hover tooltips and colored series indicators.
12. As an Operator, I want to navigate to `/pie` and view an interactive Pie/Doughnut Chart displaying operational expenditure and category allocations with proportional slice angles and category legends.
13. As an Operator, I want to navigate to `/line` and view a multi-series Line Chart tracking longitudinal revenue and performance trends across different regional series with visible data points and grid lines.
14. As an Operator, I want to navigate to `/geography` and view an interactive Choropleth World Map displaying geospatial client distribution and commercial engagement across sovereign nations.
15. As an Operator, I want the geography visualization to merge static client-side map topology with dynamic server metrics, so that heavy polygon coordinate data does not burden API network payloads.
16. As an Operator, I want each standalone chart scene to include breadcrumb navigation, descriptive titles, and explanatory subtitles consistent with the overall application design system.
17. As an Operator, I want to navigate to `/` and view a 12-column operational overview dashboard displaying high-priority telemetry and administrative summaries at a glance.
18. As an Operator, I want the top row of the dashboard to display 4 KPI StatBox cards (Emails Sent / Invoiced Revenue, Sales Obtained / Transaction Volume, New Clients / Active Contacts, and Traffic Received / Active Team Members).
19. As an Operator, I want each StatBox card to feature an icon, a primary quantified value, a descriptive label, a circular progress ring visualizing quota attainment, and an increase percentage badge.
20. As an Operator, I want the second row of the dashboard to feature a multi-series Revenue Generated Line Chart spanning 8 grid columns, displaying historical revenue trends.
21. As an Operator, I want the second row of the dashboard to feature a Recent Transactions feed spanning 4 grid columns, displaying the latest financial exchanges with transaction IDs, usernames, formatted dates, and monetary amount badges.
22. As an Operator, I want the Recent Transactions container to support internal vertical scrolling with sticky header labeling, so that operators can review recent activity without distorting the grid height.
23. As an Operator, I want the third row of the dashboard to display a Campaign Revenue progress card spanning 4 grid columns, illustrating total revenue generated, target quota progress, and miscellaneous cost deductions.
24. As an Operator, I want the third row of the dashboard to display a compact Sales Quantity Bar Chart spanning 4 grid columns, visualizing comparative sales metrics across administrative departments.
25. As an Operator, I want the third row of the dashboard to display a compact Geography Based Traffic map spanning 4 grid columns, illustrating global regional traffic distribution.
26. As an Operator, I want to click the "Download Reports" button in the dashboard header to immediately generate and download a structured CSV Operational Report (`admin-operational-report-YYYY-MM-DD.csv`), so that administrative summaries can be audited offline.
27. As an Operator, I want the exported Operational Report to include a top-level KPI summary section followed by an itemized table of recent transactions with clear column headers.
28. As an Operator, I want the dashboard and analytics scenes to collapse gracefully into single-column responsive stacks on mobile and tablet viewport widths, so that operational monitoring is accessible across all device sizes.
29. As an Operator, I want all frontend views to communicate with the backend through an injectable API client seam, so that every view can be validated offline in automated unit tests.
30. As an Operator, I want an end-to-end Playwright smoke test to verify live data rendering across `/`, `/bar`, `/pie`, `/line`, and `/geography`, ensuring zero regressions across all operational routes.

## Implementation Decisions

### Domain & Business Model Alignment
- **Glossary Alignment**: The business vocabulary strictly follows [GLOSSARY.md](file:///Users/jamores/Documents/[02]%20Work/[01]%20Github-Repo/software-development/modern-admin-dashboard/GLOSSARY.md). Quantified performance indicators are **Campaign Metrics**, recorded financial settlements are **Transactions**, itemized billing documents are **Invoices**, external business partners are **Contacts**, internal collaborators are **Team Members**, and downloadable administrative summaries are **Operational Reports**.
- **Canonical Transaction Entity**: Commercial transactions standardize on `{ txId, user, date, amount }`. Here `txId` is a unique alphanumeric transaction identifier, `user` is the operator or customer handle, `date` is an ISO-8601 timestamp string, and `amount` is a floating-point number representing settled monetary value.
- **Canonical Metrics Entity**: Stored as partitioned documents `{ metricKey, data }` where `metricKey` is one of `bar`, `pie`, `line`, or `geography`, and `data` contains the canonical visualization series structure.

### Database Architecture & Idempotent Seeding
- **Collections**: MongoDB persistence utilizes dedicated `transactions` and `metrics` collections alongside existing collections (`members`, `contacts`, `invoices`, `events`, `faqs`, `counters`).
- **Unique Indexes**: Ensure unique indexing on `txId` for transactions (`idx_transactions_txid_unique`) and `metricKey` for metrics (`idx_metrics_key_unique`) via the index management module.
- **Idempotent Seeder**: The database seeder script builds required indexes prior to executing `bulkWrite` upserts (`updateOne({ txId }, { $set: doc }, { upsert: true })` and `updateOne({ metricKey }, { $set: doc }, { upsert: true })`).

### Backend Fastify REST API
- **Endpoint Structure**:
  - `GET /api/v1/metrics/:dataset`: Query a specific metric series by dataset parameter (`bar`, `pie`, `line`, `geography`). Validates `dataset` parameter against an allowed enum schema; returns 400 Bad Request on invalid keys and 404 Not Found if missing.
  - `GET /api/v1/transactions`: Query recent transactions sorted descending by timestamp. Supports an optional `limit` query parameter (default 10, integer between 1 and 50).
  - `GET /api/v1/dashboard`: Composite overview endpoint returning:
    - `summary`: Object containing live aggregate metrics:
      - `invoicedRevenue`: Total sum of invoice amounts and invoice count.
      - `transactionVolume`: Total sum of settled transaction amounts and transaction count.
      - `activeContacts`: Total count of contact records.
      - `teamMembers`: Total count of team members.
      - `ratios`: Calculated attainment percentages for KPI circular progress rings.
    - `recentTransactions`: Array of the latest transaction records.
    - `charts`: Embedded visualization payloads for the dashboard mini-charts (revenue line, sales quantity bar, geography traffic).
- **Validation**: Enforce Fastify native JSON Schema validation on all parameters, query strings, and response payloads.
- **Database Adapter Injection**: Route handlers query collections strictly through the injected database adapter instance, supporting in-memory testing with Fastify `app.inject()`.

### Frontend Deep Modules & View Architecture
- **Framework-Agnostic Chart Engine ([ADR 0005](file:///Users/jamores/Documents/[02]%20Work/[01]%20Github-Repo/software-development/modern-admin-dashboard/docs/adr/0005-framework-agnostic-chart-engine-encapsulation.md))**:
  - Encapsulate `chart.js`, `chartjs-chart-geo`, and `topojson-client` inside `web/src/components/chart/`.
  - Expose a minimal public interface: `mount(container, { type, data, options, isDashboard })`, `update(data, options)`, and `unmount()`.
  - View components and tests never import `chart.js` or `chartjs-chart-geo` directly.
  - The module subscribes directly to `themeManager` to read CSS custom properties from `tokens.css` (`--text-secondary`, `--border-color`, `--color-primary`, `--bg-card`, `--color-accent`), dynamically updating axis lines, grids, tooltips, and legends upon theme change events.
  - In headless DOM environments lacking Canvas 2D contexts (`happy-dom`), the component automatically degrades to rendering semantic DOM elements with `role="img"`, `aria-label`, data attributes (`data-chart-type`, `data-chart-dataset`), and accessible series summaries.
- **Geospatial Map Data Handling**:
  - World country polygon features (`geoFeatures`) are bundled or statically loaded in the client as a topological asset module.
  - Country metric values fetched from `GET /api/v1/metrics/geography` (`[{ id: 'AFG', value: 520600 }, ...]`) are merged with `geoFeatures` geometries inside the deep chart module during chart configuration.
- **Standalone Analytics Views**:
  - Implement `BarView` (`/bar`), `PieView` (`/pie`), `LineView` (`/line`), and `GeographyView` (`/geography`) adhering to the standard view lifecycle seam (`mount`, `unmount`).
  - Each view fetches its respective metric dataset via the injected `ApiClient`, renders breadcrumb headers, and mounts the encapsulated chart module inside a responsive card container.
- **Main Administrative Overview Dashboard (`/`)**:
  - Replace the Phase 1 diagnostic card with the complete 12-column responsive CSS Grid dashboard layout.
  - **Row 1 (KPI StatBoxes)**: 4 cards laid out evenly (3 columns each on desktop, responsive wrap on smaller screens). Each card renders an icon, quantified value, subtitle, circular progress ring driven by CSS custom property `--progress` (or inline SVG circle `stroke-dashoffset`), and percentage increase badge.
  - **Row 2**: Revenue Generated Line Chart card spanning 8 columns, paired with a Recent Transactions list card spanning 4 columns with a scrollable list container and individual transaction rows.
  - **Row 3**: Campaign Revenue progress card (4 columns), Sales Quantity Bar Chart card (4 columns), and Geography Based Traffic map card (4 columns).
  - Header features scene title, subtitle, and an action button: "Download Reports".
- **Client-Side Operational Report Exporter**:
  - Clicking "Download Reports" retrieves the current dashboard summary and recent transactions.
  - Converts data into a formatted CSV string with two structured sections:
    1. Operational KPI Summary metrics (Total Invoiced Revenue, Total Transaction Volume, Active Contacts, Team Members, Export Timestamp).
    2. Itemized Recent Transactions table (Transaction ID, User Handle, Settlement Date, Amount).
  - Triggers an instantaneous browser file download named `admin-operational-report-YYYY-MM-DD.csv` via standard Blob / `URL.createObjectURL` utilities.
- **API Client Adapter Extension**:
  - Extend `createApiClient` with:
    - `getMetrics(dataset)`
    - `getTransactions(params)`
    - `getDashboardSummary()`
  - Extend `createFakeApiClient` with in-memory stores and default mock datasets for metrics, transactions, and composite dashboard summaries.

## Testing Decisions

- **Good Test Criteria**: Tests must verify observable external behavior and public contracts across architectural seams. Tests must never inspect internal third-party library properties, private closure variables, or canvas pixel arrays.
- **Backend API Seam Testing**: Tested via Fastify `app.inject()` without binding network ports. Tests verify:
  - `GET /api/v1/metrics/:dataset` returns 200 with structured data for valid keys (`bar`, `pie`, `line`, `geography`), and returns 400 Bad Request for unsupported dataset keys.
  - `GET /api/v1/transactions` returns 200 with chronological transaction records and respects `limit` query parameters.
  - `GET /api/v1/dashboard` returns 200 with aggregate calculation sums, recent transactions, and chart payloads.
- **Deep Chart Module Testing**: Tested under Vitest and `happy-dom`. Verifies:
  - Correct mounting and unmounting lifecycle transitions.
  - Accessible headless fallback rendering (`role="img"`, `aria-label`, data attributes, series data summary).
  - Theme change subscription and parameter refresh when `themeManager.setTheme()` is invoked.
- **Frontend Views Testing**: Tested under Vitest and `happy-dom` via `createFakeApiClient`. Verifies:
  - `/bar`, `/pie`, `/line`, and `/geography` views invoke `getMetrics`, render breadcrumb headers, and mount chart containers with correct data attributes.
  - `/` Overview Dashboard mounts the 12-column grid, renders 4 StatBox KPI cards with formatted numbers and progress rings, renders recent transaction rows, and mounts the 3 dashboard mini-charts.
  - Clicking "Download Reports" generates the expected CSV formatted blob and triggers download without throwing errors.
  - View unmounting cleanly cleans up DOM elements and listeners without memory leaks.
- **End-to-End Smoke Seam Testing**: Extended Playwright smoke test covering:
  - Navigation to `/` verifies live KPI StatBox cards, recent transactions, and chart containers.
  - Direct navigation to `/bar`, `/pie`, `/line`, and `/geography` verifies live rendering of all visualization scenes.

## Out of Scope

- User mutation or manual creation forms for analytics chart series (metrics represent read-only operational telemetry).
- Server-side PDF generation or external cloud export microservices (client-side CSV generation provides full offline utility).
- WebSocket or Server-Sent Events (SSE) real-time streaming (view transitions and manual page refreshes provide sufficient telemetry updates).
- Additional visualization types outside the 4 canonical charts (Bar, Pie, Line, Choropleth Geography).

## Further Notes

- The deep chart module is shared across both full-height standalone scenes (e.g. 500px canvas height on `/line`) and compact dashboard cards (e.g. 200px canvas height on the Overview dashboard). The `isDashboard` boolean option adjusts legend visibility, margin offsets, and axis label density automatically.
- CSS Grid styles in `tokens.css` and view-specific stylesheets must include responsive media queries collapsing the 12-column layout to single-column card stacks at viewport widths below 992px.
