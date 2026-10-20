# Specification: Phase 4.5 — Executive Kinetic Carbon UI Modernization

**Status**: ready-for-agent

## Problem Statement

Following the completion of Phases 1 through 4, the modern admin dashboard has achieved functional completeness across its zero-framework architecture, database persistence, CRUD data management tables, interactive calendar, FAQ accordion, and Chart.js analytics visualizations. However, the visual presentation remains anchored in the austere Phase 1 terminal styling (Archetype 1), which lacks the visual hierarchy, polished depth, and tactile fluidity expected of an executive-grade operational command platform.

Furthermore, the design prototype produced in Google Stitch (`DESIGN.md`, `code.html`, and `screen.png`) demonstrated an **Executive Kinetic Carbon** aesthetic: layered obsidian carbon surfaces, hardware specular card edge highlights, glassmorphic navigation headers, high-contrast light mode slate tiers, tabular JetBrains Mono typography, and responsive micro-interactions. However, the Stitch prototype relied upon the Tailwind CSS CDN runtime (`<script src="https://cdn.tailwindcss.com">`), custom utility classes, and static inline SVGs. Adopting Tailwind runtime or config would violate our zero-framework architecture (ADR 0001), while abandoning our live Chart.js engine for static SVGs would violate ADR 0005.

Finally, the application lacks a zero-dependency motion graphics and micro-interaction layer that provides smooth cross-route view transitions, cursor-tracking specular reflections, and animated telemetry gauges without introducing timer flakiness or asynchronous non-determinism into automated test suites.

## Solution

Modernize the entire user interface to the **Executive Kinetic Carbon** design system through a pure web-standards, zero-framework architecture:

1. **Vanilla CSS Token Architecture**: Translate the complete Executive Kinetic Carbon palette, typography, spacing, and elevation tiers directly into native CSS Custom Properties in `tokens.css` scoped under `html[data-theme="dark"]` and `html[data-theme="light"]`, with strictly zero Tailwind runtime or configuration dependencies.
2. **Typography & Tabular Numerics**: Enforce strict typography stratification: `Inter` for interface prose and navigation labels, paired with `JetBrains Mono` (`font-variant-numeric: tabular-nums` / `font-feature-settings: "tnum" on, "zero" on`) across all KPI readouts, badges, entity IDs, timestamps, and financial data columns.
3. **App Shell Upgrade in Light DOM**: Refactor `<app-sidebar>` (256px fixed) and `<app-topbar>` (64px glassmorphic `backdrop-filter: blur(12px)`) retaining all 11 active routes, with live pulsing `API: 99.98%` status linked to `/api/v1/health`, theme toggling, active center route links, and footer action routing.
4. **Command Palette Route Quick-Jump**: Implement a keyboard-driven `⌘K` / `Ctrl+K` quick-jump search dropdown providing instant fuzzy filtering and keyboard navigation across all 11 application routes.
5. **12-Column Overview Dashboard Bento Grid**: Refactor `/` to match the Stitch canonical layout:
   - Header strip with live `API: Operational` and `DB: Connected` status badges and CSV report download button.
   - Row 1: 4 KPI cards (`EMAILS SENT`, `SALES OBTAINED`, `NEW CLIENTS`, `TRAFFIC RECEIVED`) bound to live database metrics with fallback to Stitch defaults, SVG radial progress gauges, Material Symbols, and emerald trend pills.
   - Row 2: 8-col `Revenue Generated` card featuring live `ChartComponent` instances updated to Stitch tokens, interactive `1D / 7D / 1M / 1Y / ALL` timeframe filters, paired with a 4-col `Recent Transactions` ledger card.
   - Row 3: 4-col `Campaign` performance card (dual-segment radial target ring `84% TARGET`), 4-col `Sales Quantity` grouped bar card, and 4-col `Geography Based Traffic` map card with country metrics breakdown table.
6. **Unified Secondary Views Sweep**: Apply the Executive Kinetic Carbon styling, `.bento-card` hardware specular highlights, and inset form inputs across all remaining views (`/team`, `/contacts`, `/invoices`, `/form`, `/calendar`, `/faq`, `/bar`, `/pie`, `/line`, `/geography`).
7. **Native Motion Graphics & Micro-Interaction Layer**: Encapsulate Web Standards motion helpers (`web/src/utils/motion.js` + `web/src/styles/motion.css`) featuring:
   - A deterministic test and accessibility guardrail (`isMotionReduced()`) resolving all animations synchronously on frame 0 in Vitest and accessibility modes.
   - Cross-route view transitions using `document.startViewTransition` with pinned shell elements.
   - Staggered entry cascade clamped at 8 items (max 280ms duration).
   - Delegated, `requestAnimationFrame`-throttled specular cursor spotlight on `.bento-card` elements with explicit unmount cleanup.
   - Animated SVG radial gauges and CSS `@starting-style` transitions for dialogs and search palette.
8. **Preservation of Testing Seams**: Maintain all DOM IDs, `data-testid` attributes, router interfaces, and view lifecycles so `vp check`, `vp test` (28 files, 249+ tests), and Playwright E2E suites pass with zero regressions.

## User Stories

1. As an Operator, I want the user interface to render using native CSS Custom Properties with zero Tailwind CDN scripts or dependencies, so that our zero-client-side-framework architecture remains pure and lightweight.
2. As an Operator, I want dark mode to utilize deep obsidian carbon surfaces (`#131315`, `#1c1b1d`, `#201f22`, `#2a2a2c`), so that high-density operational telemetry can be monitored for extended periods with minimal eye strain.
3. As an Operator, I want light mode to utilize a crisp alabaster slate contrast tier (`#f8fafc`, `#ffffff`, `#f1f5f9` with subtle hairline borders), so that daylight readability is uncompromised.
4. As an Operator, I want cards to render with hardware specular edge reflections (`box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.07)` and `border-radius: 0.75rem`), so that visual depth mimics precision-engineered developer tools.
5. As an Operator, I want all navigational prose, button text, and headings to render in `Inter`, so that interface navigation is clean, modern, and highly legible.
6. As an Operator, I want all numeric metrics, timestamps, entity IDs, monetary values, and table cells to render in `JetBrains Mono` with `tabular-nums`, so that rapidly updating values maintain rigid vertical column alignment without visual jitter.
7. As an Operator, I want the sidebar to maintain a fixed 256px width with the `ADMIN OPS — Enterprise Suite • v2.4` brand header and custom slim scrollbars, so that workspace navigation is immediately recognizable and accessible.
8. As an Operator, I want the sidebar navigation items to be grouped into 4 uppercase categories (`OVERVIEW`, `DATA MANAGEMENT`, `PAGES`, `CHARTS & ANALYTICS`) with active route left-border indicators, so that hierarchical navigation is intuitive.
9. As an Operator, I want all 11 existing application route links to remain active in the sidebar, so that no existing application capabilities or navigation paths are broken.
10. As an Operator, I want the sidebar footer cluster to include functional actions for `Deploy Node` (navigating to `/form`), `Settings` (opening a preferences modal), and `Documentation` (navigating to `/faq`), so that there are zero dead links in the shell.
11. As an Operator, I want the top navigation bar to be sticky with glassmorphic backdrop blur (`backdrop-filter: blur(12px)`), so that navigation controls remain accessible while scrolling content.
12. As an Operator, I want the topbar to include a live pulsing `API: 99.98%` status pill wired to the backend `/api/v1/health` endpoint, so that operational system health is constantly visible.
13. As an Operator, I want the topbar to feature center context navigation links (`Overview`, `Telemetry`, `Nodes`, `Audit Logs`) with active route highlighting, so that primary operational domains can be accessed with a single click.
14. As an Operator, I want the topbar to include a `+ Create Resource` action button navigating directly to `/form`, so that new Team Members can be provisioned rapidly from any view.
15. As an Operator, I want pressing `⌘K` or `Ctrl+K` from anywhere in the application to instantly focus the global search input, so that keyboard-first ergonomics are supported.
16. As an Operator, I want typing into the global search bar to present an instant route quick-jump command palette that filters across all 11 views, enabling `Enter` navigation and `Escape` dismissal.
17. As an Operator, I want to navigate to the overview dashboard (`/`) and view a responsive 12-column Bento Grid organizing high-priority operational telemetry into structured card tiles.
18. As an Operator, I want the dashboard header to present live `API: Operational` and `DB: Connected` status badges alongside a working `Download Reports` button that exports an itemized CSV operational report.
19. As an Operator, I want Bento Row 1 to feature 4 KPI cards (`EMAILS SENT`, `SALES OBTAINED`, `NEW CLIENTS`, `TRAFFIC RECEIVED`) displaying live database metrics with fallback to Stitch defaults, SVG radial progress gauges, Material Symbols icons, and emerald trend badges (`+14.2%`, `+21.4%`, `+8.1%`, `+43.5%`).
20. As an Operator, I want Bento Row 2 to feature an 8-column `Revenue Generated` card displaying `$59,342.32`, a `+18.4% YOY` badge, series legend indicators (`ARR`, `MRR`, `Expansion`), interactive `1D / 7D / 1M / 1Y / ALL` timeframe filter buttons, and a live Chart.js multi-series Line Chart.
21. As an Operator, I want clicking the timeframe filter buttons on the Revenue Generated card to toggle the active visual pill and smoothly morph the Chart.js line dataset without page reload.
22. As an Operator, I want Bento Row 2 to feature a 4-column `Recent Transactions` ledger card displaying chronological financial settlements with monospace amount pills (`+$200.95`) and a functional `View All Transactions ➔` button navigating to `/invoices`.
23. As an Operator, I want Bento Row 3 to feature a 4-column `Campaign` card displaying an SVG dual-segment radial progress ring (`84% TARGET`), `$48,352 revenue generated`, and a Target/Efficiency footer summary.
24. As an Operator, I want Bento Row 3 to feature a 4-column `Sales Quantity` card with a `Q3 / Q4` badge and a live Chart.js grouped bar chart comparing departmental sales metrics.
25. As an Operator, I want Bento Row 3 to feature a 4-column `Geography Based Traffic` card displaying a live Chart.js choropleth map, an itemized country percentage breakdown table, and edge node latency telemetry.
26. As an Operator, I want the data management views (`/team`, `/contacts`, `/invoices`) to render inside Executive Kinetic Carbon card surfaces with crisp row dividers, monospace tabular columns, and emerald/indigo status pills.
27. As an Operator, I want the profile provisioning view (`/form`) to render with inset `#09090b` form inputs, crisp focus rings, and clear validation states matching the executive design system.
28. As an Operator, I want the interactive calendar (`/calendar`) and curated FAQ accordion (`/faq`) to adopt Executive Kinetic Carbon card framing, dark calendar cells, and glowing focus borders.
29. As an Operator, I want standalone chart scenes (`/bar`, `/pie`, `/line`, `/geography`) to utilize Stitch's Primary (`#c0c1ff`), Secondary (`#4edea3`), Tertiary (`#7bd0ff`), and Error (`#ffb4ab`) color tokens and dashed `rgba(255,255,255,0.05)` grid lines.
30. As an Operator, I want navigating between routes to trigger smooth cross-route view transitions (`document.startViewTransition`) that cross-fade the view canvas while keeping the topbar and sidebar pinned.
31. As an Operator, I want cards and data table rows to stagger gracefully into view on mount (`translateY(8px) -> 0`, `opacity: 0 -> 1`), with the stagger delay capped at 8 items so large tables remain immediately usable.
32. As an Operator, I want moving my cursor across the dashboard canvas to cast a subtle specular spotlight glow along the borders of the hovered `.bento-card`, providing tactile fluidity.
33. As an Operator, I want radial SVG progress gauges to smoothly animate from zero to their target arc on view mount.
34. As an Operator, I want modal dialogs and the command palette to open with native CSS `@starting-style` entry transitions.
35. As an Operator, I want all animations to immediately bypass and resolve synchronously on frame 0 when `prefers-reduced-motion: reduce` is enabled or when running under automated unit tests, so that test suites remain 100% deterministic with zero timer flakiness.

## Implementation Decisions

### Zero-Framework Vanilla CSS Token Model
- The complete design specification from `DESIGN.md` is translated into native CSS Custom Properties in `web/src/styles/tokens.css`.
- Surfaces are partitioned across semantic levels:
  - Canvas: `--bg-canvas` (`#131315` dark / `#f8fafc` light)
  - Surface Lowest: `--bg-surface-lowest` (`#0e0e10`)
  - Surface Low / Card: `--bg-surface-low` (`#1c1b1d` dark / `#ffffff` light)
  - Surface Container: `--bg-surface` (`#201f22` dark / `#f1f5f9` light)
  - Surface High: `--bg-surface-high` (`#2a2a2c`)
  - Surface Highest: `--bg-surface-highest` (`#353437`)
  - Hairline Borders: `--border-subtle` (`rgba(70, 69, 84, 0.3)`) and `--border-outline` (`#908fa0`)
- Accent Tokens:
  - Primary: `--color-primary` (`#8083ff`), `--color-primary-action` (`#6366f1`), `--color-primary-light` (`#c0c1ff`)
  - Secondary: `--color-secondary` (`#4edea3`), `--color-secondary-dark` (`#10b981`)
  - Tertiary: `--color-tertiary` (`#7bd0ff`)
  - Error: `--color-danger` (`#ef4444`), `--color-error-light` (`#ffb4ab`)
- Backwards Compatibility Aliases: Legacy tokens (`--bg-primary`, `--bg-secondary`, `--bg-card`, `--border-color`, `--color-accent`) are retained as aliases mapping to the new tokens during the expand phase of the refactor.

### Typography & Tabular Numerics
- `web/index.html` loads Google Fonts for `Inter` (400, 500, 600, 700), `JetBrains Mono` (400, 500, 600), and `Material Symbols Outlined`.
- `tokens.css` defines `--font-sans: 'Inter', sans-serif`, `--font-display: 'Inter', sans-serif`, and `--font-mono: 'JetBrains Mono', monospace`.
- Numeric table columns, KPI values, badges, and IDs enforce `font-variant-numeric: tabular-nums` and `font-feature-settings: "tnum" on, "zero" on`.

### App Shell Architecture (`<app-sidebar>` & `<app-topbar>`)
- Built as native Light DOM custom elements (`customElements.define('app-sidebar', AppSidebar)` and `customElements.define('app-topbar', AppTopbar)`).
- **Sidebar**:
  - Fixed width of 256px (`16rem`), styled with `--bg-surface-lowest` and thin custom scrollbars (`::-webkit-scrollbar`).
  - Brand header displaying `ADMIN OPS`, `Enterprise Suite • v2.4`, and `#sidebar-toggle` collapse button.
  - 4 uppercase categories (`OVERVIEW`, `DATA MANAGEMENT`, `PAGES`, `CHARTS & ANALYTICS`) housing all 11 routes with active route left-border indicators (`border-l-2 border-primary bg-surface-container-high`).
  - Footer cluster housing `Deploy Node` (navigates to `/form`), `Settings` (opens preferences dialog), and `Documentation` (navigates to `/faq`).
- **Topbar**:
  - Sticky glassmorphic header (height 64px, `backdrop-filter: blur(12px)`, background `rgba(14, 14, 16, 0.8)`).
  - Quick Search input with `⌘K` badge and keyboard listener on `window` (`(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'`).
  - Center context links (`Overview` ➔ `/`, `Telemetry` ➔ `/line`, `Nodes` ➔ `/geography`, `Audit Logs` ➔ `/invoices`) with active route indicator.
  - Live pulsing status pill (`API: 99.98%`) wired to `apiClient.getHealth()`.
  - Theme toggler (`ThemeManager.toggle()`), `+ Create Resource` button (navigates to `/form`), and `OP` System Operator identity badge.
  - Native `<dialog id="settings-dialog">` modal displaying workspace status and theme selection.

### Command Palette Route Quick-Jump
- Built into `<app-topbar>` without external libraries.
- When search input receives focus or user types, renders a floating dropdown menu (`.search-palette-dropdown`) listing matching routes filtered by title and keywords.
- Supports keyboard navigation: ArrowUp, ArrowDown to highlight, Enter to navigate via Router, Escape to close.

### 12-Column Overview Dashboard (`/`)
- Header strip: Breadcrumb (`Overview / Dashboard`), `Administrative Dashboard` title, live status chips (`data-testid="api-status"` and `data-testid="db-status"`), and working `data-testid="download-reports-btn"`.
- Row 1: 4 KPI StatBoxes (`data-testid="statbox-emails"`, `statbox-sales`, `statbox-clients`, `statbox-traffic`) rendering SVG circular progress gauges, Material Symbols, live metrics from `summary`, and trend pills (`+14.2%`, `+21.4%`, `+8.1%`, `+43.5%`).
- Row 2:
  - 8-col `Revenue Generated` card (`data-testid="card-revenue-chart"`) with `$59,342.32`, `+18.4% YOY`, series legends, interactive `1D / 7D / 1M / 1Y / ALL` timeframe filter buttons, and live `ChartComponent` line chart.
  - 4-col `Recent Transactions` card (`data-testid="card-recent-transactions"`) with scrollable list of recent transaction pills (`+$200.95`, `data-testid="transaction-row"`) and `View All Transactions ➔` button.
- Row 3:
  - 4-col `Campaign` card (`data-testid="card-campaign"`) with SVG dual-segment radial ring (`84% TARGET`), `$48,352 revenue generated`, and Target/Efficiency footer.
  - 4-col `Sales Quantity` card (`data-testid="card-sales-chart"`) with `Q3 / Q4` badge and live `ChartComponent` bar chart.
  - 4-col `Geography Based Traffic` card (`data-testid="card-geography-chart"`) with live `ChartComponent` choropleth map and country percentage breakdown table.

### ChartEngine Encapsulation Synchronization (ADR 0005)
- Preserves the deep encapsulation seam in `web/src/components/chart/index.js`.
- Updates `getThemeColors()` to read Executive Kinetic Carbon tokens:
  - Primary series: `#c0c1ff`
  - Secondary series: `#4edea3`
  - Tertiary series: `#7bd0ff`
  - Error/Warning series: `#ffb4ab`
  - Gridlines: dashed `rgba(255, 255, 255, 0.05)`
  - Background: `#1c1b1d`
- View layers and tests remain completely decoupled from underlying Chart.js instances.

### Native Motion Graphics & Micro-Interaction Layer
- Encapsulated in `web/src/styles/motion.css` and `web/src/utils/motion.js`.
- **Motion Guardrail (`isMotionReduced()`)**:
  ```javascript
  export function isMotionReduced() {
    if (typeof window === "undefined") return true;
    if (import.meta.env?.MODE === "test") return true;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    return false;
  }
  ```
- **Cross-Route View Transitions**:
  `web/src/router/index.js` wraps route swaps in `transitionView(callback)`. If `document.startViewTransition` is available and motion is not reduced, executes via `document.startViewTransition(callback)`. Otherwise, executes `callback()` synchronously.
  CSS sets `app-sidebar { view-transition-name: app-sidebar; }`, `app-topbar { view-transition-name: app-topbar; }`, and `#view-container { view-transition-name: view-canvas; }`.
- **Bento Stagger Cascade (`staggerEnter`)**:
  Applies `animation: staggerIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both` with `--stagger-index` clamped at `Math.min(index, 8) * 35ms` (max 280ms duration).
- **Specular Cursor Spotlight (`bindBentoSpotlight`)**:
  Attaches delegated `pointermove` listener to container, throttled with `requestAnimationFrame`, updating `--mouse-x` and `--mouse-y` strictly on `e.target.closest('.bento-card')`. Returns an explicit unbind function invoked in view `unmount()`.
- **Kinetic Telemetry**:
  Animated SVG radial gauge stroke dash offsets via CSS transitions; `animateNumber(el, target, formatter)` runs a 400ms ease-out loop in browser mode, resolving synchronously in test mode.
- **CSS `@starting-style` Transitions**:
  Native `<dialog>` modals and `.search-palette-dropdown` define `@starting-style` transitions from `opacity: 0; transform: scale(0.97)` to `opacity: 1; transform: scale(1)`.

## Testing Decisions

### Test Philosophy
- Tests verify external behavior, DOM contracts, accessibility landmarks, and data rendering—never internal CSS class names or animation timings.
- The `isMotionReduced()` guardrail ensures all DOM mutations in tests resolve synchronously on frame 0, eliminating any race conditions or fake-timer requirements in Vitest.

### Unit & Integration Test Seams (`vp test`)
- **Unit Test Seam Alignment**: Update line 67 in `web/test/dashboard-view.test.js` from `+5%` to `+8.1%` to match the canonical Stitch KPI trend pill.
- **Router Seam**: `web/test/router.test.js` continues to verify synchronous DOM swap, unmount invocation, and 404 handling.
- **Chart Seam**: `web/test/chart-component.test.js` verifies headless semantic HTML fallback (`role="img"`, `data-testid="chart-summary"`).
- **App Shell Seam**: `web/test/shell.test.js` verifies topbar theme toggle, operator details, and sidebar navigation links.
- **Motion Seam**: New unit test `web/test/motion.test.js` verifies that `isMotionReduced()` returns true in test mode and that `animateNumber`, `staggerEnter`, and `transitionView` execute synchronously without throwing.

### End-to-End Smoke Tests (`playwright test`)
- `e2e/smoke.spec.js` executes against the running application verifying:
  - App shell visibility, brand header `ADMIN OPS`, and operator identity.
  - Dark and light theme toggle with persistent `data-theme` attribute on `<html>`.
  - Sidebar collapse/expand via `#sidebar-toggle`.
  - Client-side navigation across all 11 routes without full page reload.
  - 12-column overview dashboard layout, StatBoxes, and Chart.js cards.
  - Operational report CSV download trigger.

## Out of Scope

- Modifying backend Fastify routes or database collection schemas (Phase 4 completed all necessary API endpoints).
- Introducing build-time Tailwind CLI, PostCSS plugins, or Tailwind CSS CDN scripts.
- Cloudflare Pages and Google Cloud Run deployment configuration (reserved for Phase 5).
- Multi-tenancy or user authentication workflows (reserved for post-deployment).

## Further Notes

- All changes will follow the **expand -> migrate in batches -> contract** wide refactor pattern to ensure every intermediate commit and ticket lands green against `vp check` and `vp test`.
- All design tokens, elevation tiers, and typography values are canonically documented in `/DESIGN.md` and [docs/adr/0006-executive-kinetic-carbon-design-system.md](file:///Users/jamores/Documents/[02]%20Work/[01]%20Github-Repo/software-development/modern-admin-dashboard/docs/adr/0006-executive-kinetic-carbon-design-system.md).
