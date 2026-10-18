# 01: Chart Engine Dependencies and Database Seeding for Transactions & Metrics

**What to build:** Install frontend chart visualization libraries (`chart.js`, `chartjs-chart-geo`, `topojson-client`) into `web` via `vp install`. Ensure unique database index constraints on `txId` across `transactions` and `metricKey` across `metrics` in `api/src/db/indexes.js`. Extend `seedDatabase` in `api/src/db/seed.js` to idempotently upsert `mockTransactions` and partitioned `mockBarData`, `mockPieData`, `mockLineData`, and `mockGeographyData` into MongoDB using `bulkWrite` operations.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Chart visualization libraries installed into `web` package (`chart.js`, `chartjs-chart-geo`, `topojson-client`)
- [ ] Unique index constraint `idx_transactions_txid_unique` enforced on `transactions.txId`
- [ ] Unique index constraint `idx_metrics_key_unique` enforced on `metrics.metricKey`
- [ ] Database seeder script idempotently upserts `mockTransactions` into `transactions` collection via `bulkWrite`
- [ ] Database seeder script idempotently upserts partitioned `bar`, `pie`, `line`, and `geography` datasets into `metrics` collection via `bulkWrite`
- [ ] Automated tests in `api/test/seed.test.js` verify index creation, document normalization, and idempotent repeated seeder execution without duplicating records
- [ ] `vp test` and `vp check` pass cleanly

## Comments
