# 03: Encapsulated Framework-Agnostic Deep Chart Module with Theme & Test Fallback

**What to build:** Encapsulate vanilla Chart.js, Choropleth Geo plugins (`chartjs-chart-geo`), and TopoJSON client utilities inside a single custom deep module `web/src/components/chart/index.js` behind a clean DOM lifecycle interface (`mount`, `update`, `unmount`). Synchronize chart palettes, grid lines, and tooltips directly with `ThemeManager` CSS custom properties, and provide an accessible, semantic HTML fallback (`role="img"`, `aria-label`, data attributes, structured series summary) when running under headless DOM testing environments lacking Canvas 2D contexts. Bundle or wire static world map GeoJSON geometries (`data/mockGeoFeatures.js`).

**Blocked by:** 01

**Status:** resolved

- [x] Encapsulate Chart.js, `chartjs-chart-geo`, and TopoJSON utilities in `web/src/components/chart/index.js`
- [x] Expose minimal public interface: `mount(container, { type, data, options, isDashboard })`, `update(data, options)`, `unmount()`
- [x] Callers, views, and view tests never import `chart.js` or `chartjs-chart-geo` directly
- [x] Chart styling subscribes to `themeManager` to read tokens from `tokens.css` dynamically updating axis lines, grids, tooltips, and legends upon theme change events
- [x] Automatic fallback to accessible semantic DOM elements (`role="img"`, `aria-label`, data attributes, series data summary) when running in headless test environments lacking Canvas 2D context
- [x] World map polygon geometries handled via client topological data and merged with server metrics for Choropleth maps
- [x] Comprehensive unit tests in `web/test/chart-component.test.js` verify lifecycle, theme change events, fallback rendering, and error handling
- [x] `vp test` and `vp check` pass cleanly

## Comments

### Implementation Summary
- **Deep Module Architecture**: Built `web/src/components/chart/index.js` providing full encapsulation of `chart.js` and `chartjs-chart-geo` behind a clean DOM lifecycle (`mount`, `update`, `unmount`).
- **Headless Fallback**: Employs Canvas 2D context detection (`hasCanvas2D`); in headless environments like `happy-dom`, automatically renders semantic DOM fallback with `role="img"`, `aria-label`, `data-chart-type`, and structured `<div class="chart-summary sr-only" data-testid="chart-summary">` series breakdowns.
- **Theme Sync**: Subscribes directly to `themeManager`, reading `--text-secondary`, `--border-color`, `--color-primary`, and `--bg-card` from CSS Custom Properties and dynamically updating scales and legends on theme transitions.
- **Geospatial Decoupling**: Dynamically binds client topological `geoFeatures` with server metrics for Choropleth maps.
- **Tests**: Comprehensive unit test suite in `web/test/chart-component.test.js` covering lifecycle, fallback rendering, chart type summaries, and theme change listeners.
