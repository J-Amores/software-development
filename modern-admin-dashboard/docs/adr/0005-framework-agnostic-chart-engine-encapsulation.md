# 0005. Framework-Agnostic Chart Engine Encapsulation in Deep Custom Module

- **Status**: accepted
- **Date**: 2026-10-17

## Context

The legacy admin dashboard relied on `@nivo/*` visualization components coupled directly to React component hierarchies. In Phase 4, we require high-performance, responsive analytics visualizations—including Bar, Pie, Line, and Choropleth Geography charts—across both standalone views (`/bar`, `/pie`, `/line`, `/geography`) and the main administrative overview (`/`). Using `@nivo/*` would violate our zero-client-side-framework architecture (ADR 0001), while building custom SVG/Canvas rendering engines from scratch for four distinct chart types would introduce significant development overhead and rendering fragility.

## Decision

We will install and encapsulate `chart.js`, `chartjs-chart-geo`, and `topojson-client` inside a single deep module (`web/src/components/chart/`) exposing a minimal DOM lifecycle interface (`mount(container, options)`, `update(options)`, `unmount()`):
- **Encapsulation Seam**: Neither view modules (`DashboardView`, `BarView`, `PieView`, `LineView`, `GeographyView`) nor test suites may import `chart.js` or `chartjs-chart-geo` directly. All Chart.js instances, scales, geo projections, geometries, and DOM canvas bindings are managed internally by the deep module.
- **Theme Synchronization**: The chart module subscribes directly to `ThemeManager` (`web/src/theme/index.js`) to dynamically read CSS custom properties from `tokens.css` (`--text-secondary`, `--border-color`, `--color-primary`, `--bg-card`, etc.), refreshing chart palette colors, axis grids, tooltips, and legends seamlessly during dark/light mode toggles.
- **Headless Fallback & Test Ergonomics**: Under headless DOM environments (`happy-dom` in Vitest) lacking native HTML5 Canvas 2D contexts, the deep module automatically falls back to rendering semantic HTML summary elements (`role="img"`, `aria-label`, data attributes, and accessible data summaries). This enables sub-second automated test runs without fragile canvas mocking or native C++ dependencies.

## Consequences

- **Zero React Overhead**: Preserves standard web technologies with zero React runtime or virtual DOM overhead shipped to the browser.
- **Protected Seam**: The underlying chart visualization engine can be swapped or upgraded without modifying view layers or automated tests.
- **Deterministic Testing**: View and component tests verify data fetching, lifecycle transitions, and DOM bindings cleanly and deterministically.
