# 06: End-to-End Playwright Smoke Test

**What to build:** An automated end-to-end browser smoke test verifying the integrated walking skeleton across all layers: app shell rendering, theme toggling, client-side route transitions, and live backend database health display.

**Blocked by:** 05: Vertical Tracer-Bullet Health Check and API Client Seam

**Status:** ready-for-agent

- [ ] End-to-end browser testing suite is configured and executable through unified workspace tasks
- [ ] Automated smoke test launches the web application in a headless browser and validates proper app shell structure
- [ ] Automated smoke test interacts with the theme toggle, verifying root theme attribute changes and visual styling transitions
- [ ] Automated smoke test clicks sidebar navigation links, verifying client-side routing, URL updates, and placeholder stub rendering
- [ ] Automated smoke test confirms that the dashboard successfully requests, receives, and displays live database health status from the backend API
- [ ] Complete end-to-end test executes cleanly and passes against live local services
