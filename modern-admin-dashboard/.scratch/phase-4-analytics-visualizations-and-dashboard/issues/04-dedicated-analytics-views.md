# 04: Dedicated Analytics Views for Bar, Pie, Line, and Geography Scenes

**What to build:** Replace placeholder stubs across `/bar`, `/pie`, `/line`, and `/geography` with full-featured analytics view components adhering to the standard view lifecycle (`mount`, `unmount`). Each view fetches its dataset from the injected `ApiClient`, renders descriptive header subtitles and breadcrumbs, and mounts the encapsulated chart component inside a responsive layout. Wire routes in `web/src/routes.js` and sidebar active states in `web/src/components/sidebar/index.js`.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] `BarView` (`/bar`) implemented with header, category metrics, and deep chart mounting
- [ ] `PieView` (`/pie`) implemented with header, category allocations, and deep chart mounting
- [ ] `LineView` (`/line`) implemented with header, multi-series longitudinal metrics, and deep chart mounting
- [ ] `GeographyView` (`/geography`) implemented with header, sovereign nation traffic distribution choropleth, and deep chart mounting
- [ ] Routes registered in `web/src/routes.js` with active navigation states synchronized in sidebar
- [ ] Unit tests for all 4 views in `web/test/bar-view.test.js`, `web/test/pie-view.test.js`, `web/test/line-view.test.js`, and `web/test/geography-view.test.js` pass with 100% coverage via `createFakeApiClient`
- [ ] `vp test` and `vp check` pass cleanly

## Comments
