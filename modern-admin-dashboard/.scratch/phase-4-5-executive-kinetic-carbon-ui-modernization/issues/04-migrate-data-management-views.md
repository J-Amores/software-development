# 04: Batch Migrate Data Management Views (/team, /contacts, /invoices)

**What to build:** Modernize the shared `DataTable` component and data management views (`/team`, `/contacts`, `/invoices`) with Executive Kinetic Carbon card framing, inset search inputs, right-aligned JetBrains Mono tabular columns, and emerald/indigo status badges. Apply `staggerEnter` on table rows (capped at 8 items) for fluid entry transitions. Verify all data management unit tests stay 100% green.

**Blocked by:** 01: Expand Executive Kinetic Carbon Tokens, Typography Fonts, and App Shell Layout.

**Status:** ready-for-agent

- [ ] Update `web/src/styles/data-table.css` and `web/src/components/data-table.js` with `.bento-card` container styling, inset search input, and crisp table dividers (`1px solid rgba(255, 255, 255, 0.04)`)
- [ ] Enforce `font-family: 'JetBrains Mono', monospace` with `tabular-nums` on IDs, timestamps, phone numbers, and currency amount columns
- [ ] Modernize `TeamView` (`/team`) with Executive Kinetic Carbon headers and emerald/indigo/amber access level badges (`Admin`, `Manager`, `User`)
- [ ] Modernize `ContactsView` (`/contacts`) with refined search toolbar, pagination controls, and tabular contact detail formatting
- [ ] Modernize `InvoicesView` (`/invoices`) with financial ledger card styling, monospace currency formatting, and invoice date chips
- [ ] Apply `staggerEnter` on mounted table rows with stagger delay clamped at 8 items (max 280ms duration)
- [ ] Verify `web/test/data-table.test.js`, `web/test/team-view.test.js`, `web/test/contacts-view.test.js`, and `web/test/invoices-view.test.js` pass with zero regressions
