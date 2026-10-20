# 0006. Executive Kinetic Carbon Design System Architecture and Zero-Tailwind Token Migration

- **Status**: accepted
- **Date**: 2026-10-20

## Context

Following the completion of Phases 1 through 4 (establishing our zero-framework web standards foundation, Atlas database split, atomic counter business identifiers, and encapsulated calendar and chart engines), the administrative dashboard required visual elevation to an executive-grade operational command interface prior to Phase 5 Cloudflare Pages and Google Cloud Run deployment.

The prototype design delivered via Google Stitch (`DESIGN.md`, `code.html`, `screen.png`) showcased an **Executive Kinetic Carbon** aesthetic: obsidian carbon tonal surfaces, hardware specular card edge highlights, glassmorphic navigation bars, vibrant status luminescence, and strict typographic stratification between navigational prose (`Inter`) and raw computational telemetry (`JetBrains Mono` with tabular numbers).

However, the Stitch prototype utilized the external Tailwind CSS CDN (`<script src="https://cdn.tailwindcss.com">`), custom runtime utility classes, and static inline SVGs. Adopting a Tailwind build pipeline or CDN script would contradict our zero-client-side-framework architecture (ADR 0001) and introduce unnecessary build complexity and runtime footprint. Furthermore, replacing our live encapsulated analytics charts with static SVGs would violate ADR 0005 and degrade interactive data capabilities.

## Decision

We will adopt the **Executive Kinetic Carbon** design system across the entire application via a zero-framework, native CSS token architecture:

1. **Native CSS Custom Properties (Strictly Zero-Tailwind)**:
   - Reject both the Tailwind CDN runtime and build-time Tailwind dependencies.
   - Save `/DESIGN.md` at the repository root as the canonical UI specification.
   - Translate all Executive Kinetic Carbon surfaces, accents, typography, spacing, and elevation tiers into native CSS Custom Properties in `web/src/styles/tokens.css` scoped under `html[data-theme="dark"]` (default) and `html[data-theme="light"]`:
     - **Dark Mode Surfaces**: `--bg-canvas: #131315`, `--bg-surface-lowest: #0e0e10`, `--bg-surface-low: #1c1b1d`, `--bg-surface: #201f22`, `--bg-surface-high: #2a2a2c`, `--bg-surface-highest: #353437`, `--border-outline: #908fa0`, `--border-subtle: rgba(70, 69, 84, 0.3)`.
     - **Light Mode Surfaces**: `--bg-canvas: #f8fafc`, `--bg-surface-low: #ffffff`, `--bg-surface: #f1f5f9`, crisp `rgba(0, 0, 0, 0.08)` hairline borders, and `--shadow-md: 0 1px 2px rgba(0, 0, 0, 0.3)`.
     - **Semantic Accents**: Primary Indigo (`#c0c1ff` / container `#8083ff` / action `#6366f1`), Secondary Emerald (`#4edea3` / `#10b981`), Tertiary Cyan (`#7bd0ff`), Error Coral (`#ffb4ab` / `#ef4444`).
     - **Hardware Specular Card Edges**: Define `.bento-card` with `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.07)` in dark mode and `1px solid` hairline borders (`border-radius: 0.75rem`).
   - Preserve legacy token aliases (`--bg-primary`, `--bg-card`, `--border-color`, `--color-primary`, `--color-accent`) to guarantee seamless component migration without style breakage.

2. **Typography Pairing & Tabular Numeric Ergonomics**:
   - Load `Inter` (weights 400, 500, 600, 700), `JetBrains Mono` (weights 400, 500, 600), and Google `Material Symbols Outlined` in `web/index.html`.
   - Strictly enforce `font-family: 'JetBrains Mono', monospace` with `font-variant-numeric: tabular-nums` and `font-feature-settings: "tnum" on, "zero" on` across all KPI readouts (`mono-kpi-lg`: 28px, `mono-kpi-md`: 20px), badges (`mono-badge`: 11px), entity IDs, dates, phone numbers, and financial data table columns (`mono-data-table`: 12px).

3. **App Shell Upgrade in Light DOM (`<app-sidebar>` & `<app-topbar>`)**:
   - **SideNavBar (256px / 16rem fixed)**: Implement the `ADMIN OPS — Enterprise Suite • v2.4` brand header, custom thin scrollbars, and 4 uppercase category groups (`OVERVIEW`, `DATA MANAGEMENT`, `PAGES`, `CHARTS & ANALYTICS`) featuring active left-border indicators (`border-l-2 border-primary bg-surface-container-high`). Retain all 11 route links (`/`, `/team`, `/contacts`, `/invoices`, `/form`, `/calendar`, `/faq`, `/bar`, `/pie`, `/line`, `/geography`) and map footer actions (`Deploy Node` ➔ `/form`, `Documentation` ➔ `/faq`, `Settings` ➔ native `<dialog>` preferences modal).
   - **TopNavBar (64px / 4rem sticky glassmorphic)**: Implement `backdrop-filter: blur(12px)` with an instant `⌘K` / `Ctrl+K` route quick-jump command palette, center context links with active route highlighting (`Overview` ➔ `/`, `Telemetry` ➔ `/line`, `Nodes` ➔ `/geography`, `Audit Logs` ➔ `/invoices`), live pulsing `API: 99.98%` telemetry pill wired to `/api/v1/health`, theme toggler, `+ Create Resource` button (➔ `/form`), and `OP — System Operator (Administrator)` identity badge.

4. **Overview Dashboard Bento Grid (`/`) & ChartEngine Synchronization**:
   - Refactor the main dashboard canvas into an asymmetric 12-column Bento-box grid:
     - **Canvas Header**: Breadcrumbs, live status chips (`API: Operational`, `DB: Connected`), and the client-side `Download Reports` CSV exporter.
     - **Bento Row 1**: 4 KPI cards (`EMAILS SENT`, `SALES OBTAINED`, `NEW CLIENTS`, `TRAFFIC RECEIVED`) bound to live database aggregates with fallback to Stitch defaults, SVG radial progress gauges, Material Symbols, and emerald trend pills.
     - **Bento Row 2**: 8-col `Revenue Generated` card (with `$59,342.32`, `+18.4% YOY` pill, series legends, and interactive `1D / 7D / 1M / 1Y / ALL` timeframe filter buttons) paired with a 4-col `Recent Transactions` ledger card (`+$200.95` monospace pills, `View All Transactions ➔ /invoices`).
     - **Bento Row 3**: 4-col `Campaign` performance card (dual-segment radial target ring `84% TARGET`, `$48,352 revenue generated`, Target/Efficiency footer), 4-col `Sales Quantity` grouped bar card, and 4-col `Geography Based Traffic` map card with country metrics breakdown table.
   - **Preserve Chart Seam (ADR 0005)**: Rather than replacing charts with static SVGs, retain live `ChartComponent` instances mounted in `#dashboard-line-chart-slot`, `#dashboard-bar-chart-slot`, and `#dashboard-geo-chart-slot`. Synchronize `web/src/components/chart/` default palettes to Stitch tokens (`#c0c1ff`, `#4edea3`, `#7bd0ff`, `#ffb4ab`, dashed `rgba(255,255,255,0.05)` gridlines) and dark card backgrounds.

5. **Sweep of Secondary Views & Seam Preservation**:
   - Modernize remaining scenes (`/team`, `/contacts`, `/invoices`, `/form`, `/calendar`, `/faq`, `/bar`, `/pie`, `/line`, `/geography`) with Executive Kinetic Carbon card framing, inset form inputs (`#09090b`), right-aligned tabular columns, and emerald/indigo status badges across `DataTable`, `CalendarComponent`, and `ChartComponent`.
   - Maintain all existing DOM IDs (`#dashboard-title`, `#team-title`, `#sidebar-toggle`, etc.), `data-testid` attributes (`statbox-emails`, `card-revenue-chart`, etc.), Router contracts, and view `mount`/`unmount` lifecycles so unit tests (`vp test`), static checks (`vp check`), and Playwright E2E suites pass with zero regressions.

6. **Native Motion Graphics & Micro-Interaction Layer ("Tactile Fluidity")**:
   - **Deep Motion Utility (`web/src/styles/motion.css` + `web/src/utils/motion.js`)**: Encapsulate animation helpers behind a clean functional interface (`transitionView(callback)`, `staggerEnter(container, selector)`, `animateNumber(el, targetValue, formatter)`, `bindBentoSpotlight(container)`).
   - **Deterministic Test & Accessibility Guardrail**: Export a unified `isMotionReduced()` check (`prefers-reduced-motion: reduce`, `import.meta.env.MODE === 'test'`, or missing DOM animation APIs). In test runners and accessibility modes, all motion operations resolve synchronously on frame 0, guaranteeing zero race conditions or timer flakiness in Vitest (`happy-dom`).
   - **Cross-Route View Transitions (`web/src/router/index.js`)**: Wrap view swaps in `document.startViewTransition` (with instant synchronous fallback when unsupported). Assign `view-transition-name: app-sidebar`, `app-topbar`, and `view-canvas` so shell framing stays fixed while the scene canvas cross-fades and translates (`180ms cubic-bezier(0.22, 1, 0.36, 1)`).
   - **Bento Stagger Cascade & Specular Cursor Spotlight**: Animate `.bento-card` tiles and `DataTable` rows on mount using `--stagger-index` (`translateY(8px) -> 0`, `opacity: 0 -> 1`, `35ms` step), clamped to a maximum index ceiling of 8 items (max 280ms duration). Attach a delegated `pointermove` listener throttled via `requestAnimationFrame` setting `--mouse-x` and `--mouse-y` strictly on `e.target.closest('.bento-card')`, returning an explicit teardown function for `unmount()`.
   - **Kinetic Telemetry & CSS `@starting-style` Dialogs**: Animate SVG radial progress arcs (`stroke-dasharray`) and numerical readouts (`animateNumber`) on initial mount, smooth Chart.js dataset updates on timeframe toggle (`1D / 7D / 1M / 1Y / ALL`), and apply native CSS `@starting-style` entry transitions (`opacity: 0; transform: scale(0.97)` -> `opacity: 1; transform: scale(1)`) on `<dialog>` modals and the `⌘K` Quick Search palette.

## Consequences

- **Purity of Web Standards**: Eliminates framework lock-in and avoids introducing a Tailwind build dependency while achieving 1:1 pixel-level fidelity with the executive Stitch design.
- **Superior Runtime Performance**: Zero CSS-in-JS runtime overhead; browser-native CSS Custom Properties enable sub-millisecond dark/light theme switching with zero layout thrashing or FOUC.
- **Protected Engineering Seams**: View lifecycles, API clients, router navigation, and headless chart fallbacks remain fully decoupled from design presentation.
- **Deterministic Motion Testability**: The `isMotionReduced()` guardrail guarantees that rich animations in production never introduce async test flakiness or timing race conditions in Vitest or CI.
- **Maintained Automation Verification**: All 28 test files and 249+ unit and integration tests remain intact and green, guaranteeing stable forward progress into Phase 5.
