# 02: Backend Fastify Analytics & Dashboard REST Endpoints & Client Adapter Seam

**What to build:** Expose backend Fastify REST endpoints for metrics, transactions, and composite dashboard queries with JSON Schema validation and database adapter queries. Extend `createApiClient` and `createFakeApiClient` in `web/src/api/index.js` to support `getMetrics(dataset)`, `getTransactions(params)`, and `getDashboardSummary()`.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `GET /api/v1/metrics/:dataset` endpoint validates `:dataset` enum (`bar`, `pie`, `line`, `geography`), returning 400 Bad Request on invalid keys and 404 Not Found if missing
- [ ] `GET /api/v1/transactions` endpoint returns recent transactions sorted chronologically with an optional `limit` query parameter (default 10)
- [ ] `GET /api/v1/dashboard` endpoint calculates live aggregates across collections (`invoices`, `transactions`, `contacts`, `members`), recent transactions, and chart datasets in a single roundtrip
- [ ] Fastify routes use strict JSON Schema validation and query exclusively through the database adapter seam
- [ ] `ApiClient` in `web/src/api/index.js` extended with `getMetrics`, `getTransactions`, and `getDashboardSummary`
- [ ] In-memory `createFakeApiClient` updated with matching endpoints and realistic seed fixtures for frontend tests
- [ ] Backend route unit tests in `api/test/metrics.test.js`, `api/test/transactions.test.js`, and `api/test/dashboard.test.js` pass with 100% coverage via `app.inject()`
- [ ] `vp test` and `vp check` pass cleanly

## Comments
