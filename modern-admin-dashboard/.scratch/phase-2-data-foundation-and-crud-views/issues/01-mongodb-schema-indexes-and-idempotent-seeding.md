# 01: MongoDB Collections, Atomic Sequence Counters & Idempotent Seeding

**What to build:** The database foundation and idempotent seeding pipeline for the administrative platform. Initializes MongoDB collections for team members, contacts, invoices, transactions, and metrics with unique indexes; implements an atomic sequence generator to safely assign incremental integer IDs for new records; and provides an idempotent seeder that ports all source mock datasets using bulk upserts without duplicating records across repeated runs.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Database collections are established for `members`, `contacts`, `invoices`, `transactions`, `metrics`, and `counters`
- [x] Unique indexes are enforced on document business identifiers (`id` on members, contacts, and invoices; `txId` on transactions; `metricKey` on metrics)
- [x] Atomic sequence allocation safely increments integer IDs for any requested collection without race conditions
- [x] Database seeder script idempotently upserts all entities from the legacy dataset using bulk write operations
- [x] Invoices dataset normalizes legacy cost values to numeric floating-point amounts and dates to ISO-8601 strings
- [x] Metric datasets (bar, pie, line, geography) are stored as distinct partition documents indexed by metric key
- [x] Counter sequences are initialized to match the highest existing seed ID for each collection
- [x] Automated tests verify that executing the seeder multiple times produces identical document counts without error

## Comments

### Implementation Summary
- **Database Adapter Seam (`api/src/db.js`)**: Added `getDb(name)` resolving default database `admin_dashboard` across both local Docker and Atlas cluster URIs without hardcoding default `test` fallback.
- **Index Management (`api/src/db/indexes.js`)**: Implemented `ensureIndexes` creating unique indexes across `members` (`id`), `contacts` (`id`), `invoices` (`id`), `transactions` (`txId`), and `metrics` (`metricKey`).
- **Atomic Counters (`api/src/db/counters.js`)**: Implemented `getNextSequence` (atomic increment via `findOneAndUpdate` `$inc: { seq: 1 }`) and `setSequenceFloor` (`$max: { seq: floor }`) against the `counters` collection.
- **Idempotent Seeder (`api/src/db/seed.js`)**: Normalizes source mock data (financial `amount` as float, dates as ISO-8601, lowercase access tiers), upserts documents via `bulkWrite`, partitions chart metrics by `metricKey`, sets sequence counter floors (members=9, contacts=11, invoices=8), and exposes runner `runSeed()` via CLI and `npm run seed`.
- **Verification**: Executed live against MongoDB Atlas cluster (17ms latency) and verified repeated seed execution preserves identical collection counts without duplicating records. 44/44 automated tests passing across 7 suites in under 420ms; 0 lint warnings via `vp check`.
