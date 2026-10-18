# 02: Backend Fastify Analytics & Dashboard REST Endpoints & Client Adapter Seam

**What to build:** Expose backend Fastify REST endpoints for metrics, transactions, and composite dashboard queries with JSON Schema validation and database adapter queries. Extend `createApiClient` and `createFakeApiClient` in `web/src/api/index.js` to support `getMetrics(dataset)`, `getTransactions(params)`, and `getDashboardSummary()`.

**Blocked by:** 01

**Status:** resolved

- [x] `GET /api/v1/metrics/:dataset` endpoint validates `:dataset` enum (`bar`, `pie`, `line`, `geography`), returning 400 Bad Request on invalid keys and 404 Not Found if missing
- [x] `GET /api/v1/transactions` endpoint returns recent transactions sorted chronologically with an optional `limit` query parameter (default 10)
- [x] `GET /api/v1/dashboard` endpoint calculates live aggregates across collections (`invoices`, `transactions`, `contacts`, `members`), recent transactions, and chart datasets in a single roundtrip
- [x] Fastify routes use strict JSON Schema validation and query exclusively through the database adapter seam
- [x] `ApiClient` in `web/src/api/index.js` extended with `getMetrics`, `getTransactions`, and `getDashboardSummary`
- [x] In-memory `createFakeApiClient` updated with matching endpoints and realistic seed fixtures for frontend tests
- [x] Backend route unit tests in `api/test/metrics.test.js`, `api/test/transactions.test.js`, and `api/test/dashboard.test.js` pass with 100% coverage via `app.inject()`
- [x] `vp test` and `vp check` pass cleanly

## Comments

### Implementation Summary
- **Backend Routes**:
  - `api/src/routes/metrics.js`: `GET /api/v1/metrics/:dataset` validates `:dataset` enum (`bar`, `pie`, `line`, `geography`), returns 400 on invalid keys, and 404 if not found.
  - `api/src/routes/transactions.js`: `GET /api/v1/transactions` queries recent transactions sorted by date descending, respecting `limit` parameter.
  - `api/src/routes/dashboard.js`: `GET /api/v1/dashboard` aggregates live counts and revenue sums across `invoices`, `transactions`, `contacts`, and `members`, bundling recent transactions and partitioned chart payloads (`revenueLine`, `salesBar`, `geographyTraffic`).
  - Registered all three route plugins in `api/src/app.js`.
- **API Client Adapter**:
  - Extended `createApiClient` in `web/src/api/index.js` with `getMetrics(dataset)`, `getTransactions(params)`, and `getDashboardSummary()`.
  - Extended `createFakeApiClient` with in-memory stores and default fixtures for offline unit testing across views.
- **Automated Tests**:
  - Added unit test suites `api/test/metrics.test.js`, `api/test/transactions.test.js`, `api/test/dashboard.test.js`.
  - Extended `web/test/api-client.test.js` covering both real and fake API client implementations for all new endpoints.
  - All 23 test suites and 222 tests pass; `vp check` clean.
