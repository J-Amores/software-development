# 03: Encapsulated Framework-Agnostic Deep Chart Module with Theme & Test Fallback

**What to build:** Encapsulate vanilla Chart.js, Choropleth Geo plugins (`chartjs-chart-geo`), and TopoJSON client utilities inside a single custom deep module `web/src/components/chart/index.js` behind a clean DOM lifecycle interface (`mount`, `update`, `unmount`). Synchronize chart palettes, grid lines, and tooltips directly with `ThemeManager` CSS custom properties, and provide an accessible, semantic HTML fallback (`role="img"`, `aria-label`, data attributes, structured series summary) when running under headless DOM testing environments lacking Canvas 2D contexts. Bundle or wire static world map GeoJSON geometries (`data/mockGeoFeatures.js`).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Encapsulate Chart.js, `chartjs-chart-geo`, and TopoJSON utilities in `web/src/components/chart/index.js`
- [ ] Expose minimal public interface: `mount(container, { type, data, options, isDashboard })`, `update(data, options)`, `unmount()`
- [ ] Callers, views, and view tests never import `chart.js` or `chartjs-chart-geo` directly
- [ ] Chart styling subscribes to `themeManager` to read tokens from `tokens.css` dynamically updating axis lines, grids, tooltips, and legends upon theme change events
- [ ] Automatic fallback to accessible semantic DOM elements (`role="img"`, `aria-label`, data attributes, series data summary) when running in headless test environments lacking Canvas 2D context
- [ ] World map polygon geometries handled via client topological data and merged with server metrics for Choropleth maps
- [ ] Comprehensive unit tests in `web/test/chart-component.test.js` verify lifecycle, theme change events, fallback rendering, and error handling
- [ ] `vp test` and `vp check` pass cleanly

## Comments
