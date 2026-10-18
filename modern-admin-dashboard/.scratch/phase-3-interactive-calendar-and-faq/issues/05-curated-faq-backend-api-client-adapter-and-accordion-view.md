# 05: Curated FAQ Backend API, Client Adapter, & Semantic Accordion View

**What to build:** A complete end-to-end vertical slice for the `/faq` module replacing the placeholder view. Implements the Fastify route `GET /api/v1/faqs` with JSON Schema validation and optional query string search filtering (`?q=`); extends the `ApiClient` and `createFakeApiClient` with `getFaqs(params)`; builds the accessible `/faq` view using semantic HTML `<details>` and `<summary>` accordions; provides a real-time search filter input evaluating questions and answers with automatic expansion of matching items; provides an "Expand All / Collapse All" toggle button for global accordion state control; and renders an accessible empty state message when no questions match the search query.

**Blocked by:** 01 (Database Indexes, Counters, and Idempotent Seeding for Calendar Events & FAQ Entries)

**Status:** resolved

- [x] `GET /api/v1/faqs` Fastify route returns curated FAQ Entries with optional text query filtering (`?q=`) and schema validation
- [x] Fastify endpoint is tested in-memory via `app.inject()` against the database adapter seam
- [x] `createApiClient` network adapter implements `getFaqs(params)`
- [x] `createFakeApiClient` in-memory test fake implements `getFaqs(params)` with stateful mock storage and query filtering
- [x] `/faq` route is wired in the router to mount `FaqView` replacing the placeholder view
- [x] View renders questions and answers as accessible semantic HTML `<details>` and `<summary>` accordions styled with CSS design tokens
- [x] Live search input filters visible accordions across both question titles and answer texts in real time
- [x] Matching accordions automatically expand (`open = true`) during active search queries to expose relevant answers immediately
- [x] "Expand All / Collapse All" toggle button expands or collapses all currently visible FAQ items
- [x] Clear empty-state feedback is displayed when zero FAQ entries match the search query
- [x] View cleanup (`unmount()`) cleanly removes DOM elements and tears down event listeners
- [x] Automated tests in Vitest verify initial rendering, query search filtering, auto-expansion, and global toggle behavior

## Resolution Comments
- Created `api/src/routes/faqs.js` implementing `GET /api/v1/faqs` with JSON Schema validation and `$regex` search filtering over question, answer, and category.
- Registered `faqsRoutes` in `api/src/app.js`.
- Implemented Fastify route tests in `api/test/faqs.test.js` (7 tests passing).
- Extended `createApiClient` and `createFakeApiClient` in `web/src/api/index.js` with `getFaqs(params)` supporting search filtering and sorting.
- Extended client tests in `web/test/api-client.test.js` (35 tests passing).
- Created `web/src/styles/faq.css` with semantic details/summary styles using existing tokens, imported into `main.css`.
- Implemented `FaqView` in `web/src/views/faq-view.js` with real-time live search, auto-expansion of matches, global Expand/Collapse All toggle, count badges, and empty/error states.
- Wired `/faq` in `web/src/routes.js` replacing `PlaceholderView`.
- Created comprehensive test suite in `web/test/faq-view.test.js` (13 tests passing).
- Validated complete project: 20 test files, 205 tests passing, 0 lint/formatting errors across 54 files.
