# 02: Deep Semantic HTML DataTable Component Module

**What to build:** A deep, zero-framework semantic HTML table component replacing legacy grid libraries. Encapsulates full internal state for column sorting, debounced text search filtering across visible columns, configurable pagination (page size, previous/next, jump), and row checkbox selection behind a minimal 4-method lifecycle interface, styled responsively using design system tokens.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] DataTable module renders accessible semantic HTML (`table`, `thead`, `tbody`, `th[aria-sort]`, pagination controls)
- [x] Users can sort table data ascending and descending by clicking sortable column headers
- [x] Users can filter rows in real time by typing into an integrated search input
- [x] Pagination controls allow navigating between pages and viewing current row counts (e.g. "Showing 1–10 of 25")
- [x] Optional row selection renders header and row checkboxes, tracking selected IDs without mutating underlying data
- [x] Module exposes a minimal public lifecycle interface: `mount`, `update`, `getSelectedRows`, and `unmount`
- [x] Visual presentation adapts seamlessly to dark and light modes using CSS custom properties
- [x] Automated tests verify sorting, search filtering, pagination transitions, and row selection states in an isolated DOM environment

## Comments

### Implementation Summary
- **DataTable Component (`web/src/components/data-table.js`)**: Deep zero-framework module encapsulating column sorting, real-time debounced text search, pagination (page size selection, range reporting, prev/next buttons), and row checkbox selection behind a minimal 4-method public lifecycle (`mount`, `update`, `getSelectedRows`, `unmount`).
- **DOM Stability & Event Delegation**: Retains stable structural DOM elements during updates; row selection toggles classes and state in-place without rebuilding `tbody` innerHTML, preserving active element references and cursor focus.
- **Styling (`web/src/styles/data-table.css`)**: Fully styled using CSS custom properties (`--bg-card`, `--bg-secondary`, `--color-primary`, `--color-success`, etc.), supporting light and dark modes with responsive horizontal scroll wrappers.
- **Verification**: 11 unit tests in `web/test/data-table.test.js` validating all interaction states under happy-dom; 55/55 tests passing across 8 suites in 464ms; 0 lint warnings via `vp check`.
