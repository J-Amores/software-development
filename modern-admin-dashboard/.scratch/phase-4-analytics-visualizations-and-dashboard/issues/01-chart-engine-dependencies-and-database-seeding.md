# 01: Chart Engine Dependencies and Database Seeding for Transactions & Metrics

**What to build:** Install frontend chart visualization libraries (`chart.js`, `chartjs-chart-geo`, `topojson-client`) into `web` via `vp install`. Ensure unique database index constraints on `txId` across `transactions` and `metricKey` across `metrics` in `api/src/db/indexes.js`. Extend `seedDatabase` in `api/src/db/seed.js` to idempotently upsert `mockTransactions` and partitioned `mockBarData`, `mockPieData`, `mockLineData`, and `mockGeographyData` into MongoDB using `bulkWrite` operations.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Chart visualization libraries installed into `web` package (`chart.js`, `chartjs-chart-geo`, `topojson-client`)
- [x] Unique index constraint `idx_transactions_txid_unique` enforced on `transactions.txId`
- [x] Unique index constraint `idx_metrics_key_unique` enforced on `metrics.metricKey`
- [x] Database seeder script idempotently upserts `mockTransactions` into `transactions` collection via `bulkWrite`
- [x] Database seeder script idempotently upserts partitioned `bar`, `pie`, `line`, and `geography` datasets into `metrics` collection via `bulkWrite`
- [x] Automated tests in `api/test/seed.test.js` verify index creation, document normalization, and idempotent repeated seeder execution without duplicating records
- [x] `vp test` and `vp check` pass cleanly

## Comments

### Implementation Summary
- Installed `chart.js` (v4.5.1), `chartjs-chart-geo` (v4.3.6), and `topojson-client` (v3.1.0) into `@modern-admin/web`.
- Verified unique indexes `idx_transactions_txid_unique` and `idx_metrics_key_unique` in `api/src/db/indexes.js`.
- Verified idempotent upsert operations in `api/src/db/seed.js` for `transactions` (`mockTransactions`) and `metrics` (`mockBarData`, `mockPieData`, `mockLineData`, `mockGeographyData`).
- Verified unit test suite in `api/test/seed.test.js` verifying unique indexing, schema normalization, and repeated idempotent execution across all 7 collections. All 20 test suites (205 tests) passing cleanly.
