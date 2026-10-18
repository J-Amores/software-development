# 01: Database Indexes, Counters, and Idempotent Seeding for Calendar Events & FAQ Entries

**What to build:** The persistence layer foundation and idempotent database seeding pipeline for Calendar Events and FAQ Entries. Enforces unique index constraints on `id` across both `events` and `faqs` collections; establishes the atomic sequence counter floor for `events` so newly scheduled events receive safe, sequential integer IDs; and extends `seedDatabase` in `api/src/db/seed.js` (`vp run seed`) to upsert initial Calendar Events and realistic, domain-accurate FAQ Entries (addressing Operator access, Invoice billing rules, Calendar milestone scheduling, and Contact compliance) using bulk upserts without duplicating records across repeated runs.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Database collections are established for `events` and `faqs`
- [x] Unique index constraints on document business identifiers are enforced (`idx_events_id_unique` on `events.id`, `idx_faqs_id_unique` on `faqs.id`)
- [x] Initial Calendar Events are seeded with sequential integer IDs (`id: 1, 2, ...`), titles, start/end dates, and all-day indicators
- [x] Initial FAQ Entries are seeded with sequential integer IDs (`id: 1, 2, ...`), curated domain-accurate questions, answers, and category tags, completely replacing legacy lorem ipsum
- [x] Atomic sequence counter floor is initialized for `events` matching the highest existing seed ID
- [x] Database seeder script idempotently upserts all documents using `bulkWrite` operations without duplicating records on repeated runs
- [x] Automated tests verify index creation, atomic counter floor initialization, and idempotent repeated seeder execution

## Comments

### Implementation Summary
- **Mock Data (`data/mockData.js`)**: Added `mockEvents` (6 domain-rich scheduled operational milestones and appointments with sequential IDs 1–6, start/end timestamps, and all-day flags) and `mockFaqs` (6 realistic administrative inquiries covering Access Levels, Invoice billing cycles, Calendar milestone scheduling, and Contact compliance, completely replacing legacy lorem ipsum).
- **Index Management (`api/src/db/indexes.js`)**: Extended `ensureIndexes` to enforce unique indexes `idx_events_id_unique` on `events.id` and `idx_faqs_id_unique` on `faqs.id`.
- **Idempotent Seeder (`api/src/db/seed.js`)**: Extended `seedDatabase` to upsert `events` and `faqs` via `bulkWrite`, set atomic sequence floor for `events` (`events: 6`), and updated document counts and runner summary logging in `runSeed()`.
- **Testing & Verification (`api/test/seed.test.js`)**: Updated unit tests to verify unique indexes across all 7 collections, verified document models and normalization for `events` and `faqs`, and confirmed strict idempotency across repeated seed runs. 15/15 test suites and 137 tests passing cleanly in under 1 second; `vp check` passing with 0 warnings or lint errors.
