# 01: Expand Executive Kinetic Carbon Tokens, Typography Fonts, and App Shell Layout

**What to build:** Expand native CSS Custom Properties in `tokens.css` with the complete Executive Kinetic Carbon palette, typography, elevation tiers, and `.bento-card` hardware specular highlights while preserving legacy token aliases. Load `Inter`, `JetBrains Mono`, and `Material Symbols Outlined` in `index.html`. Upgrade `<app-sidebar>` (256px fixed, 4 uppercase categories, all 11 active routes, footer actions) and `<app-topbar>` (64px glassmorphic, `⌘K` / `Ctrl+K` quick search input with route quick-jump palette, live pulsing `API: 99.98%` pill wired to health check, active center context links, and settings modal) in Light DOM.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Load Google Fonts for `Inter` (400, 500, 600, 700), `JetBrains Mono` (400, 500, 600), and `Material Symbols Outlined` in `web/index.html`
- [ ] Define Executive Kinetic Carbon dark surfaces (`--bg-canvas: #131315`, `--bg-surface-lowest: #0e0e10`, `--bg-surface-low: #1c1b1d`, `--bg-surface: #201f22`, `--bg-surface-high: #2a2a2c`, `--bg-surface-highest: #353437`) and light contrast tier (`#f8fafc`, `#ffffff`, `#f1f5f9`) in `web/src/styles/tokens.css`
- [ ] Define semantic accents (Primary `#c0c1ff` / `#6366f1`, Secondary `#4edea3` / `#10b981`, Tertiary `#7bd0ff`, Error `#ffb4ab` / `#ef4444`) and `.bento-card` specular border styling (`box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.07)`, `border-radius: 0.75rem`)
- [ ] Retain legacy token aliases (`--bg-primary`, `--bg-card`, `--border-color`, `--color-primary`, `--color-accent`) to guarantee zero style breakage across unmigrated views
- [ ] Upgrade `<app-sidebar>` with fixed 256px width, `ADMIN OPS — Enterprise Suite • v2.4` header, `#sidebar-toggle` collapse button, 4 uppercase categories (`OVERVIEW`, `DATA MANAGEMENT`, `PAGES`, `CHARTS & ANALYTICS`), all 11 route links, active left-border indicator, and footer links (`Deploy Node` ➔ `/form`, `Documentation` ➔ `/faq`, `Settings`)
- [ ] Upgrade `<app-topbar>` with 64px sticky glassmorphic styling (`backdrop-filter: blur(12px)`), `⌘K` global search input with route quick-jump palette, active center links (`Overview` ➔ `/`, `Telemetry` ➔ `/line`, `Nodes` ➔ `/geography`, `Audit Logs` ➔ `/invoices`), live pulsing `API: 99.98%` status pill wired to `/api/v1/health`, theme toggler, `+ Create Resource` button (➔ `/form`), and `OP` System Operator identity badge
- [ ] Implement settings native `<dialog id="settings-dialog">` displaying workspace telemetry and theme toggle
- [ ] Verify `web/test/shell.test.js` and `vp check` pass cleanly
